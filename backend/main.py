from gemini_service import analyze_interview
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from interview_engine import InterviewEngine


app = FastAPI(
    title="AI Interview Evaluation System",
    description="Backend for AI-based mock interview practice",
    version="1.0"
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

engine = InterviewEngine()


# --------------------------------------------------
# Request Models
# --------------------------------------------------

class AnswerRequest(BaseModel):
    answer: str


# --------------------------------------------------
# Basic API
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Interview Evaluation System API is running"
    }


# --------------------------------------------------
# Start Interview
# --------------------------------------------------

@app.post("/api/interview/start")
def start_interview():

    global engine

    # Create a fresh interview
    engine = InterviewEngine()

    question = engine.start_interview()

    return {
        "status": "started",
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
            "question": None
        }

    return {
        "status": "active",
        "question": engine.get_current_question()
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

        result = engine.submit_answer(
            request.answer
        )

        return {
            **result,
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

    try:

        analysis = analyze_interview(answers)

        return {
            "status": "success",
            "analysis": analysis
        }

    except Exception as error:

        print("Gemini analysis error:", error)

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed."
        )