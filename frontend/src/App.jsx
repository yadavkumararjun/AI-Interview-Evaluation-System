
import { useState } from "react";

import Navbar from "./components/Navbar";
import ModeSelector from "./components/ModeSelector";

import LandingPage from "./pages/LandingPage";
import InterviewPage from "./pages/InterviewPage";
import ReportPage from "./pages/ReportPage";

import {
  startInterview as startInterviewAPI,
  submitAnswer as submitAnswerAPI,
  analyzeInterview as analyzeInterviewAPI,
} from "./services/interviewService";

function App() {
  // ============================================
  // INTERVIEW STATE
  // ============================================

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [analysis, setAnalysis] = useState(null);

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(null);

  // ============================================
  // MODE STATE
  // ============================================

  const [mode, setMode] = useState(null);
  const [modeSelected, setModeSelected] = useState(false);

  // ============================================
  // UI STATE
  // ============================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // STEP 1
  // LANDING PAGE → MODE SELECTOR
  // ============================================

  function openModeSelector() {
    setError("");
    setModeSelected(true);
  }

  // ============================================
  // STEP 2
  // MODE SELECTOR → START INTERVIEW
  // ============================================

  async function handleModeContinue() {
    if (!mode) {
      setError("Please select an interview mode.");
      return;
    }

    await startInterview();
  }

  // ============================================
  // START INTERVIEW
  // ============================================

  async function startInterview() {
    setLoading(true);
    setError("");

    try {
      /*
       * Currently the backend starts the same interview
       * regardless of text or voice mode.
       *
       * We keep the selected mode in React state so that
       * the frontend can later use it for:
       *
       * text  → textarea
       * voice → microphone / speech recognition
       */

      const data = await startInterviewAPI();

      setStarted(true);
      setFinished(false);
      setAnalyzing(false);

      setQuestion(data.question);
      setProgress(data.progress);

      setAnswer("");
      setAnalysis(null);
    } catch (error) {
      console.error(error);

      setError(
        "Could not start the interview. Please make sure the FastAPI backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ANALYZE INTERVIEW
  // ============================================

  async function analyzeInterview() {
    setAnalyzing(true);
    setError("");

    try {
      const data = await analyzeInterviewAPI();

      setAnalysis(data.analysis);
      setFinished(true);
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.detail || "AI analysis failed.";

      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }

  // ============================================
  // SUBMIT ANSWER
  // ============================================

  async function submitAnswer() {
    if (!answer.trim()) {
      setError("Please provide an answer before continuing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await submitAnswerAPI(answer);

      setProgress(data.progress);

      // ==========================================
      // INTERVIEW FINISHED
      // ==========================================

      if (data.status === "finished") {
        setQuestion(null);
        setAnswer("");

        await analyzeInterview();

        return;
      }

      // ==========================================
      // NEXT QUESTION
      // ==========================================

      setQuestion(data.question);
      setAnswer("");
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.detail ||
        "Could not submit your answer.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // RESET INTERVIEW
  // ============================================

  function resetInterview() {
    setStarted(false);
    setFinished(false);
    setAnalyzing(false);

    setQuestion(null);
    setAnswer("");
    setProgress(null);

    setAnalysis(null);
    setError("");

    // Reset mode selection
    setMode(null);
    setModeSelected(false);
  }

  // ============================================
  // RETURN UI
  // ============================================

  return (
    <div className="app">
      <Navbar />

      <main className="container">

        {/* ========================================
            STEP 1
            LANDING PAGE
        ======================================== */}

        {!started &&
          !finished &&
          !analyzing &&
          !modeSelected && (
            <LandingPage
              onStart={openModeSelector}
              loading={loading}
            />
          )}

        {/* ========================================
            STEP 2
            MODE SELECTOR
        ======================================== */}

        {!started &&
          !finished &&
          !analyzing &&
          modeSelected && (
            <ModeSelector
              mode={mode}
              setMode={setMode}
              onContinue={handleModeContinue}
            />
          )}

        {/* ========================================
            STEP 3
            INTERVIEW
        ======================================== */}

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
              mode={mode}
            />
          )}

        {/* ========================================
            STEP 4
            AI ANALYSIS
        ======================================== */}

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

        {/* ========================================
            STEP 5
            REPORT
        ======================================== */}

        {finished && analysis && (
          <ReportPage
            analysis={analysis}
            onNewInterview={resetInterview}
          />
        )}

        {/* ========================================
            ERROR MESSAGE
        ======================================== */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;

