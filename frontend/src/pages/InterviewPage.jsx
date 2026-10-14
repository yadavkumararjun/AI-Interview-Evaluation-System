import {
  ChevronRight,
  Sparkles,
  AlertCircle,
  Flag,
  Layers,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import StageProgress from "../components/StageProgress";
import VoiceAnswer from "../components/VoiceAnswer";
import QuestionAudioControls from "../components/QuestionAudioControls";
import { formatStage } from "../utils/formatStage";

function InterviewPage({
  question,
  answer,
  setAnswer,
  progress,
  loading,
  analyzing = false,
  onSubmit,
  onFinishEarly,
  mode,
  onSwitchMode,
}) {
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  const isBusy = loading || isSubmitting || analyzing;

  const textareaRef = useRef(null);
  const stopSpeakingRef = useRef(null);
  const stopRecordingRef = useRef(null);

  const answeredCount = progress?.answered_questions || 0;
  const totalCount = progress?.total_questions || 15;
  const currentNumber = answeredCount + 1;
  const progressPercentage = Math.min(
    Math.round((answeredCount / totalCount) * 100),
    100
  );

  const isLastQuestion = currentNumber >= totalCount;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const charCount = answer.length;

  // Auto-focus textarea on new question in text mode
  useEffect(() => {
    if (mode === "text" && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [question, mode]);

  // Cancel question playback when question changes or component unmounts
  useEffect(() => {
    return () => {
      if (stopSpeakingRef.current) {
        stopSpeakingRef.current();
      }
    };
  }, [question]);

  // Submission handler with guard against duplicate triggers
  async function handleTextSubmit() {
    if (isBusy || !answer.trim()) return;

    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }

  // Answer submit wrapper for voice mode to ensure audio is canceled
  async function handleVoiceSubmit() {
    if (isBusy) return;
    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
    }
    await onSubmit();
  }

  return (
    <section className="interview" aria-labelledby="interview-stage-heading">
      {/* ================= HEADER & PROGRESS ================= */}
      <div className="interviewHeader">
        <div className="interviewStageInfo">
          <div className="stageBadge">
            <Layers size={13} aria-hidden="true" />
            <span>STAGE {question?.stage ? formatStage(question.stage) : "IN PROGRESS"}</span>
          </div>
          <h2 id="interview-stage-heading">
            {question?.stage ? formatStage(question.stage) : "Interview Question"}
          </h2>
        </div>

        <div className="interviewControls">
          <div className="questionCounterBadge">
            Question <strong>{currentNumber}</strong> of {totalCount}
          </div>

          {onFinishEarly && answeredCount > 0 && (
            <button
              type="button"
              className="ghostButton finishEarlyBtn"
              onClick={() => {
                if (stopSpeakingRef.current) stopSpeakingRef.current();
                setShowFinishConfirm(true);
              }}
              disabled={isBusy}
              title="Finish interview and generate report now"
            >
              <Flag size={14} aria-hidden="true" />
              <span>Finish Early</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="stageProgressTrack"
        role="progressbar"
        aria-valuenow={progressPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Interview progress: ${progressPercentage}%`}
      >
        <div
          className="stageProgressBar"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* ================= QUESTION CARD ================= */}
      <div className="questionCard">
        <div className="questionMeta">
          <span className="metaChip roleChip">
            💼 {progress?.role_title || question?.role || "Web Developer"}
          </span>

          <span className="metaChip expChip">
            🎓 {((progress?.experience_level || question?.experience_level || "beginner")).toUpperCase()}
          </span>

          <span className="metaChip categoryChip">
            {question?.category || "General"}
          </span>

          {question?.skill && (
            <span className="metaChip skillChip" title={`Skill: ${question.skill}`}>
              ⚡ {question.skill}
            </span>
          )}

          {question?.topic && question.topic !== question.skill && (
            <span className="metaChip topicChip" title={`Topic: ${question.topic}`}>
              🎯 {question.topic}
            </span>
          )}

          <span
            className={`metaChip difficultyChip ${
              question?.difficulty?.toLowerCase() || "medium"
            }`}
          >
            {question?.difficulty || "Standard"}
          </span>

          <span className="metaChip modeChip">
            {mode === "voice" ? "🎙️ Voice Mode" : "⌨️ Text Mode"}
          </span>
        </div>

        <p className="eyebrow">QUESTION PROMPT</p>
        <h1 className="questionText">{question?.question}</h1>

        {/* Text-to-Speech Question Audio Controls in Voice Mode */}
        {mode === "voice" && (
          <QuestionAudioControls
            questionText={question?.question}
            questionId={question?.question_id || question?.question}
            mode={mode}
            isRecordingActive={isRecordingActive}
            onStopRecording={() => {
              if (stopRecordingRef.current) stopRecordingRef.current();
            }}
            registerStopSpeaking={(fn) => {
              stopSpeakingRef.current = fn;
            }}
          />
        )}

        {/* ================= TEXT MODE ================= */}
        {mode === "text" && (
          <div className="answerSection">
            <div className="textareaWrapper">
              <label htmlFor="text-answer" className="sr-only">
                Your Answer
              </label>
              <textarea
                id="text-answer"
                ref={textareaRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Structure your response clearly. Take your time to cover key concepts, context, and outcomes..."
                disabled={isBusy}
                aria-describedby="text-answer-hint"
              />

              <div className="textMetaBar">
                <span id="text-answer-hint" className="answerHint">
                  {wordCount > 0 ? `${wordCount} words • ${charCount} chars` : "Tip: Structure your thoughts clearly with concrete examples"}
                </span>

                {answer && (
                  <button
                    type="button"
                    className="clearBtn"
                    onClick={() => setAnswer("")}
                    disabled={isBusy}
                    title="Clear current answer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="answerFooter">
              <div className="answerFooterNote">
                <Sparkles size={14} className="sparkleIcon" aria-hidden="true" />
                <span>Your answer will be analyzed by the AI evaluator upon submission.</span>
              </div>

              <button
                type="button"
                className="primary submitButton"
                onClick={handleTextSubmit}
                disabled={isBusy || !answer.trim()}
              >
                {isBusy ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <span>{isLastQuestion ? "Submit & View Report" : "Submit Answer"}</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= VOICE MODE ================= */}
        {mode === "voice" && (
          <VoiceAnswer
            answer={answer}
            setAnswer={setAnswer}
            loading={isBusy}
            onSubmit={handleVoiceSubmit}
            isLastQuestion={isLastQuestion}
            question={question}
            onSwitchToText={onSwitchMode ? () => onSwitchMode("text") : undefined}
            onBeforeRecordStart={() => {
              if (stopSpeakingRef.current) stopSpeakingRef.current();
            }}
            registerStopRecording={(fn) => {
              stopRecordingRef.current = fn;
            }}
            onRecordingStateChange={setIsRecordingActive}
          />
        )}
      </div>

      {/* ================= 7-STAGE PROGRESS TRACKER ================= */}
      <StageProgress currentStage={question?.stage} />

      {/* ================= FINISH EARLY CONFIRMATION MODAL ================= */}
      {showFinishConfirm && (
        <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modalCard">
            <div className="modalIcon">
              <AlertCircle size={28} />
            </div>
            <h3 id="modal-title">Finish Interview Early?</h3>
            <p>
              You have answered {answeredCount} of {totalCount} questions. If you finish now,
              your AI evaluation report will be generated based on the answers provided so far.
            </p>
            <div className="modalActions">
              <button
                type="button"
                className="modalCancelBtn"
                onClick={() => setShowFinishConfirm(false)}
                disabled={isBusy}
              >
                Continue Interview
              </button>
              <button
                type="button"
                className="primary modalConfirmBtn"
                onClick={async () => {
                  setShowFinishConfirm(false);
                  if (stopSpeakingRef.current) stopSpeakingRef.current();
                  if (onFinishEarly) await onFinishEarly();
                }}
                disabled={isBusy}
              >
                Finish & Evaluate
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default InterviewPage;
