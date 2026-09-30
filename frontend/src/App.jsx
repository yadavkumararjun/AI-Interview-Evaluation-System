import { useState } from "react"
import axios from "axios"
import {
  Brain,
  ChevronRight,
  Clock3
} from "lucide-react"

const API = "http://127.0.0.1:8000/api"

function App() {
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState("")
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [mode, setMode] = useState(null)
const [modeSelected, setModeSelected] = useState(false)
  // =========================
  // START INTERVIEW
  // =========================

  async function startInterview() {
    setLoading(true)
    setError("")

    try {
      const { data } = await axios.post(
        `${API}/interview/start`
      )

      setStarted(true)
      setFinished(false)
      setAnalyzing(false)

      setQuestion(data.question)
      setProgress(data.progress)
      setAnswer("")
      setAnalysis(null)

    } catch (error) {
      console.error(error)

      setError(
        "Could not start the interview. Please make sure the FastAPI backend is running."
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================
  // ANALYZE INTERVIEW
  // =========================

  async function analyzeInterview() {
    setAnalyzing(true)
    setError("")

    try {
      const { data } = await axios.post(
        `${API}/interview/analyze`
      )

      setAnalysis(data.analysis)
      setFinished(true)

    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        "AI analysis failed."

      setError(message)

    } finally {
      setAnalyzing(false)
    }
  }

  // =========================
  // SUBMIT ANSWER
  // =========================

  async function submitAnswer() {
    if (!answer.trim()) {
      setError(
        "Please provide an answer before continuing."
      )
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data } = await axios.post(
        `${API}/interview/answer`,
        {
          answer: answer
        }
      )

      setProgress(data.progress)

      // Interview completed
      if (data.status === "finished") {
        setQuestion(null)
        setAnswer("")

        await analyzeInterview()

        return
      }

      // Continue interview
      setQuestion(data.question)
      setAnswer("")

    } catch (error) {
      console.error(error)

      const message =
        error.response?.data?.detail ||
        "Could not submit your answer."

      setError(message)

    } finally {
      setLoading(false)
    }
  }

  // =========================
  // FINISH INTERVIEW
  // =========================

  async function finishInterview() {
    setLoading(true)
    setError("")

    try {
      await axios.post(
        `${API}/interview/finish`
      )

      setQuestion(null)
      setAnswer("")

      await analyzeInterview()

    } catch (error) {
      console.error(error)

      setError(
        "Could not finish the interview."
      )

    } finally {
      setLoading(false)
    }
  }

  // =========================
  // RESET INTERVIEW
  // =========================

  function resetInterview() {
    setStarted(false)
    setFinished(false)
    setAnalyzing(false)

    setQuestion(null)
    setAnswer("")
    setProgress(null)
    setAnalysis(null)
    setError("")
  }

  // =========================
  // PROGRESS
  // =========================

  const progressPercentage = progress
    ? Math.round(
        (progress.answered_questions /
          progress.total_questions) *
          100
      )
    : 0

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <header className="nav">

        <div className="brand">

          <div className="logo">
            <Brain size={20} />
          </div>

          <span>
            Interview
            <span className="muted">
              AI
            </span>
          </span>

        </div>

        <div className="navLinks">
          <span>
            Mock Interview
          </span>
        </div>

      </header>

      <main className="container">

        {/* =========================
            LANDING PAGE
        ========================= */}

        {!started && !finished && (
          <section className="landing">

            <div className="hero">

              <div>

                <p className="eyebrow">
                  AI-POWERED MOCK INTERVIEW
                </p>

                <h1>
                  Practice Interviews.
                  <br />
                  <span>
                    Improve Your Confidence.
                  </span>
                </h1>

                <p className="subtitle">
                  Experience a realistic interview
                  covering introduction, background,
                  behavioral, technical, coding,
                  project discussion, and closing
                  questions.
                </p>

                <button
                  className="primary heroButton"
                  onClick={startInterview}
                  disabled={loading}
                >
                  {loading
                    ? "Starting..."
                    : "Start Mock Interview"}

                  <ChevronRight size={19} />
                </button>

              </div>

              <div className="heroCard">

                <Brain size={42} />

                <strong>
                  AI Interview Practice
                </strong>

                <small>
                  7 stages · 15 questions
                </small>

              </div>

            </div>

            {/* INTERVIEW PROCESS */}

            <section className="panel">

              <div className="sectionTitle">

                <Clock3 size={20} />

                <h2>
                  Interview Process
                </h2>

              </div>

              <div className="stageGrid">

                <Stage
                  number="01"
                  title="Introduction"
                  text="Tell me about yourself"
                />

                <Stage
                  number="02"
                  title="Background"
                  text="Education and interests"
                />

                <Stage
                  number="03"
                  title="Behavioral"
                  text="Strengths, teamwork and challenges"
                />

                <Stage
                  number="04"
                  title="Technical"
                  text="Computer science fundamentals"
                />

                <Stage
                  number="05"
                  title="Coding"
                  text="Problem solving"
                />

                <Stage
                  number="06"
                  title="Projects"
                  text="Discuss your projects"
                />

                <Stage
                  number="07"
                  title="Closing"
                  text="Career goals and final questions"
                />

              </div>

            </section>

          </section>
        )}

        {/* =========================
            INTERVIEW SCREEN
        ========================= */}

        {started &&
          !finished &&
          !analyzing &&
          question && (

          <section className="interview">

            <div className="interviewHeader">

              <div>

                <p className="eyebrow">
                  CURRENT STAGE
                </p>

                <h2>
                  {formatStage(
                    question.stage
                  )}
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

            {/* OVERALL PROGRESS */}

            <div className="stageProgress">

              <div
                className="stageProgressBar"
                style={{
                  width: `${progressPercentage}%`
                }}
              />

            </div>

            {/* QUESTION CARD */}

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
                  onClick={submitAnswer}
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

            {/* STAGE TRACKER */}

            <StageProgress
              currentStage={question.stage}
            />

          </section>
        )}

        {/* =========================
            AI ANALYZING SCREEN
        ========================= */}

        {analyzing && (

          <section className="finished">

            <div className="finishIcon">
              <Brain size={42} />
            </div>

            <p className="eyebrow">
              AI ANALYSIS
            </p>

            <h1>
              Analyzing Interview
            </h1>

            <p className="subtitle">
              We are reviewing your communication,
              behavioral responses, technical
              knowledge, and project discussion.
            </p>

          </section>
        )}

        {/* =========================
            REPORT
        ========================= */}

        {finished && analysis && (

          <section className="report">

            {/* REPORT HEADER */}

            <div className="reportHeader">

              <p className="eyebrow">
                INTERVIEW ANALYSIS
              </p>

              <h1>
                Your Interview Report
              </h1>

              <p className="subtitle">
                AI-generated feedback based on
                your complete mock interview.
              </p>

            </div>

            {/* SUMMARY */}

            <div className="summaryCard">

              <h2>
                Overall Summary
              </h2>

              <p>
                {analysis.overall_summary}
              </p>

            </div>

            {/* ANALYSIS CARDS */}

            <div className="analysisGrid">

              <AnalysisCard
                title="Communication"
                data={analysis.communication}
              />

              <AnalysisCard
                title="Relevance"
                data={analysis.relevance}
              />

              <AnalysisCard
                title="Structure"
                data={analysis.structure}
              />

              <AnalysisCard
                title="Specificity"
                data={analysis.specificity}
              />

              <AnalysisCard
                title="Behavioral"
                data={analysis.behavioral}
              />

              <AnalysisCard
                title="Technical"
                data={analysis.technical}
              />

              <AnalysisCard
                title="Project Discussion"
                data={analysis.project_discussion}
              />

            </div>

            {/* STRENGTHS + IMPROVEMENTS */}

            <div className="reportColumns">

              <div className="reportBox">

                <h2>
                  Strengths
                </h2>

                {analysis.strengths?.map(
                  (item, index) => (

                    <div
                      className="feedbackItem"
                      key={index}
                    >
                      ✓ {item}
                    </div>

                  )
                )}

              </div>

              <div className="reportBox">

                <h2>
                  Areas to Improve
                </h2>

                {analysis.improvements?.map(
                  (item, index) => (

                    <div
                      className="feedbackItem"
                      key={index}
                    >
                      → {item}
                    </div>

                  )
                )}

              </div>

            </div>

            {/* FINAL FEEDBACK */}

            <div className="reportBox finalFeedback">

              <h2>
                Final Feedback
              </h2>

              {analysis.final_feedback?.map(
                (item, index) => (

                  <p key={index}>
                    {index + 1}. {item}
                  </p>

                )
              )}

            </div>

            {/* NEW INTERVIEW */}

            <button
              className="primary"
              onClick={resetInterview}
            >
              Start New Interview

              <ChevronRight size={18} />

            </button>

          </section>
        )}

        {/* =========================
            ERROR
        ========================= */}

        {error && (

          <div className="error">
            {error}
          </div>

        )}

      </main>

    </div>
  )
}


// ==================================================
// STAGE CARD
// ==================================================

function Stage({
  number,
  title,
  text
}) {

  return (

    <div className="stageCard">

      <span className="stageNumber">
        {number}
      </span>

      <div>

        <strong>
          {title}
        </strong>

        <small>
          {text}
        </small>

      </div>

    </div>
  )
}


// ==================================================
// STAGE PROGRESS
// ==================================================

function StageProgress({
  currentStage
}) {

  const stages = [
    "introduction",
    "background",
    "behavioral",
    "technical",
    "coding",
    "project_discussion",
    "closing"
  ]

  const currentIndex =
    stages.indexOf(currentStage)

  return (

    <div className="stageTracker">

      {stages.map(
        (stage, index) => (

          <div
            key={stage}
            className={
              index < currentIndex
                ? "stageItem completed"
                : index === currentIndex
                ? "stageItem active"
                : "stageItem"
            }
          >

            <div className="stageDot">

              {index < currentIndex
                ? "✓"
                : index + 1}

            </div>

            <span>
              {formatStage(stage)}
            </span>

          </div>

        )
      )}

    </div>
  )
}


// ==================================================
// ANALYSIS CARD
// ==================================================

function AnalysisCard({
  title,
  data
}) {

  if (!data) {
    return null
  }

  return (

    <div className="analysisCard">

      <div className="analysisCardTop">

        <h3>
          {title}
        </h3>

        <strong>
          {data.score}/10
        </strong>

      </div>

      <div className="scoreBar">

        <div
          style={{
            width: `${data.score * 10}%`
          }}
        />

      </div>

      <p>
        {data.feedback}
      </p>

    </div>
  )
}


// ==================================================
// FORMAT STAGE NAME
// ==================================================

function formatStage(stage) {

  return stage
    .split("_")
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ")
}


export default App