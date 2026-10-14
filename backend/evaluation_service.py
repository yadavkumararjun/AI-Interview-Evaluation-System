"""
Evaluation Service for AI Mock Interview Evaluation System.
Provides:
  1. Role-aware and experience-calibrated evaluation prompt generation with question rubrics and expected concepts.
  2. Safe JSON parsing of LLM evaluation output with malformed response fallback.
  3. Deterministic Python score aggregation, range validation, and category weighting.
"""

import json
from typing import Dict, Any, List, Optional, Tuple

# Canonical category evaluation weights for deterministic aggregation
CATEGORY_WEIGHTS = {
    "technical": 2.5,          # Core role technical competency
    "coding": 1.5,             # Practical problem-solving and algorithmic implementation
    "communication": 1.0,      # Clarity, pacing, articulation
    "relevance": 1.0,          # Directness and answer alignment
    "structure": 1.0,          # Logical flow and framework usage
    "specificity": 1.0,        # Concrete examples and evidence depth
    "behavioral": 1.0,         # Collaboration, resilience, self-reflection
    "project_discussion": 1.0, # Architectural trade-offs, ownership, impact
}

EXPERIENCE_CALIBRATIONS = {
    "beginner": (
        "BEGINNER LEVEL EXPECTATION:\n"
        "- Assess foundational conceptual correctness, understanding of primary principles, and basic syntax.\n"
        "- Expect standard textbook/academic examples.\n"
        "- Do not penalize for lack of enterprise-scale architecture experience if the core concept is sound.\n"
        "- Distinguish between minor omissions and outright conceptual errors."
    ),
    "intermediate": (
        "INTERMEDIATE LEVEL EXPECTATION:\n"
        "- Assess practical real-world application, debugging intuition, and component integration.\n"
        "- Look for awareness of trade-offs (e.g. speed vs maintainability, state models, latency).\n"
        "- Expect concrete answers grounded in hands-on development or project scenarios."
    ),
    "advanced": (
        "ADVANCED / SENIOR LEVEL EXPECTATION:\n"
        "- Assess architectural depth, scalability constraints, system resilience, and edge-case handling.\n"
        "- Look for deep reasoning regarding trade-offs, performance optimization, and operational reliability.\n"
        "- Expect nuanced explanations of system mechanics and failure recovery."
    )
}


