import { ChevronRight } from "lucide-react"

import StageProgress from "../components/StageProgress"
import { formatStage } from "../utils/formatStage"

function InterviewPage({
  question,
  answer,
  setAnswer,
  progress,
  loading,
  onSubmit
}) {

  const progressPercentage = progress
    ? Math.round(
        (
          progress.answered_questions /
          progress.total_questions
        ) * 100
      )
    : 0

  return (
    <section className="interview">

      <div className="interviewHeader">

        <div>

          <p className="eyebrow">
            CURRENT STAGE
          </p>

          <h2>
            {formatStage(question.stage)}
          </h2>

        </div>

        <div className="questionCounter">

          Question{" "}

          {progress
            ? progress.answered_questions + 1
            : 1}

          {" "}of{" "}

          {progress?.total_questions || 15}

        </div>

      </div>

      <div className="stageProgress">

        <div
          className="stageProgressBar"
          style={{
            width: `${progressPercentage}%`
          }}
        />

      </div>

      <div className="questionCard">

        <div className="questionMeta">

          <span>
            {question.category}
          </span>

          <span>
            {question.difficulty}
          </span>

        </div>

        <p className="eyebrow">
          INTERVIEW QUESTION
        </p>

        <h1>
          {question.question}
        </h1>

        <textarea
          value={answer}
          onChange={(e) =>
            setAnswer(e.target.value)
          }
          placeholder="Take your time and answer as you would in a real interview..."
          disabled={loading}
        />

        <div className="answerFooter">

          <span>
            Your answer will be analyzed
            after the interview.
          </span>

          <button
            className="primary"
            onClick={onSubmit}
            disabled={
              loading ||
              !answer.trim()
            }
          >

            {loading
              ? "Submitting..."
              : "Submit Answer"}

            <ChevronRight size={18} />

          </button>

        </div>

      </div>

      <StageProgress
        currentStage={question.stage}
      />

    </section>
  )
}

export default InterviewPage