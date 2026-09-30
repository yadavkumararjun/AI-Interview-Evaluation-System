import os
import json

from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_interview(answers):

    prompt = f"""
You are an AI mock interview evaluator.

Analyze the candidate's complete interview responses.

This is a PRACTICE interview, not a hiring or recruitment decision.

Evaluate the candidate on:

1. Communication
2. Answer relevance
3. Answer structure
4. Specificity
5. Behavioral responses
6. Technical understanding
7. Project discussion
8. Overall improvement areas

Important:
- Do not judge personality.
- Do not make hiring decisions.
- Do not invent information.
- Base your analysis only on the candidate's answers.
- Give constructive and practical feedback.
- Do not evaluate every answer independently as if there is one correct answer.
- Behavioral questions should be evaluated for clarity, specificity and reflection.
- Technical answers should be evaluated for conceptual accuracy.

Return ONLY valid JSON.

Required JSON format:

{{
    "overall_summary": "Short summary of the interview",

    "communication": {{
        "score": 0,
        "feedback": "..."
    }},

    "relevance": {{
        "score": 0,
        "feedback": "..."
    }},

    "structure": {{
        "score": 0,
        "feedback": "..."
    }},

    "specificity": {{
        "score": 0,
        "feedback": "..."
    }},

    "behavioral": {{
        "score": 0,
        "feedback": "..."
    }},

    "technical": {{
        "score": 0,
        "feedback": "..."
    }},

    "project_discussion": {{
        "score": 0,
        "feedback": "..."
    }},

    "strengths": [
        "...",
        "...",
        "..."
    ],

    "improvements": [
        "...",
        "...",
        "..."
    ],

    "final_feedback": [
        "...",
        "...",
        "..."
    ]
}}

Scores must be between 0 and 10.

Candidate interview responses:

{json.dumps(answers, indent=2)}
"""

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        input=prompt
    )

    response_text = interaction.output_text.strip()

    try:
        return json.loads(response_text)

    except json.JSONDecodeError:

        if response_text.startswith("```"):
            response_text = response_text.replace(
                "```json", ""
            ).replace(
                "```", ""
            ).strip()

        return json.loads(response_text)