def build_role_aware_evaluation_prompt(
    answers: List[Dict[str, Any]],
    role_id: str,
    role_title: str,
    experience_level: str
) -> str:
    """
    Construct a comprehensive, role-aware evaluation prompt.
    Includes question-specific rubrics, expected concepts, difficulty, and experience calibration.
    """
    level_key = experience_level.lower().strip() if isinstance(experience_level, str) else "beginner"
    calibration_text = EXPERIENCE_CALIBRATIONS.get(level_key, EXPERIENCE_CALIBRATIONS["beginner"])

    # Format the candidate's interview records with question-specific rubrics
    formatted_responses = []
    for idx, ans in enumerate(answers, 1):
        q_item = {
            "index": idx,
            "question_id": ans.get("question_id", f"Q_{idx}"),
            "stage": ans.get("stage", "general"),
            "category": ans.get("category", "General"),
            "skill": ans.get("skill", ans.get("category", "General")),
            "topic": ans.get("topic", ans.get("skill", "")),
            "difficulty": ans.get("difficulty", "medium"),
            "is_coding": ans.get("is_coding", False),
            "question_prompt": ans.get("question", ""),
            "evaluation_rubric": ans.get("evaluation_rubric", []),
            "expected_concepts": ans.get("expected_concepts", []),
            "candidate_answer": ans.get("answer") or ans.get("candidate_answer", "")
        }
        formatted_responses.append(q_item)

    prompt = f"""You are an expert AI technical mock interview evaluator.

The candidate completed a practice mock interview for the following position:
- Target Job Role: {role_title} ({role_id})
- Seniority Level: {experience_level.capitalize()}

=======================================================
EXPERIENCE LEVEL CALIBRATION:
{calibration_text}
=======================================================

EVALUATION RULES & EVIDENCE-BASED SCORING:
1. Evaluate each answer against its own question-specific rubric and topic.
   - For a Web Development question, evaluate using the web development rubric.
   - For an AI/ML question, evaluate using the AI/ML rubric.
   - For a Data Engineering question, evaluate using the data engineering rubric.
   - Never evaluate an answer using unrelated role concepts.
2. Expected concepts are evaluation references, NOT an exact keyword requirement. Accept technically correct alternative explanations, frameworks, or synonyms.
3. Base your evaluation strictly on the candidate's actual answers. Do NOT invent statements or assume knowledge the candidate did not demonstrate.
4. For each category:
   - Assign an objective score from 0.0 to 10.0 (or null if unassessed).
   - If an area was not covered or had insufficient evidence, set "score": null, set "assessed": false, and explain in feedback without penalizing the candidate.
   - If an area was tested and demonstrated zero competence, assign 0.0 with "assessed": true.
5. In your category evaluations:
   - Provide concrete evidence citing the candidate's words or technical choices.
   - Clearly separate correct points demonstrated from missing points or misconceptions.
   - Calibrate the depth of feedback to the candidate's experience level ({experience_level.capitalize()}).
6. Do NOT evaluate personality, tone, honesty, or make hiring decisions. This is educational practice feedback.

Return ONLY a valid JSON object matching the schema below without Markdown fences.

REQUIRED JSON OUTPUT FORMAT:
{{
  "overall_summary": "Concise 2-4 sentence executive summary of candidate performance aligned to {role_title} ({experience_level.capitalize()}).",
  "technical": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Detailed technical observations specific to the role's domain.",
    "evidence": "Concrete citation or example from candidate answers.",
    "correct_points": ["Correct point 1", "Correct point 2"],
    "missing_points": ["Missing concept 1"]
  }},
  "coding": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Observations on algorithmic reasoning, code structure, and edge cases.",
    "evidence": "Citation from candidate coding answers.",
    "correct_points": ["Handled core algorithm cleanly"],
    "missing_points": ["Missed zero-division or empty input edge case"]
  }},
  "communication": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Pacing, clarity, and articulation evaluation.",
    "evidence": "Citation from answers."
  }},
  "relevance": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Directness and alignment to questions asked.",
    "evidence": "Citation from answers."
  }},
  "structure": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Logical organization and framework delivery.",
    "evidence": "Citation from answers."
  }},
  "specificity": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Use of concrete examples, metrics, and technical depth.",
    "evidence": "Citation from answers."
  }},
  "behavioral": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Situational awareness, teamwork, feedback reception, and ownership.",
    "evidence": "Citation from answers."
  }},
  "project_discussion": {{
    "score": 0.0,
    "assessed": true,
    "feedback": "Project architecture, technical trade-offs, and debugging depth.",
    "evidence": "Citation from answers."
  }},
  "per_question_feedback": [
    {{
      "question_id": "Q_ID",
      "stage": "technical",
      "skill": "Skill Name",
      "score": 7.5,
      "assessed": true,
      "feedback": "Targeted feedback on this specific question response.",
      "evidence": "Evidence excerpt from candidate answer.",
      "correct_points": ["Point demonstrated"],
      "missing_points": ["Point omitted or erroneous"]
    }}
  ],
  "strengths": [
    "Concrete strength supported by interview evidence 1",
    "Concrete strength supported by interview evidence 2"
  ],
  "improvements": [
    "Actionable improvement linked to specific skill 1",
    "Actionable improvement linked to specific skill 2"
  ],
  "final_feedback": [
    "Actionable recommendation for practice or learning 1",
    "Actionable recommendation for practice or learning 2"
  ]
}}

CANDIDATE INTERVIEW RESPONSES & QUESTION-SPECIFIC RUBRICS:
{json.dumps(formatted_responses, indent=2, ensure_ascii=False)}
"""
    return prompt


