"""
SQLite database persistence, migration, and progress analytics module.
Safely migrates existing schemas and provides role-aware progress comparisons.
"""

import os
import json
import sqlite3
from datetime import datetime
from collections import Counter
from typing import List, Dict, Any, Optional

from roles import SUPPORTED_ROLES

DB_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DB_DIR, "interviews.db")
LEGACY_RESULTS_PATH = os.path.join(DB_DIR, "results.json")


def get_db_connection() -> sqlite3.Connection:
    """Create and return a SQLite database connection with row factory."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Initialize SQLite schema and perform safe, non-destructive migration.
    Ensures older SQLite records remain readable and preserves existing history.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Create table if not present
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            created_at TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'web_developer',
            experience_level TEXT NOT NULL DEFAULT 'beginner',
            mode TEXT DEFAULT 'text',
            answered_questions INTEGER DEFAULT 0,
            total_questions INTEGER DEFAULT 15,
            average_score REAL DEFAULT NULL,
            overall_score REAL DEFAULT NULL,
            technical_score REAL DEFAULT NULL,
            coding_score REAL DEFAULT NULL,
            scoring_method TEXT DEFAULT 'deterministic_weighted_average_v1',
            summary TEXT DEFAULT '',
            analysis_json TEXT DEFAULT '{}',
            answers_json TEXT DEFAULT '[]'
        )
    """)
    conn.commit()

    # 2. Safe Migration: Inspect columns and add any missing ones non-destructively
    cursor.execute("PRAGMA table_info(interview_history)")
    existing_columns = {row["name"] for row in cursor.fetchall()}

    required_columns = {
        "session_id": "TEXT",
        "created_at": "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "role": "TEXT NOT NULL DEFAULT 'web_developer'",
        "experience_level": "TEXT NOT NULL DEFAULT 'beginner'",
        "mode": "TEXT DEFAULT 'text'",
        "answered_questions": "INTEGER DEFAULT 0",
        "total_questions": "INTEGER DEFAULT 15",
        "average_score": "REAL DEFAULT NULL",
        "overall_score": "REAL DEFAULT NULL",
        "technical_score": "REAL DEFAULT NULL",
        "coding_score": "REAL DEFAULT NULL",
        "scoring_method": "TEXT DEFAULT 'deterministic_weighted_average_v1'",
        "summary": "TEXT DEFAULT ''",
        "analysis_json": "TEXT DEFAULT '{}'",
        "answers_json": "TEXT DEFAULT '[]'",
    }

    for col_name, col_def in required_columns.items():
        if col_name not in existing_columns:
            cursor.execute(f"ALTER TABLE interview_history ADD COLUMN {col_name} {col_def}")
            conn.commit()

    # 3. Import legacy records from results.json if interview_history is completely empty
    cursor.execute("SELECT COUNT(*) as count FROM interview_history")
    count = cursor.fetchone()["count"]

    if count == 0 and os.path.exists(LEGACY_RESULTS_PATH):
        try:
            with open(LEGACY_RESULTS_PATH, "r", encoding="utf-8") as f:
                legacy_items = json.load(f)

            if isinstance(legacy_items, list):
                for item in legacy_items:
                    total_score = item.get("total_score")
                    answers = item.get("answers", [])
                    created_at = item.get("created_at") or datetime.now().isoformat()
                    category = item.get("category", "General")

                    cursor.execute("""
                        INSERT INTO interview_history (
                            created_at,
                            role,
                            experience_level,
                            mode,
                            answered_questions,
                            total_questions,
                            average_score,
                            overall_score,
                            summary,
                            analysis_json,
                            answers_json
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        created_at,
                        "web_developer",
                        "beginner",
                        "text",
                        len(answers),
                        len(answers),
                        total_score,
                        total_score,
                        f"Legacy evaluation for {category}",
                        json.dumps({
                            "overall_summary": f"Historical evaluation for {category}",
                            "role": "web_developer",
                            "experience_level": "beginner"
                        }),
                        json.dumps(answers)
                    ))
                conn.commit()
        except Exception as e:
            print(f"Notice: Legacy results migration warning: {e}")

    conn.close()


def save_interview_history(
    role: str,
    experience_level: str,
    mode: str,
    answered_questions: int,
    total_questions: int,
    average_score: Optional[float],
    summary: str,
    analysis: dict,
    answers: list,
    created_at: Optional[str] = None
) -> int:
    """Save a completed interview record to SQLite database."""
    conn = get_db_connection()
    cursor = conn.cursor()

    timestamp = created_at or datetime.now().isoformat()

    # Extract deterministic scores from analysis
    overall_score = analysis.get("overall_score")
    if overall_score is None:
        overall_score = average_score

    tech_score = None
    if isinstance(analysis.get("technical"), dict) and analysis["technical"].get("assessed"):
        tech_score = analysis["technical"].get("score")

    coding_score = None
    if isinstance(analysis.get("coding"), dict) and analysis["coding"].get("assessed"):
        coding_score = analysis["coding"].get("score")

    scoring_method = analysis.get("scoring_method", "deterministic_weighted_average_v1")

    cursor.execute("""
        INSERT INTO interview_history (
            created_at,
            role,
            experience_level,
            mode,
            answered_questions,
            total_questions,
            average_score,
            overall_score,
            technical_score,
            coding_score,
            scoring_method,
            summary,
            analysis_json,
            answers_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        timestamp,
        role,
        experience_level,
        mode,
        answered_questions,
        total_questions,
        average_score,
        overall_score,
        tech_score,
        coding_score,
        scoring_method,
        summary,
        json.dumps(analysis, ensure_ascii=False),
        json.dumps(answers, ensure_ascii=False)
    ))

    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id


