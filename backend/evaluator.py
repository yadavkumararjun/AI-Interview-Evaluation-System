"""
Answer-evaluation engine (v2).

Upgrades over the previous version:

  1. Semantic score no longer silently becomes 0.0 when
     sentence-transformers / model weights aren't available. It falls
     back to a lexical proxy and *tells the caller it did so*
     (`semantic_is_real=False`), and the scoring weights shift to lean
     less on that proxy instead of pretending it's a real embedding.

  2. Concept coverage is now embedding-based (checked against the
     whole answer AND each sentence individually, so a concept buried
     in a long answer isn't diluted), with exact-phrase and
     word-overlap as fallbacks/fast-paths rather than the only signal.
     This catches paraphrases ("cuts down on repeated work" for
     "reduces redundancy") that the old word-overlap check missed.

  3. Lexical similarity blends TF-IDF (with bigrams, so phrase order
     matters a little) with a plain Jaccard overlap, which is more
     stable on short answers than TF-IDF alone.

  4. The old two-branch "if semantic < 0.35 and concept < 0.25: *0.35"
     penalty produced a hard, visible cliff right at the threshold.
     It's replaced with a continuous logistic penalty that has the
     same worst-case and best-case bounds but no discontinuity.

  5. Completeness is judged relative to the expected answer's length
     (a smooth ramp to full credit at ~70% of expected length) instead
     of fixed absolute word-count buckets, so short expected answers
     don't get unfairly penalized and long expected answers don't get
     a free pass at 25 words.

  6. Embeddings are cached per input string (not just per model load),
     and model loading tries a stronger model first with a fallback.

Public API is unchanged: evaluate_answer(question, candidate) -> dict.
"""

from __future__ import annotations

import math
import re
from functools import lru_cache
from typing import Iterable, List, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except Exception:
    SentenceTransformer = None
    _ST_AVAILABLE = False


# --------------------------------------------------
# CONFIG
# --------------------------------------------------

# Try a stronger general-purpose model first; fall back to a lighter
# one if the larger weights can't be loaded in this environment.
MODEL_CANDIDATES = (
    "all-mpnet-base-v2",
    "all-MiniLM-L6-v2",
)

CONCEPT_SEMANTIC_THRESHOLD = 0.55   # embedding similarity => concept "hit"
CONCEPT_WORD_OVERLAP_THRESHOLD = 0.60  # fallback when embeddings unavailable

_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


# --------------------------------------------------
# MODEL / EMBEDDING PLUMBING
# --------------------------------------------------

@lru_cache(maxsize=1)
def get_model():
    """Load the best available sentence-transformers model.

    Returns None if the library or every candidate model is
    unavailable. Callers MUST treat None as "semantic signal
    unavailable" and use a fallback rather than treating a missing
    model the same as "these two texts are unrelated".
    """
    if not _ST_AVAILABLE:
        return None
    for name in MODEL_CANDIDATES:
        try:
            return SentenceTransformer(name)
        except Exception:
            continue
    return None


@lru_cache(maxsize=1024)
def embed(text: str):
    """Cached embedding lookup. Returns None if no model is available."""
    model = get_model()
    if model is None:
        return None
    return model.encode(text, normalize_embeddings=True)


# --------------------------------------------------
# TEXT PROCESSING
# --------------------------------------------------

def normalize(text: str) -> str:
    text = text or ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def get_words(text: str) -> set:
    return set(normalize(text).split())


def word_count(text: str) -> int:
    return len(normalize(text).split())


def split_sentences(text: str) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    parts = _SENTENCE_SPLIT_RE.split(text)
    return [p.strip() for p in parts if p.strip()]


# --------------------------------------------------
# LEXICAL SIMILARITY
# --------------------------------------------------

def tfidf_similarity(expected: str, candidate: str) -> float:
    """Blend of TF-IDF cosine (unigrams+bigrams) and Jaccard overlap.

    TF-IDF alone is noisy on very short texts (a single shared rare
    word can dominate); Jaccard is a cheap, corpus-independent sanity
    check that keeps the signal stable.
    """
    if not candidate.strip():
        return 0.0

    try:
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform([expected, candidate])
        tfidf_sim = float(cosine_similarity(matrix[0], matrix[1])[0][0])
    except ValueError:
        # e.g. both texts are entirely stop-words after normalization
        tfidf_sim = 0.0

    exp_words, cand_words = get_words(expected), get_words(candidate)
    union = exp_words | cand_words
    jaccard = (len(exp_words & cand_words) / len(union)) if union else 0.0

    return 0.7 * tfidf_sim + 0.3 * jaccard


