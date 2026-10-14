import { useState } from "react";
import { Brain, AlertCircle, X, Sparkles, Loader2, RotateCcw } from "lucide-react";

import Navbar from "./components/Navbar";
import RoleSelector from "./components/RoleSelector";
import ModeSelector from "./components/ModeSelector";

import LandingPage from "./pages/LandingPage";
import InterviewPage from "./pages/InterviewPage";
import ReportPage from "./pages/ReportPage";
import DashboardPage from "./pages/DashboardPage";

import {
  startInterview as startInterviewAPI,
  submitAnswer as submitAnswerAPI,
  analyzeInterview as analyzeInterviewAPI,
  finishInterview as finishInterviewAPI,
  getHistoryDetail as getHistoryDetailAPI,
} from "./services/interviewService";

function App() {
  // ============================================
  // NAVIGATION & VIEW STATE
  // ============================================
  const [currentView, setCurrentView] = useState("interview"); // "interview" | "dashboard"

  // ============================================
  // INTERVIEW SETUP STATE
  // ============================================
  const [role, setRole] = useState("web_developer");
  const [experienceLevel, setExperienceLevel] = useState("beginner");
  const [mode, setMode] = useState(null);
  const [setupStep, setSetupStep] = useState("landing"); // "landing" | "role" | "mode" | "interview"

  // ============================================
  // ACTIVE INTERVIEW & REPORT STATE
  // ============================================
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisFailed, setAnalysisFailed] = useState(false);

  const [analysis, setAnalysis] = useState(null);

  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(null);

  // ============================================
  // UI & FEEDBACK STATE
  // ============================================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // STEP 1: LANDING PAGE → ROLE SELECTION
  // ============================================
  function handleLandingStart() {
    setError("");
    setSetupStep("role");
  }

  // ============================================
  // STEP 2: ROLE SELECTION → MODE SELECTION
  // ============================================
  function handleRoleContinue() {
    if (!role) {
      setError("Please select a target job role before continuing.");
      return;
    }
    setError("");
    setSetupStep("mode");
  }

  // ============================================
  // STEP 3: MODE SELECTION → START INTERVIEW
  // ============================================
  async function handleModeContinue() {
    if (!role) {
      setError("Please select a target job role.");
      setSetupStep("role");
      return;
    }

    if (!mode) {
      setError("Please select an interview mode (Text or Voice) before continuing.");
      return;
    }

    await startInterview();
  }

  // ============================================
  // START INTERVIEW API CALL
  // ============================================
  async function startInterview() {
    setLoading(true);
    setError("");

    try {
      const data = await startInterviewAPI(role, experienceLevel, mode);

      setStarted(true);
      setFinished(false);
      setAnalyzing(false);
      setAnalysisFailed(false);
      setSetupStep("interview");

      setQuestion(data.question);
      setProgress(data.progress);

      setAnswer("");
      setAnalysis(null);
    } catch (err) {
      console.error(err);
      const detailMsg =
        err.response?.data?.detail ||
        "Could not connect to the mock interview engine. Please make sure the FastAPI backend is running on http://127.0.0.1:8000.";
      setError(detailMsg);
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // ANALYZE INTERVIEW (WITH DUPLICATE-REQUEST GUARD)
  // ============================================
  async function analyzeInterview() {
    if (analyzing) return;

    setAnalyzing(true);
    setError("");
    setAnalysisFailed(false);

    try {
      const data = await analyzeInterviewAPI();
      if (!data || !data.analysis) {
        throw new Error("Invalid response format received from evaluation engine.");
      }
      setAnalysis(data.analysis);
      setFinished(true);
      setAnalysisFailed(false);
    } catch (err) {
      console.error("AI Analysis error:", err);
      // Clean, user-facing error message without internal stack traces, API keys, or raw secrets
      const message =
        err.response?.data?.detail === "AI analysis failed."
          ? "The AI evaluation engine could not complete the report at this moment. Your interview answers are saved on the server. Please click Retry below."
          : err.response?.data?.detail ||
            "Could not complete AI evaluation. Please verify backend connectivity and retry.";
      setError(message);
      setAnalysisFailed(true);
    } finally {
      setAnalyzing(false);
    }
  }

  // ============================================
  // SUBMIT ANSWER
  // ============================================
  async function submitAnswer() {
    if (!answer.trim()) {
      setError("Please provide an answer before submitting.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await submitAnswerAPI(answer);

      setProgress(data.progress);

      if (data.status === "finished") {
        setQuestion(null);
        setAnswer("");
        await analyzeInterview();
        return;
      }

      setQuestion(data.question);
      setAnswer("");
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.detail || "Could not submit your answer. Please retry.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // FINISH EARLY
  // ============================================
  async function handleFinishEarly() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setLoading(true);
    setError("");

    try {
      await finishInterviewAPI();
      setQuestion(null);
      setAnswer("");
      await analyzeInterview();
    } catch (err) {
      console.error(err);
      setError("Could not complete the interview session early.");
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // RESET INTERVIEW
  // ============================================
  function resetInterview() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setStarted(false);
    setFinished(false);
    setAnalyzing(false);
    setAnalysisFailed(false);
    setSetupStep("landing");

    setQuestion(null);
    setAnswer("");
    setProgress(null);

    setAnalysis(null);
    setError("");

    setMode(null);
    setCurrentView("interview");
  }

  // ============================================
  // REOPEN HISTORICAL REPORT FROM DASHBOARD
  // ============================================
  async function handleViewHistoricalReport(recordId) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    setLoading(true);
    setError("");

    try {
      const data = await getHistoryDetailAPI(recordId);
      if (!data || !data.interview) {
        throw new Error(`Interview report #${recordId} could not be loaded.`);
      }

      const rec = data.interview;
      setAnalysis(rec.analysis);
      setProgress({
        answered_questions: rec.answered_questions,
        total_questions: rec.total_questions,
        role_title: rec.role_title,
        experience_level: rec.experience_level,
      });
      setRole(rec.role);
      setExperienceLevel(rec.experience_level);
      setMode(rec.mode);

      setStarted(false);
      setFinished(true);
      setAnalyzing(false);
      setAnalysisFailed(false);
      setCurrentView("interview");
    } catch (err) {
      console.error("Failed to load historical report:", err);
      setError(
        err.response?.data?.detail ||
          "Could not open historical evaluation report. Please verify backend connectivity."
      );
    } finally {
      setLoading(false);
    }
  }

  const isNavResetAvailable =
    currentView === "dashboard" || setupStep !== "landing" || started || finished || analysisFailed;

  return (
    <div className="app">
      <Navbar
        onReset={isNavResetAvailable ? resetInterview : undefined}
        onOpenDashboard={() => setCurrentView((prev) => (prev === "dashboard" ? "interview" : "dashboard"))}
        currentView={currentView}
      />

      <main className="container">
        {/* ================= ERROR NOTIFICATION ================= */}
        {error && (
          <div className="errorBanner" role="alert">
            <div className="errorBannerContent">
              <AlertCircle size={18} className="errorIcon" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="errorDismissBtn"
              onClick={() => setError("")}
              aria-label="Dismiss error notification"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* ================= VIEW: DASHBOARD ================= */}
        {currentView === "dashboard" && (
          <DashboardPage
            onStartInterview={() => {
              resetInterview();
              setSetupStep("role");
            }}
            onBackToLanding={() => {
              resetInterview();
            }}
            onViewReport={handleViewHistoricalReport}
          />
        )}

        {/* ================= VIEW: INTERVIEW WORKFLOW ================= */}
        {currentView !== "dashboard" && (
          <>
            {/* ================= STEP 1: LANDING PAGE ================= */}
            {!started && !finished && !analyzing && !analysisFailed && setupStep === "landing" && (
              <LandingPage onStart={handleLandingStart} loading={loading} />
            )}

            {/* ================= STEP 2: ROLE SELECTION ================= */}
            {!started && !finished && !analyzing && !analysisFailed && setupStep === "role" && (
              <RoleSelector
                role={role}
                setRole={setRole}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                onContinue={handleRoleContinue}
                onBack={() => setSetupStep("landing")}
              />
            )}

            {/* ================= STEP 3: MODE SELECTION ================= */}
            {!started && !finished && !analyzing && !analysisFailed && setupStep === "mode" && (
              <ModeSelector
                mode={mode}
                setMode={setMode}
                role={role}
                experienceLevel={experienceLevel}
                onChangeRole={() => setSetupStep("role")}
                onContinue={handleModeContinue}
                onBack={() => setSetupStep("role")}
                loading={loading}
              />
            )}

            {/* ================= STEP 4: INTERVIEW IN PROGRESS ================= */}
            {started && !finished && !analyzing && !analysisFailed && question && (
              <InterviewPage
                question={question}
                answer={answer}
                setAnswer={setAnswer}
                progress={progress}
                loading={loading}
                analyzing={analyzing}
                onSubmit={submitAnswer}
                onFinishEarly={handleFinishEarly}
                mode={mode}
                onSwitchMode={setMode}
              />
            )}

            {/* ================= STEP 5: AI ANALYSIS LOADING SCREEN ================= */}
            {analyzing && (
              <section className="analyzingScreen" aria-live="polite">
                <div className="analyzingCard">
                  <div className="analyzingOrb">
                    <Brain size={44} className="analyzingBrainIcon" />
                    <span className="orbRing ring1" />
                    <span className="orbRing ring2" />
                  </div>

                  <div className="analyzingHeader">
                    <div className="analyzingBadge">
                      <Sparkles size={14} />
                      <span>AI RUBRIC ENGINE</span>
                    </div>
                    <h1>Evaluating Your Interview</h1>
                    <p className="analyzingSubtitle">
                      Synthesizing your communication, technical reasoning, behavioral responses,
                      and project discussion into a role-aligned performance report.
                    </p>
                  </div>

                  <div className="analyzingProgressSteps">
                    <div className="analyzingStep done">
                      <span className="stepDot" />
                      <span>Responses Ingested</span>
                    </div>
                    <div className="analyzingStep active">
                      <Loader2 size={14} className="stepSpinner" />
                      <span>Scoring 7 Core Dimensions</span>
                    </div>
                    <div className="analyzingStep">
                      <span className="stepDot" />
                      <span>Generating Role Recommendations</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ================= STEP 5B: ANALYSIS ERROR & RETRY SCREEN ================= */}
            {analysisFailed && !finished && !analyzing && (
              <section className="analysisErrorScreen" aria-live="assertive">
                <div className="analysisErrorCard">
                  <div className="analysisErrorIcon" aria-hidden="true">
                    <AlertCircle size={38} />
                  </div>
                  <div className="analysisErrorBadge">Evaluation Interrupted</div>
                  <h2>Unable to Complete Evaluation</h2>
                  <p className="analysisErrorDesc">
                    An issue occurred while communicating with the AI evaluation service.
                    Your interview responses have been safely saved on the server.
                    You can retry generating your report below.
                  </p>

                  <div className="analysisErrorActions">
                    <button
                      type="button"
                      className="primary retryAnalysisBtn"
                      onClick={analyzeInterview}
                      disabled={analyzing}
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      <span>Retry Analysis</span>
                    </button>

                    <button
                      type="button"
                      className="ghostButton"
                      onClick={resetInterview}
                      disabled={analyzing}
                    >
                      <span>Start New Interview</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ================= STEP 6: PERFORMANCE & FEEDBACK REPORT ================= */}
            {finished && analysis && (
              <ReportPage
                analysis={analysis}
                progress={progress}
                mode={mode}
                role={role}
                experienceLevel={experienceLevel}
                onNewInterview={resetInterview}
                onOpenDashboard={() => setCurrentView("dashboard")}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
