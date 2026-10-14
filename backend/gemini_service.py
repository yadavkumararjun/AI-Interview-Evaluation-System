"""
AI Evaluation Service for AI Mock Interview Evaluation System.
Connects to Groq for qualitative assessment while relying on Python for deterministic score calculation.
"""

import os
import json
import re
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from groq import Groq

from evaluation_service import (
    build_role_aware_evaluation_prompt,
    calculate_deterministic_scores,
)

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

# Gracefully initialize Groq client only if API key is present
client = Groq(api_key=api_key) if api_key else None


def _clean_and_parse_llm_json(response_text: str) -> Dict[str, Any]:
    """Extract and parse valid JSON from LLM output, handling markdown blocks if present."""
    if not response_text:
        raise ValueError("Groq returned an empty analysis response.")

    text = response_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: Find outermost JSON brackets
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        raise ValueError("Failed to parse valid JSON evaluation output from Groq.")


def analyze_interview(
    answers: List[Dict[str, Any]],
    role: str = "Web Developer",
    experience_level: str = "Beginner",
    role_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Perform role-aware, evidence-based final interview evaluation.
    Evaluates each response against its own question rubric and expected concepts.
    Uses Python for deterministic score calculation and bounds enforcement.
    """
    if not client:
        raise ValueError("GROQ_API_KEY is missing or invalid in environment.")

    resolved_role_id = role_id or role.lower().replace(" ", "_")
    resolved_role_title = role

    prompt = build_role_aware_evaluation_prompt(
        answers=answers,
        role_id=resolved_role_id,
        role_title=resolved_role_title,
        experience_level=experience_level
    )

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a principal technical interviewer evaluating a mock interview practice session. "
                    "You return strictly valid, objective JSON without markdown formatting."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_completion_tokens=3500,
        response_format={"type": "json_object"}
    )

    response_text = response.choices[0].message.content
    raw_result = _clean_and_parse_llm_json(response_text)

    # Deterministic score validation and aggregation performed strictly in Python
    validated_analysis = calculate_deterministic_scores(raw_result)

    # Attach canonical metadata
    validated_analysis["role"] = resolved_role_id
    validated_analysis["role_title"] = resolved_role_title
    validated_analysis["experience_level"] = experience_level

    return validated_analysis
