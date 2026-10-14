from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemini_service import analyze_interview
from interview_engine import InterviewEngine
from roles import (
    validate_role,
    validate_experience_level,
    SUPPORTED_ROLES,
    SUPPORTED_EXPERIENCE_LEVELS,
    DEFAULT_ROLE,
    DEFAULT_EXPERIENCE_LEVEL,
)
from database import (
    init_db,
    save_interview_history,
    get_all_interview_history,
    get_interview_history_by_id,
    get_progress_analytics,
)

# Initialize database schema and safe migrations
init_db()

app = FastAPI(
    title="AI Interview Evaluation System",
    description="Backend for AI-based mock interview practice with role-based evaluation",
    version="2.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Interview Session
# --------------------------------------------------

engine = InterviewEngine(role=DEFAULT_ROLE, experience_level=DEFAULT_EXPERIENCE_LEVEL)


# --------------------------------------------------
# Request Models
# --------------------------------------------------

class StartInterviewRequest(BaseModel):
    role: Optional[str] = None
    experience_level: Optional[str] = DEFAULT_EXPERIENCE_LEVEL
    mode: Optional[str] = "text"



class AnswerRequest(BaseModel):
    answer: str


# --------------------------------------------------
# Basic API & Role Discovery
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Interview Evaluation System API is running",
        "supported_roles": list(SUPPORTED_ROLES.keys()),
        "supported_experience_levels": list(SUPPORTED_EXPERIENCE_LEVELS.keys())
    }


@app.get("/api/interview/roles")
def get_roles():
    """Return all supported interview roles and experience levels with metadata."""
    return {
        "status": "success",
        "roles": list(SUPPORTED_ROLES.values()),
        "experience_levels": list(SUPPORTED_EXPERIENCE_LEVELS.values())
    }


# --------------------------------------------------
# Interview History (SQLite)
# --------------------------------------------------

@app.get("/api/interview/history")
def get_history():
    """Return completed interview history from SQLite database."""
    history = get_all_interview_history()
    return {
        "status": "success",
        "count": len(history),
        "history": history
    }


@app.get("/api/interview/history/{record_id}")
def get_history_detail(record_id: int):
    """Return single completed interview evaluation record from SQLite."""
    record = get_interview_history_by_id(record_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Interview history record #{record_id} not found."
        )
    return {
        "status": "success",
        "interview": record
    }


@app.get("/api/interview/analytics")
def get_analytics(role: Optional[str] = None):
    """Return role-aware progress analytics from SQLite database."""
    return get_progress_analytics(filter_role=role)



# --------------------------------------------------
# Start Interview
# --------------------------------------------------

@app.post("/api/interview/start")
def start_interview(request: Optional[StartInterviewRequest] = None):
    global engine

    if not request or not request.role or not str(request.role).strip():
        raise HTTPException(
            status_code=400,
            detail=f"Role is required. Supported roles: {', '.join(SUPPORTED_ROLES.keys())}"
        )

    raw_role = request.role
    raw_level = request.experience_level if (request and request.experience_level) else DEFAULT_EXPERIENCE_LEVEL
    session_mode = request.mode if (request and request.mode) else "text"

    # Strict backend validation of role and experience level
    try:
        validated_role = validate_role(raw_role)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    try:
        validated_level = validate_experience_level(raw_level)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    # Create fresh engine session for the validated role
    engine = InterviewEngine(role=validated_role, experience_level=validated_level)
    engine.mode = session_mode
    engine.is_analyzing = False
    engine.cached_analysis = None
    engine.saved_history_id = None

    question = engine.start_interview()

    return {
        "status": "started",
        "role": engine.role,
        "role_title": SUPPORTED_ROLES[engine.role]["title"],
        "experience_level": engine.experience_level,
        "mode": engine.mode,
        "question": question,
        "progress": engine.get_progress()
    }


# --------------------------------------------------
# Get Current Question
# --------------------------------------------------

@app.get("/api/interview/current")
def get_current_question():
    if not engine.interview_started:
        raise HTTPException(
            status_code=400,
            detail="Interview has not started."
        )

    if engine.interview_finished:
        return {
            "status": "finished",
            "question": None,
            "role": engine.role,
            "experience_level": engine.experience_level
        }

    return {
        "status": "active",
        "question": engine.get_current_question(),
        "role": engine.role,
        "experience_level": engine.experience_level
    }


