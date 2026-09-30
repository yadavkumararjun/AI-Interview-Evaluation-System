import json
import random
from datetime import datetime


class InterviewEngine:

    def __init__(self, questions_file="data/questions.json"):
        self.questions_file = questions_file
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

        # Number of questions to ask from each stage
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
        """Start a fresh interview."""

        self.current_stage_index = 0

        self.current_stage = self.stages[
            self.current_stage_index
        ]

        self.current_question = None

        self.stage_questions = {}
        self.stage_question_index = {}

        self.answers = []

        self.interview_started = False
        self.interview_finished = False

        self.start_time = None
        self.end_time = None

        self.prepare_questions()

    def prepare_questions(self):
        """Prepare questions for every stage."""

        for stage in self.stages:

            available_questions = [
                q for q in self.questions
                if q["stage"] == stage
            ]

            limit = self.stage_limits.get(
                stage,
                len(available_questions)
            )

            # Shuffle questions so every interview
            # does not have exactly the same order.
            random.shuffle(available_questions)

            self.stage_questions[stage] = (
                available_questions[:limit]
            )

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
        """Return the question currently shown to candidate."""

        if self.current_question is None:
            return None

        return {
            "question_id": self.current_question["question_id"],
            "stage": self.current_question["stage"],
            "category": self.current_question["category"],
            "question": self.current_question["question"],
            "type": self.current_question["type"],
            "difficulty": self.current_question["difficulty"]
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

        # Store answer
        answer_record = {
            "question_id": self.current_question["question_id"],
            "stage": self.current_question["stage"],
            "category": self.current_question["category"],
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
        """Return interview progress."""

        total_questions = sum(
            len(questions)
            for questions in self.stage_questions.values()
        )

        answered_questions = len(self.answers)

        return {
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

        return {
            "started_at": self.start_time,
            "ended_at": self.end_time,
            "current_stage": self.current_stage,
            "answers": self.answers,
            "progress": self.get_progress()
        }