# --------------------------------------------------
# CONCEPT COVERAGE
# --------------------------------------------------

def concept_match(candidate: str, concepts: List[str]) -> Tuple[float, List[str], List[str]]:
    if not concepts:
        return 0.0, [], []

    candidate_text = normalize(candidate)
    candidate_words = get_words(candidate)

    cand_emb = embed(candidate)
    sentence_embs = [(s, embed(s)) for s in split_sentences(candidate)]

    matched, missed = [], []

    for concept in concepts:
        concept_text = normalize(concept)
        if not concept_text:
            continue

        # 1) Exact phrase match — cheapest, most confident signal.
        if concept_text in candidate_text:
            matched.append(concept)
            continue

        # 2) Embedding match against the whole answer AND each
        #    sentence, so a concept buried in a long answer isn't
        #    diluted by averaging over unrelated sentences.
        concept_emb = embed(concept)
        if concept_emb is not None:
            best = 0.0
            if cand_emb is not None:
                best = max(best, float(concept_emb @ cand_emb))
            for _, s_emb in sentence_embs:
                if s_emb is not None:
                    best = max(best, float(concept_emb @ s_emb))
            if best >= CONCEPT_SEMANTIC_THRESHOLD:
                matched.append(concept)
                continue

        # 3) Lexical fallback (used when embeddings are unavailable,
        #    or as a last check for short/keyword-style concepts).
        concept_words = set(concept_text.split())
        if concept_words:
            overlap = len(concept_words & candidate_words) / len(concept_words)
            if overlap >= CONCEPT_WORD_OVERLAP_THRESHOLD:
                matched.append(concept)
                continue

        missed.append(concept)

    score = len(matched) / len(concepts)
    return score, matched, missed


# --------------------------------------------------
# SEMANTIC SIMILARITY
# --------------------------------------------------

def semantic_similarity(expected: str, candidate: str) -> Tuple[float, bool]:
    """Returns (score, used_real_embeddings).

    If embeddings aren't available, falls back to the lexical score
    instead of silently returning 0.0 — a missing model dependency
    should not look identical to "this answer is off-topic".
    """
    if not candidate.strip():
        return 0.0, False

    exp_emb, cand_emb = embed(expected), embed(candidate)
    if exp_emb is not None and cand_emb is not None:
        sim = float(exp_emb @ cand_emb)
        return max(0.0, min(sim, 1.0)), True

    return tfidf_similarity(expected, candidate), False


# --------------------------------------------------
# COMPLETENESS
# --------------------------------------------------

def completeness(candidate: str, expected: str) -> float:
    """Judged relative to the expected answer's length rather than
    fixed absolute word-count buckets, so a concise correct answer to
    a question with a short expected answer isn't penalized, and a
    padded answer to a question needing a long explanation doesn't
    get a free pass at an arbitrary word count.
    """
    cand_len = word_count(candidate)
    if cand_len == 0:
        return 0.0

    exp_len = max(word_count(expected), 1)
    ratio = cand_len / exp_len

    target = 0.7  # full credit once candidate reaches 70% of expected length
    floor = 0.10
    if ratio >= target:
        return 1.0
    return floor + (1.0 - floor) * (ratio / target)


# --------------------------------------------------
# RELEVANCE
# --------------------------------------------------

def relevance_score(semantic: float, lexical: float, concept_score: float,
                     semantic_is_real: bool) -> float:
    if semantic_is_real:
        w_sem, w_lex, w_con = 0.45, 0.25, 0.30
    else:
        # `semantic` is already a lexical proxy here — don't double
        # count it against `lexical`; lean more on concept coverage.
        w_sem, w_lex, w_con = 0.20, 0.35, 0.45

    relevance = w_sem * semantic + w_lex * lexical + w_con * concept_score
    return max(0.0, min(relevance, 1.0))


def _low_relevance_penalty(semantic: float, concept_score: float) -> float:
    """Continuous replacement for the old two-branch hard cutoff.

    Old logic: if semantic < 0.35 and concept < 0.25: score *= 0.35
               elif semantic < 0.45 and concept < 0.25: score *= 0.55
    That produced a visible score jump right at the thresholds.  This
    keeps the same worst-case (0.35x) and near-1.0 best-case bounds,
    but transitions smoothly, and still lets strong concept coverage
    compensate for a weak semantic score (or vice versa).
    """
    signal = 0.6 * semantic + 0.4 * concept_score
    steepness = 12
    midpoint = 0.32
    logistic = 1 / (1 + math.exp(-steepness * (signal - midpoint)))
    return 0.35 + 0.65 * logistic


