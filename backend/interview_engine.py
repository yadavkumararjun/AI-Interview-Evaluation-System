import os
import json
import random
from datetime import datetime

from roles import (
    validate_role,
    validate_experience_level,
    SUPPORTED_ROLES,
    DEFAULT_ROLE,
    DEFAULT_EXPERIENCE_LEVEL,
)

DEFAULT_QUESTIONS_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    "questions.json"
)


class InterviewEngine:

    def __init__(
        self,
        questions_file=None,
        role: str = DEFAULT_ROLE,
        experience_level: str = DEFAULT_EXPERIENCE_LEVEL,
        seed: int = None
    ):
        self.questions_file = questions_file or DEFAULT_QUESTIONS_PATH
        self.role = validate_role(role)
        self.experience_level = validate_experience_level(experience_level)
        self.seed = seed

        self.questions = self.load_questions()

        self.stages = [
            "introduction",
            "background",
            "behavioral",
            "technical",
            "coding",
            "project_discussion",
            "closing"
        ]

        # Number of questions to ask from each stage (Total: 15)
        self.stage_limits = {
            "introduction": 1,
            "background": 2,
            "behavioral": 3,
            "technical": 4,
            "coding": 1,
            "project_discussion": 2,
            "closing": 2
        }

        self.reset()

    def load_questions(self):
        with open(self.questions_file, "r", encoding="utf-8") as file:
            return json.load(file)

    def reset(self):
        """Start a fresh interview session."""

        self.current_stage_index = 0

        self.current_stage = self.stages[
            self.current_stage_index
        ]

        self.current_question = None

        self.stage_questions = {}
        self.stage_question_index = {}
        self.used_question_ids = set()

        self.answers = []

        self.interview_started = False
        self.interview_finished = False

        self.start_time = None
        self.end_time = None

        self.prepare_questions()

    def _score_question(self, q: dict) -> float:
        """
        Calculate deterministic role affinity and experience-level alignment score.
        Higher score = better fit for the candidate's chosen role and seniority.
        """
        score = 0.0

        # 1. Role Match Score
        q_roles = q.get("roles", [])
        if self.role in q_roles:
            score += 100.0  # Exact role match
        elif "all" in q_roles:
            score += 20.0   # Shared question

        # 2. Experience Level Match Score
        q_levels = q.get("experience_levels", [])
        if self.experience_level in q_levels:
            score += 50.0  # Direct experience level match
        else:
            # Adjacent experience level scoring
            if self.experience_level == "beginner" and "intermediate" in q_levels:
                score += 20.0
            elif self.experience_level == "intermediate" and ("beginner" in q_levels or "advanced" in q_levels):
                score += 20.0
            elif self.experience_level == "advanced" and "intermediate" in q_levels:
                score += 20.0

        # 3. Difficulty Level Alignment Score
        diff = q.get("difficulty", "medium").lower()
        if self.experience_level == "beginner":
            if diff == "easy":
                score += 25.0
            elif diff == "medium":
                score += 10.0
        elif self.experience_level == "intermediate":
            if diff == "medium":
                score += 25.0
            elif diff in ("easy", "hard"):
                score += 10.0
        elif self.experience_level == "advanced":
            if diff == "hard":
                score += 30.0
            elif diff == "medium":
                score += 15.0

        # 4. Role Category Affinity Bonus
        category = q.get("category", "")
        role_info = SUPPORTED_ROLES.get(self.role, {})
        tech_cats = role_info.get("technical_categories", [])
        coding_cats = role_info.get("coding_categories", [])

        if category in tech_cats:
            rank = tech_cats.index(category)
            score += max(1.0, 5.0 - rank)
        elif category in coding_cats:
            rank = coding_cats.index(category)
            score += max(1.0, 4.0 - rank)

        return score

    def prepare_questions(self):
        """
        Prepare questions for all 7 stages using deterministic filtering and ranking:
          - Filters out questions already used in the session (guaranteeing 0 duplicates).
          - Strictly enforces role-matching during technical and coding stages.
          - Rejects insufficient questions with a clear ValueError.
          - Ranks questions by role alignment and experience level calibration.
        """
        self.used_question_ids = set()

        for stage in self.stages:
            limit = self.stage_limits.get(stage, 1)

            # Stage pool excluding already used questions
            stage_pool = [
                q for q in self.questions
                if q["stage"] == stage and q["question_id"] not in self.used_question_ids
            ]

            # Enforce stage-specific role selection boundaries
            if stage in ("technical", "coding"):
                # Technical and coding stages must strictly select for the candidate's chosen role
                eligible = [
                    q for q in stage_pool
                    if self.role in q.get("roles", [])
                ]
                if len(eligible) < limit:
                    raise ValueError(
                        f"Insufficient questions available for role '{self.role}' in stage '{stage}'. "
                        f"Required: {limit}, Available: {len(eligible)}."
                    )
            elif stage == "project_discussion":
                # Project discussion prefers role-specific projects, with shared project questions as fallback
                eligible = [
                    q for q in stage_pool
                    if self.role in q.get("roles", []) or "all" in q.get("roles", [])
                ]
                if len(eligible) < limit:
                    raise ValueError(
                        f"Insufficient questions available for role '{self.role}' in stage '{stage}'. "
                        f"Required: {limit}, Available: {len(eligible)}."
                    )
            else:
                # Introduction, background, behavioral, and closing allow role-matching or shared
                eligible = [
                    q for q in stage_pool
                    if self.role in q.get("roles", []) or "all" in q.get("roles", [])
                ]
                if len(eligible) < limit:
                    raise ValueError(
                        f"Insufficient questions available for role '{self.role}' in stage '{stage}'. "
                        f"Required: {limit}, Available: {len(eligible)}."
                    )

            # Deterministic ranking: score descending, then question_id ascending
            eligible.sort(
                key=lambda q: (-self._score_question(q), q["question_id"])
            )

            selected = eligible[:limit]
            for q in selected:
                self.used_question_ids.add(q["question_id"])

            self.stage_questions[stage] = selected
            self.stage_question_index[stage] = 0

    def start_interview(self):
        """Start the interview."""

        if self.interview_started:
            return self.get_current_question()

        self.interview_started = True
        self.interview_finished = False

        self.start_time = datetime.now().isoformat()

        self.current_stage_index = 0
        self.current_stage = self.stages[0]

        self.current_question = self.get_next_question_for_stage()

        return self.get_current_question()

    def get_next_question_for_stage(self):
        """Get the next unanswered question from current stage."""

        questions = self.stage_questions[self.current_stage]

        index = self.stage_question_index[self.current_stage]

        if index >= len(questions):
            return None

        question = questions[index]

        self.stage_question_index[self.current_stage] += 1

        return question

    def get_current_question(self):
        """
        Return the question payload shown to candidate.
        Includes topic/skill label while keeping evaluation rubrics and expected concepts private.
        """
        if self.current_question is None:
            return None

        return {
            "question_id": self.current_question["question_id"],
            "stage": self.current_question["stage"],
            "category": self.current_question["category"],
            "skill": self.current_question.get("skill") or self.current_question.get("topic") or self.current_question.get("category"),
            "topic": self.current_question.get("topic") or self.current_question.get("skill"),
            "question": self.current_question["question"],
            "type": self.current_question["type"],
            "difficulty": self.current_question["difficulty"],
            "is_coding": self.current_question.get("is_coding", False),
            "role": self.role,
            "experience_level": self.experience_level
        }

    def submit_answer(self, answer):
        """Store candidate answer and move interview forward."""

        if not self.interview_started:
            raise ValueError("Interview has not started.")

        if self.interview_finished:
            raise ValueError("Interview has already finished.")

        if self.current_question is None:
            raise ValueError("There is no active question.")

        answer = answer.strip()

        if not answer:
            raise ValueError("Answer cannot be empty.")

        # Store answer with complete question context for accurate, role-specific evaluation
        answer_record = {
            "question_id": self.current_question["question_id"],
            "stage": self.current_question["stage"],
            "category": self.current_question["category"],
            "skill": self.current_question.get("skill") or self.current_question.get("category"),
            "topic": self.current_question.get("topic") or self.current_question.get("skill"),
            "difficulty": self.current_question.get("difficulty", "medium"),
            "is_coding": self.current_question.get("is_coding", False),
            "evaluation_rubric": self.current_question.get("evaluation_rubric", []),
            "expected_concepts": self.current_question.get("expected_concepts", []),
            "question": self.current_question["question"],
            "answer": answer,
            "answered_at": datetime.now().isoformat()
        }

        self.answers.append(answer_record)

        # Try next question in current stage
        next_question = self.get_next_question_for_stage()

        if next_question is not None:

            self.current_question = next_question

            return {
                "status": "continue",
                "stage_changed": False,
                "question": self.get_current_question()
            }

        # Current stage completed
        return self.move_to_next_stage()

    def move_to_next_stage(self):
        """Move interview to the next stage."""

        self.current_stage_index += 1

        # No more stages
        if self.current_stage_index >= len(self.stages):

            self.finish_interview()

            return {
                "status": "finished",
                "stage_changed": True,
                "question": None
            }

        # Move to next stage
        self.current_stage = self.stages[
            self.current_stage_index
        ]

        self.current_question = self.get_next_question_for_stage()

        return {
            "status": "continue",
            "stage_changed": True,
            "previous_stage": self.stages[
                self.current_stage_index - 1
            ],
            "current_stage": self.current_stage,
            "question": self.get_current_question()
        }

    def finish_interview(self):
        """Finish the interview."""

        self.interview_finished = True
        self.end_time = datetime.now().isoformat()

        self.current_question = None

    def get_progress(self):
        """Return interview progress including role and level context."""

        total_questions = sum(
            len(questions)
            for questions in self.stage_questions.values()
        )

        answered_questions = len(self.answers)

        role_info = SUPPORTED_ROLES.get(self.role, {})

        return {
            "role": self.role,
            "role_title": role_info.get("title", self.role),
            "experience_level": self.experience_level,
            "current_stage": self.current_stage,
            "current_stage_number": self.current_stage_index + 1,
            "total_stages": len(self.stages),
            "answered_questions": answered_questions,
            "total_questions": total_questions,
            "interview_finished": self.interview_finished
        }

    def get_answers(self):
        """Return all candidate answers."""

        return self.answers

    def get_interview_data(self):
        """Return complete interview information."""

        role_info = SUPPORTED_ROLES.get(self.role, {})

        return {
            "role": self.role,
            "role_title": role_info.get("title", self.role),
            "experience_level": self.experience_level,
            "started_at": self.start_time,
            "ended_at": self.end_time,
            "current_stage": self.current_stage,
            "answers": self.answers,
            "progress": self.get_progress()
        }