# --------------------------------------------------
# Submit Answer
# --------------------------------------------------

@app.post("/api/interview/answer")
def submit_answer(request: AnswerRequest):
    if not engine.interview_started:
        raise HTTPException(
            status_code=400,
            detail="Interview has not started."
        )

    if engine.interview_finished:
        raise HTTPException(
            status_code=400,
            detail="Interview has already finished."
        )

    if not request.answer.strip():
        raise HTTPException(
            status_code=400,
            detail="Answer cannot be empty."
        )

    try:
        result = engine.submit_answer(request.answer)

        return {
            **result,
            "role": engine.role,
            "experience_level": engine.experience_level,
            "progress": engine.get_progress()
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )


# --------------------------------------------------
# Interview Progress
# --------------------------------------------------

@app.get("/api/interview/progress")
def get_progress():
    if not engine.interview_started:
        raise HTTPException(
            status_code=400,
            detail="Interview has not started."
        )

    return engine.get_progress()


# --------------------------------------------------
# Finish Interview
# --------------------------------------------------

@app.post("/api/interview/finish")
def finish_interview():
    if not engine.interview_started:
        raise HTTPException(
            status_code=400,
            detail="Interview has not started."
        )

    if not engine.interview_finished:
        engine.finish_interview()

    return {
        "status": "finished",
        "message": "Interview completed successfully.",
        "interview": engine.get_interview_data()
    }


# --------------------------------------------------
# Analyze Interview & Persist to SQLite
# --------------------------------------------------

@app.post("/api/interview/analyze")
def analyze_completed_interview():
    if not engine.interview_started:
        raise HTTPException(
            status_code=400,
            detail="Interview has not started."
        )

    if not engine.interview_finished:
        raise HTTPException(
            status_code=400,
            detail="Interview has not been completed yet."
        )

    answers = engine.get_answers()

    if not answers:
        raise HTTPException(
            status_code=400,
            detail="No interview answers found."
        )

    role_id = getattr(engine, "role", DEFAULT_ROLE)
    experience_level = getattr(engine, "experience_level", DEFAULT_EXPERIENCE_LEVEL)
    role_title = SUPPORTED_ROLES.get(role_id, {}).get("title", role_id)

    # 1. Prevent concurrent duplicate analysis requests
    if getattr(engine, "is_analyzing", False):
        raise HTTPException(
            status_code=409,
            detail="Analysis is currently in progress for this interview session. Please wait."
        )

    # 2. Idempotent return: If already analyzed and stored, return cached result without re-calling Groq or SQLite
    if getattr(engine, "cached_analysis", None) and getattr(engine, "saved_history_id", None):
        return {
            "status": "success",
            "role": role_id,
            "role_title": role_title,
            "experience_level": experience_level,
            "analysis": engine.cached_analysis,
            "history_id": engine.saved_history_id,
            "cached": True
        }

    engine.is_analyzing = True

    try:
        analysis = analyze_interview(
            answers,
            role=role_title,
            experience_level=experience_level,
            role_id=role_id
        )

        overall_score = analysis.get("overall_score")
        if overall_score is None:
            overall_score = analysis.get("average_score")

        # Persist completed interview to SQLite database
        history_id = save_interview_history(
            role=role_id,
            experience_level=experience_level,
            mode=getattr(engine, "mode", "text"),
            answered_questions=len(answers),
            total_questions=engine.get_progress().get("total_questions", 15),
            average_score=overall_score,
            summary=analysis.get("overall_summary", ""),
            analysis=analysis,
            answers=answers,
            created_at=engine.start_time
        )

        # Store cache on engine session to prevent duplicate calls and duplicate database records
        engine.cached_analysis = analysis
        engine.saved_history_id = history_id

        return {
            "status": "success",
            "role": role_id,
            "role_title": role_title,
            "experience_level": experience_level,
            "analysis": analysis,
            "history_id": history_id
        }

    except Exception as error:
        print("Analysis error:", error)
        # Completed answers are preserved in engine.answers, enabling deliberate user retry without restarting
        raise HTTPException(
            status_code=500,
            detail="AI analysis failed. Your completed answers have been preserved; please retry."
        )
    finally:
        engine.is_analyzing = False