def get_all_interview_history() -> List[Dict[str, Any]]:
    """Retrieve all completed interview history records, sorted by most recent first."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            created_at,
            role,
            experience_level,
            mode,
            answered_questions,
            total_questions,
            average_score,
            overall_score,
            technical_score,
            coding_score,
            scoring_method,
            summary,
            analysis_json,
            answers_json
        FROM interview_history
        ORDER BY id DESC
    """)

    rows = cursor.fetchall()
    history = []

    for row in rows:
        record = dict(row)
        try:
            record["analysis"] = json.loads(record.get("analysis_json") or "{}")
        except Exception:
            record["analysis"] = {}

        try:
            record["answers"] = json.loads(record.get("answers_json") or "[]")
        except Exception:
            record["answers"] = []

        # Populate fallback overall score if legacy row lacked overall_score column
        if record.get("overall_score") is None:
            record["overall_score"] = record.get("average_score")

        history.append(record)

    conn.close()
    return history


def get_interview_history_by_id(record_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve a single completed interview record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM interview_history WHERE id = ?
    """, (record_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    record = dict(row)
    try:
        record["analysis"] = json.loads(record.get("analysis_json") or "{}")
    except Exception:
        record["analysis"] = {}

    try:
        record["answers"] = json.loads(record.get("answers_json") or "[]")
    except Exception:
        record["answers"] = []

    if record.get("overall_score") is None:
        record["overall_score"] = record.get("average_score")

    record["role_title"] = SUPPORTED_ROLES.get(record.get("role"), {}).get("title", record.get("role"))

    return record


def get_progress_analytics(filter_role: Optional[str] = None) -> Dict[str, Any]:
    """
    Compute role-aware progress analytics across completed interviews from SQLite.
    Prevents cross-role score conflation and highlights within-role improvements.
    """
    all_records = get_all_interview_history()
    
    # 1. Role distribution
    role_distribution = Counter([r.get("role", "web_developer") for r in all_records])

    # 2. Filter records if requested
    if filter_role and filter_role != "all":
        records = [r for r in all_records if r.get("role") == filter_role]
    else:
        records = all_records

    # Chronological order (oldest to newest)
    chrono = list(reversed(records))
    completed_count = len(records)

    # 3. Overall score trajectory
    score_points = []
    for r in chrono:
        score = r.get("overall_score")
        if score is None:
            score = r.get("average_score")
        if score is not None:
            try:
                num_score = round(float(score), 1)
                score_points.append({
                    "id": r.get("id"),
                    "created_at": r.get("created_at"),
                    "role": r.get("role"),
                    "role_title": SUPPORTED_ROLES.get(r.get("role"), {}).get("title", r.get("role")),
                    "experience_level": r.get("experience_level"),
                    "score": num_score,
                    "mode": r.get("mode")
                })
            except (ValueError, TypeError):
                pass

    latest_score = score_points[-1]["score"] if score_points else None
    first_score = score_points[0]["score"] if score_points else None
    score_delta = round(latest_score - first_score, 1) if (latest_score is not None and first_score is not None) else None

    # 4. Recurring strengths and improvements extraction
    strengths_counter = Counter()
    improvements_counter = Counter()

    for r in records:
        analysis = r.get("analysis", {})
        if isinstance(analysis, dict):
            for s in analysis.get("strengths", []):
                if isinstance(s, str) and len(s.strip()) > 5:
                    strengths_counter[s.strip()] += 1
            for imp in analysis.get("improvements", []):
                if isinstance(imp, str) and len(imp.strip()) > 5:
                    improvements_counter[imp.strip()] += 1

    recurring_strengths = [
        {"item": item, "count": count} for item, count in strengths_counter.most_common(5)
    ]
    recurring_improvements = [
        {"item": item, "count": count} for item, count in improvements_counter.most_common(5)
    ]

    # 5. Role-specific category trends (comparing only categories assessed across sessions)
    core_categories = [
        "technical", "coding", "communication", "relevance",
        "structure", "specificity", "behavioral", "project_discussion"
    ]

    category_trends = {}
    for cat in core_categories:
        cat_scores = []
        for r in chrono:
            analysis = r.get("analysis", {})
            if isinstance(analysis, dict):
                cat_data = analysis.get(cat)
                if isinstance(cat_data, dict) and cat_data.get("assessed") and cat_data.get("score") is not None:
                    try:
                        s = float(cat_data["score"])
                        cat_scores.append({
                            "session_id": r.get("id"),
                            "date": r.get("created_at"),
                            "score": round(s, 1),
                            "role": r.get("role"),
                            "experience_level": r.get("experience_level")
                        })
                    except (ValueError, TypeError):
                        pass

        if cat_scores:
            cat_first = cat_scores[0]["score"]
            cat_latest = cat_scores[-1]["score"]
            cat_delta = round(cat_latest - cat_first, 1) if len(cat_scores) > 1 else 0.0
            category_trends[cat] = {
                "category": cat,
                "first_score": cat_first,
                "latest_score": cat_latest,
                "point_delta": cat_delta,
                "supporting_sessions_count": len(cat_scores),
                "history": cat_scores[-5:]  # up to last 5 sessions
            }

    # 6. Same-role pairwise comparison (comparing the 2 most recent sessions for the target role)
    same_role_comparison = None
    target_role_for_comp = filter_role if (filter_role and filter_role != "all") else (records[0].get("role") if records else None)

    if target_role_for_comp:
        same_role_records = [r for r in all_records if r.get("role") == target_role_for_comp]
        if len(same_role_records) >= 2:
            newer = same_role_records[0]
            older = same_role_records[1]

            newer_score = newer.get("overall_score") or newer.get("average_score")
            older_score = older.get("overall_score") or older.get("average_score")

            delta = round(float(newer_score) - float(older_score), 1) if (newer_score is not None and older_score is not None) else None
            level_changed = (newer.get("experience_level") != older.get("experience_level"))

            # Category differences
            newer_analysis = newer.get("analysis", {})
            older_analysis = older.get("analysis", {})
            category_diffs = {}

            for cat in core_categories:
                newer_cat = newer_analysis.get(cat, {}) if isinstance(newer_analysis, dict) else {}
                older_cat = older_analysis.get(cat, {}) if isinstance(older_analysis, dict) else {}

                if newer_cat.get("assessed") and older_cat.get("assessed") and newer_cat.get("score") is not None and older_cat.get("score") is not None:
                    try:
                        n_s = float(newer_cat["score"])
                        o_s = float(older_cat["score"])
                        category_diffs[cat] = {
                            "previous": round(o_s, 1),
                            "latest": round(n_s, 1),
                            "point_delta": round(n_s - o_s, 1)
                        }
                    except (ValueError, TypeError):
                        pass

            same_role_comparison = {
                "role": target_role_for_comp,
                "role_title": SUPPORTED_ROLES.get(target_role_for_comp, {}).get("title", target_role_for_comp),
                "previous_session": {
                    "id": older.get("id"),
                    "date": older.get("created_at"),
                    "experience_level": older.get("experience_level"),
                    "score": older_score
                },
                "latest_session": {
                    "id": newer.get("id"),
                    "date": newer.get("created_at"),
                    "experience_level": newer.get("experience_level"),
                    "score": newer_score
                },
                "overall_point_delta": delta,
                "experience_level_changed": level_changed,
                "experience_level_note": (
                    f"Note: Seniority level changed from {older.get('experience_level', '').capitalize()} to "
                    f"{newer.get('experience_level', '').capitalize()}. Evaluation criteria and rubric expectations were adjusted accordingly."
                ) if level_changed else None,
                "category_diffs": category_diffs
            }

    # 7. Empty state evaluation
    is_empty = completed_count < 2
    empty_message = None
    if completed_count == 0:
        empty_message = "No completed mock interview records found. Start an interview to begin tracking your progress."
    elif completed_count == 1:
        empty_message = "1 interview completed. Complete at least one more session to unlock score trends and comparative progress analytics."

    return {
        "status": "success",
        "filter_role": filter_role or "all",
        "completed_count": completed_count,
        "role_distribution": dict(role_distribution),
        "latest_score": latest_score,
        "first_score": first_score,
        "score_delta": score_delta,
        "score_points": score_points,
        "category_trends": category_trends,
        "same_role_comparison": same_role_comparison,
        "recurring_strengths": recurring_strengths,
        "recurring_improvements": recurring_improvements,
        "is_empty": is_empty,
        "empty_message": empty_message
    }
