import { useState } from "react"

import Navbar from "./components/Navbar"

import LandingPage from "./pages/LandingPage"
import InterviewPage from "./pages/InterviewPage"
import ReportPage from "./pages/ReportPage"

import {
  startInterview as startInterviewAPI,
  submitAnswer as submitAnswerAPI,
  analyzeInterview as analyzeInterviewAPI
} from "./services/interviewService"

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


  async function startInterview() {

    setLoading(true)
    setError("")

    try {

      const data =
        await startInterviewAPI()

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


  async function analyzeInterview() {

    setAnalyzing(true)
    setError("")

    try {

      const data =
        await analyzeInterviewAPI()

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

      const data =
        await submitAnswerAPI(answer)

      setProgress(data.progress)

      if (data.status === "finished") {

        setQuestion(null)
        setAnswer("")

        await analyzeInterview()

        return
      }

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


  return (
    <div className="app">

      <Navbar />

      <main className="container">

        {!started &&
          !finished &&
          !analyzing && (

          <LandingPage
            onStart={startInterview}
            loading={loading}
          />

        )}


        {started &&
          !finished &&
          !analyzing &&
          question && (

          <InterviewPage
            question={question}
            answer={answer}
            setAnswer={setAnswer}
            progress={progress}
            loading={loading}
            onSubmit={submitAnswer}
          />

        )}


        {analyzing && (

          <section className="finished">

            <div className="finishIcon">
              🧠
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


        {finished &&
          analysis && (

          <ReportPage
            analysis={analysis}
            onNewInterview={resetInterview}
          />

        )}


        {error && (

          <div className="error">
            {error}
          </div>

        )}

      </main>

    </div>
  )
}

export default App