def validate_and_clamp_score(raw_val: Any) -> Optional[float]:
    """
    Validate and clamp a numeric score strictly to [0.0, 10.0].
    Returns None if raw_val is None, unparseable, or invalid.
    """
    if raw_val is None:
        return None
    try:
        val = float(raw_val)
        if val != val:  # NaN check
            return None
        return round(max(0.0, min(10.0, val)), 1)
    except (ValueError, TypeError):
        return None


def calculate_deterministic_scores(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute deterministic score aggregation in Python.
    Prevents LLM arithmetic hallucinations and strictly respects unassessed categories.
    
    Formula:
      overall_score = sum(weight_i * score_i) / sum(weight_i)
      where i in assessed categories.
    
    Excludes unassessed or null categories from both numerator and denominator.
    """
    assessed_weighted_sum = 0.0
    total_weights_used = 0.0
    assessed_category_scores = {}
    valid_scores_list = []

    for cat_key, weight in CATEGORY_WEIGHTS.items():
        cat_data = analysis.get(cat_key)
        
        # Check if category exists and is marked assessed
        if isinstance(cat_data, dict):
            is_assessed = cat_data.get("assessed")
            # If explicitly false or omitted with null score, treat as unassessed
            raw_score = cat_data.get("score")
            clamped_score = validate_and_clamp_score(raw_score)

            if is_assessed is not False and clamped_score is not None:
                cat_data["score"] = clamped_score
                cat_data["assessed"] = True
                assessed_weighted_sum += clamped_score * weight
                total_weights_used += weight
                assessed_category_scores[cat_key] = clamped_score
                valid_scores_list.append(clamped_score)
            else:
                cat_data["score"] = None
                cat_data["assessed"] = False
                if not cat_data.get("feedback"):
                    cat_data["feedback"] = "Insufficient evidence to assess this category in this session."
        else:
            # Category missing from LLM response entirely -> mark unassessed
            analysis[cat_key] = {
                "score": None,
                "assessed": False,
                "feedback": "Insufficient evidence to assess this category in this session."
            }

    # Deterministic weighted overall score
    if total_weights_used > 0:
        overall_score = round(assessed_weighted_sum / total_weights_used, 1)
        unweighted_avg = round(sum(valid_scores_list) / len(valid_scores_list), 2)
    else:
        overall_score = None
        unweighted_avg = None

    # Attach deterministic aggregation metadata
    analysis["overall_score"] = overall_score
    analysis["technical_score"] = analysis.get("technical", {}).get("score")
    analysis["coding_score"] = analysis.get("coding", {}).get("score")
    analysis["average_score"] = unweighted_avg
    analysis["assessed_categories_count"] = len(valid_scores_list)
    analysis["total_categories_count"] = len(CATEGORY_WEIGHTS)
    analysis["scoring_method"] = "deterministic_weighted_python_v1"
    analysis["assessed_category_scores"] = assessed_category_scores

    # Sanitize lists
    for list_key in ("strengths", "improvements", "final_feedback"):
        if not isinstance(analysis.get(list_key), list):
            analysis[list_key] = []
        else:
            analysis[list_key] = [
                str(item).strip() for item in analysis[list_key] if item and str(item).strip()
            ]

    # Validate per_question_feedback if present
    per_q = analysis.get("per_question_feedback")
    if isinstance(per_q, list):
        sanitized_per_q = []
        for item in per_q:
            if isinstance(item, dict):
                item["score"] = validate_and_clamp_score(item.get("score"))
                item["assessed"] = item.get("assessed") is not False and item["score"] is not None
                sanitized_per_q.append(item)
        analysis["per_question_feedback"] = sanitized_per_q
    else:
        analysis["per_question_feedback"] = []

    return analysis