# --------------------------------------------------
# FINAL SCORE
# --------------------------------------------------

def calculate_score(semantic: float, lexical: float, concept_score: float,
                     complete: float, semantic_is_real: bool) -> float:
    relevance = relevance_score(semantic, lexical, concept_score, semantic_is_real)

    # Correctness/relevance dominant; completeness can improve a good
    # answer but can't rescue a fundamentally unrelated one.
    score = 0.80 * relevance + 0.20 * complete
    score *= _low_relevance_penalty(semantic, concept_score)

    return max(0.0, min(score, 1.0))


# --------------------------------------------------
# PERFORMANCE LEVEL
# --------------------------------------------------

def get_level(score: float) -> str:
    if score >= 8:
        return "Excellent"
    if score >= 6:
        return "Good"
    if score >= 4:
        return "Average"
    if score >= 2:
        return "Weak"
    return "Incorrect"


# --------------------------------------------------
# FEEDBACK
# --------------------------------------------------

def generate_feedback(score: float, semantic: float, concept_score: float,
                       matched: List[str], missed: List[str], candidate: str) -> List[str]:
    feedback = []

    if score >= 8:
        feedback.append("Your answer demonstrates a strong understanding of the expected concept.")
    elif score >= 6:
        feedback.append("Your answer is generally correct, but some important details could be explained more clearly.")
    elif score >= 4:
        feedback.append("Your answer is related to the topic, but the explanation is incomplete or lacks important concepts.")
    elif score >= 2:
        feedback.append("Your answer shows limited alignment with the expected concept.")
    else:
        feedback.append("Your answer does not adequately address the concept asked in the question.")

    if semantic < 0.35:
        feedback.append("The meaning of your explanation is substantially different from the expected answer.")
    elif semantic < 0.60:
        feedback.append("Your answer has some semantic connection to the topic, but needs greater accuracy.")
    else:
        feedback.append("Your explanation is semantically aligned with the expected answer.")

    if matched:
        feedback.append("Concepts covered: " + ", ".join(matched) + ".")
    if missed:
        feedback.append("Important concepts to consider: " + ", ".join(missed) + ".")

    if word_count(candidate) < 12:
        feedback.append("Add a definition, explanation, and a simple example to make your answer stronger.")

    return feedback


# --------------------------------------------------
# MAIN EVALUATION FUNCTION
# --------------------------------------------------

def evaluate_answer(question: dict, candidate: str) -> dict:
    candidate = candidate or ""
    expected = question["expected_answer"]

    concepts = question.get("key_concepts", [])
    if isinstance(concepts, str):
        concepts = [c.strip() for c in concepts.split(";") if c.strip()]

    warnings = []
    if get_model() is None:
        warnings.append(
            "Semantic embedding model unavailable in this environment; "
            "falling back to lexical similarity for the semantic signal "
            "(scores may be slightly less accurate for paraphrased answers)."
        )

    if not normalize(candidate):
        return {
            "score": 0.0,
            "level": "Incorrect",
            "tfidf_similarity": 0.0,
            "concept_coverage": 0.0,
            "semantic_similarity": 0.0,
            "completeness": 0.0,
            "matched_concepts": [],
            "missed_concepts": concepts,
            "feedback": ["No answer was provided."],
            "warnings": warnings,
        }

    lexical = tfidf_similarity(expected, candidate)
    concept_score, matched, missed = concept_match(candidate, concepts)
    semantic_raw, semantic_is_real = semantic_similarity(expected, candidate)
    semantic = max(0.0, min(semantic_raw, 1.0))
    complete = completeness(candidate, expected)

    final_score = calculate_score(semantic, lexical, concept_score, complete, semantic_is_real)
    score = round(final_score * 10, 2)
    level = get_level(score)
    feedback = generate_feedback(score, semantic, concept_score, matched, missed, candidate)

    return {
        "score": score,
        "level": level,
        "tfidf_similarity": round(lexical * 100, 2),
        "concept_coverage": round(concept_score * 100, 2),
        "semantic_similarity": round(semantic * 100, 2),
        "completeness": round(complete * 100, 2),
        "matched_concepts": matched,
        "missed_concepts": missed,
        "feedback": feedback,
        "warnings": warnings,
    }