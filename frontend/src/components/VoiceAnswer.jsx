import {
  Mic,
  Pause,
  Play,
  Square,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Globe,
  Keyboard,
  Info,
  ChevronRight,
  Loader2,
  Volume2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

const SUPPORTED_LOCALES = [
  { code: "en-IN", label: "English (India)" },
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-AU", label: "English (Australia)" },
];

function VoiceAnswer({
  answer,
  setAnswer,
  loading,
  onSubmit,
  isLastQuestion,
  question,
  onSwitchToText,
  onBeforeRecordStart,
  registerStopRecording,
  onRecordingStateChange,
}) {
  // Recording statuses: 'idle' | 'recording' | 'paused' | 'processing' | 'unavailable'
  const [status, setStatus] = useState("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [locale, setLocale] = useState("en-IN"); // en-IN default as required
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature detection
  const isSpeechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Lifecycle & intent references
  const recognitionRef = useRef(null);
  const isRecordingDesiredRef = useRef(false);
  const restartTimeoutRef = useRef(null);
  const isStartingRef = useRef(false);
  const errorCountRef = useRef(0);
  const unmountedRef = useRef(false);

  // Notify parent of recording state (for TTS mutual exclusion)
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(status === "recording");
    }
  }, [status, onRecordingStateChange]);

  // Safely stop any running recognition instance
  const stopActiveInstance = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (err) {}
      }
      recognitionRef.current = null;
    }
    isStartingRef.current = false;
  }, []);

  // Safe starter that prevents duplicate instances
  const safeStartRecognition = useCallback(() => {
    if (unmountedRef.current) return;
    if (!isRecordingDesiredRef.current) return;

    if (!isSpeechSupported) {
      setStatus("unavailable");
      setErrorMessage(
        "Speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or type your answer manually."
      );
      isRecordingDesiredRef.current = false;
      return;
    }

    if (isStartingRef.current) return;

    // Stop previous instance before starting anew
    stopActiveInstance();

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    try {
      isStartingRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.lang = locale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isStartingRef.current = false;
        errorCountRef.current = 0;
        setStatus("recording");
        setErrorMessage("");
      };

      recognition.onresult = (event) => {
        let interimStr = "";

        // Process only newly recognized results starting from resultIndex
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPiece = result[0]?.transcript || "";

          if (result.isFinal) {
            const trimmedPiece = transcriptPiece.trim();
            if (trimmedPiece) {
              // Append newly finalized speech to state without overwriting previous text
              setAnswer((prevAnswer) => {
                const base = prevAnswer ? prevAnswer.trim() : "";
                return base ? `${base} ${trimmedPiece}` : trimmedPiece;
              });
            }
          } else {
            interimStr += transcriptPiece;
          }
        }

        setInterimTranscript(interimStr.trim());
      };

      recognition.onerror = (event) => {
        const err = event.error;
        console.warn("Speech recognition notice:", err);

        // 'no-speech' is a natural pause by candidate - NOT a permanent error
        if (err === "no-speech") {
          return;
        }

        // 'aborted' is triggered during intentional stop or restart
        if (err === "aborted") {
          return;
        }

        if (err === "not-allowed" || err === "service-not-allowed") {
          isRecordingDesiredRef.current = false;
          setStatus("unavailable");
          setErrorMessage(
            "Microphone permission was denied. Please allow microphone access in your browser settings (click the lock/site settings icon in the address bar), or type your answer below."
          );
          return;
        }

        if (err === "audio-capture") {
          isRecordingDesiredRef.current = false;
          setStatus("unavailable");
          setErrorMessage(
            "No audio recording device was found. Please connect a microphone or type your answer below."
          );
          return;
        }

        if (err === "network") {
          errorCountRef.current += 1;
          if (errorCountRef.current >= 3) {
            isRecordingDesiredRef.current = false;
            setStatus("unavailable");
            setErrorMessage(
              "Network connection error contacting browser speech service. You can type your answer below or retry."
            );
          }
          return;
        }

        errorCountRef.current += 1;
        if (errorCountRef.current >= 3) {
          isRecordingDesiredRef.current = false;
          setStatus("unavailable");
          setErrorMessage(
            `Speech recognition notice (${err}). You can continue speaking or edit your answer directly below.`
          );
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        isStartingRef.current = false;
        setInterimTranscript("");

        // If user still desires to be recording (e.g. natural pause or browser timeout)
        // and no permanent error occurred, restart safely after a brief delay
        if (isRecordingDesiredRef.current && !unmountedRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isRecordingDesiredRef.current && !unmountedRef.current) {
              safeStartRecognition();
            }
          }, 200);
        } else if (!isRecordingDesiredRef.current && status !== "unavailable") {
          setStatus((prev) => (prev === "recording" ? "paused" : prev));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      isStartingRef.current = false;
      errorCountRef.current += 1;

      if (errorCountRef.current >= 3) {
        isRecordingDesiredRef.current = false;
        setStatus("unavailable");
        setErrorMessage(
          "Could not initialize microphone. Please check permissions or type your answer directly."
        );
      }
    }
  }, [locale, isSpeechSupported, setAnswer, stopActiveInstance, status]);

  // Start recording from idle state
  const startRecording = useCallback(() => {
    if (loading || isSubmitting) return;

    // Cancel speech synthesis first so speakers don't echo into microphone
    if (onBeforeRecordStart) {
      onBeforeRecordStart();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    clearTimeout(restartTimeoutRef.current);
    errorCountRef.current = 0;
    isRecordingDesiredRef.current = true;
    setErrorMessage("");
    setStatus("processing");
    safeStartRecognition();
  }, [loading, isSubmitting, onBeforeRecordStart, safeStartRecognition]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    isRecordingDesiredRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    stopActiveInstance();
    setInterimTranscript("");
    setStatus("paused");
  }, [stopActiveInstance]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    startRecording();
  }, [startRecording]);

  // Register stopRecording callback for parent (TTS replay coordination)
  useEffect(() => {
    if (registerStopRecording) {
      registerStopRecording(pauseRecording);
    }
  }, [registerStopRecording, pauseRecording]);

  // Handle Question changes or unmount
  useEffect(() => {
    unmountedRef.current = false;
    isRecordingDesiredRef.current = false;
    clearTimeout(restartTimeoutRef.current);
    stopActiveInstance();
    setStatus("idle");
    setInterimTranscript("");
    setErrorMessage("");

    return () => {
      unmountedRef.current = true;
      isRecordingDesiredRef.current = false;
      clearTimeout(restartTimeoutRef.current);
      stopActiveInstance();
    };
  }, [question, stopActiveInstance]);

  // Clear transcript action
  function handleClearTranscript() {
    pauseRecording();
    setAnswer("");
    setInterimTranscript("");
    setErrorMessage("");
    setStatus("idle");
  }

  // Submit Answer guard
  async function handleSubmitAnswer() {
    if (isSubmitting || loading) return;

    // Pause recording first so any last words are preserved
    if (status === "recording") {
      pauseRecording();
    }

    if (!answer.trim()) {
      setErrorMessage("Please speak or type an answer before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const charCount = answer.length;

  return (
    <div className="voiceAnswerContainer" aria-label="Voice Answer Interface">
      {/* ================= VOICE CONTROL PANEL ================= */}
      <div
        className={`voiceControlCard ${
          status === "recording" ? "isListening" : ""
        } ${status === "unavailable" ? "hasError" : ""}`}
      >
        {/* Top Control Bar: Status indicator & Locale selector */}
        <div className="voiceControlBar">
          <div className="voiceStatusIndicator">
            {status === "idle" && (
              <span className="voiceStatusPill idle">
                <span className="statusDot" />
                <span>Microphone Ready</span>
              </span>
            )}

            {status === "recording" && (
              <span className="voiceStatusPill recording" aria-live="assertive">
                <span className="statusDot pulsating" />
                <span>Recording</span>
              </span>
            )}

            {status === "paused" && (
              <span className="voiceStatusPill paused">
                <span className="statusDot" />
                <span>Paused</span>
              </span>
            )}

            {status === "processing" && (
              <span className="voiceStatusPill processing">
                <Loader2 size={12} className="statusSpinner" />
                <span>Processing</span>
              </span>
            )}

            {status === "unavailable" && (
              <span className="voiceStatusPill unavailable">
                <AlertCircle size={12} />
                <span>Microphone Unavailable</span>
              </span>
            )}
          </div>

          <div className="voiceLocaleSelector">
            <Globe size={14} className="localeIcon" aria-hidden="true" />
            <label htmlFor="voice-locale-select" className="sr-only">
              Speech Recognition Locale
            </label>
            <select
              id="voice-locale-select"
              value={locale}
              onChange={(e) => {
                const newLocale = e.target.value;
                setLocale(newLocale);
                if (status === "recording") {
                  pauseRecording();
                }
              }}
              disabled={loading || status === "recording"}
              className="localeSelect"
              title="Select speech recognition language locale"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc.code} value={loc.code}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Central Audio / Microphone Interaction Area */}
        <div className="voiceCenterArea">
          <div className="voiceBtnWrapper">
            {status === "recording" && (
              <button
                type="button"
                className="voiceMainButton listening"
                onClick={pauseRecording}
                disabled={loading}
                aria-label="Pause Recording"
                title="Pause recording"
              >
                <Pause size={30} />
                <span className="pulseRing wave1" aria-hidden="true" />
                <span className="pulseRing wave2" aria-hidden="true" />
              </button>
            )}

            {status === "paused" && (
              <button
                type="button"
                className="voiceMainButton paused"
                onClick={resumeRecording}
                disabled={loading}
                aria-label="Resume Recording"
                title="Resume recording"
              >
                <Play size={30} style={{ marginLeft: "3px" }} />
              </button>
            )}

            {status === "idle" && (
              <button
                type="button"
                className="voiceMainButton idle"
                onClick={startRecording}
                disabled={loading}
                aria-label="Start Recording"
                title="Start recording"
              >
                <Mic size={32} />
              </button>
            )}

            {status === "processing" && (
              <button
                type="button"
                className="voiceMainButton processing"
                disabled
                aria-label="Processing audio"
              >
                <Loader2 size={32} className="spinIcon" />
              </button>
            )}

            {status === "unavailable" && (
              <button
                type="button"
                className="voiceMainButton error"
                onClick={startRecording}
                disabled={loading}
                aria-label="Try microphone again"
                title="Try microphone again"
              >
                <Mic size={32} />
              </button>
            )}
          </div>

          <div className="voiceActionPrompt">
            <h3>
              {status === "recording" && "Recording Your Answer..."}
              {status === "paused" && "Recording Paused"}
              {status === "processing" && "Connecting Microphone..."}
              {status === "idle" && "Click to Start Answering"}
              {status === "unavailable" && "Microphone Unavailable"}
            </h3>

            <p>
              {status === "recording" &&
                "Speak naturally. You can pause to think at any time without losing your speech. Click Pause when finished."}
              {status === "paused" &&
                "Your transcript is safely preserved. Click Resume to add more speech, or review and submit below."}
              {status === "processing" &&
                "Initializing speech recognition..."}
              {status === "idle" &&
                "Speak your answer naturally. Spoken words will be converted into editable text below."}
              {status === "unavailable" &&
                (errorMessage || "You can enable microphone access in your browser or type your answer directly below.")}
            </p>

            {/* Audio Waveform visualization when recording */}
            {status === "recording" && (
              <div className="soundWave" aria-hidden="true">
                <span className="waveBar bar1" />
                <span className="waveBar bar2" />
                <span className="waveBar bar3" />
                <span className="waveBar bar4" />
                <span className="waveBar bar5" />
                <span className="waveBar bar6" />
                <span className="waveBar bar7" />
              </div>
            )}
          </div>

          {/* Quick Action Controls */}
          <div className="voiceQuickControls">
            {status === "recording" && (
              <button
                type="button"
                className="voiceActionBtn pauseBtn"
                onClick={pauseRecording}
                title="Pause recording"
              >
                <Pause size={14} />
                <span>Pause Recording</span>
              </button>
            )}

            {status === "paused" && (
              <button
                type="button"
                className="voiceActionBtn resumeBtn"
                onClick={resumeRecording}
                title="Resume recording"
              >
                <Play size={14} />
                <span>Resume Recording</span>
              </button>
            )}

            {status === "idle" && (
              <button
                type="button"
                className="voiceActionBtn startBtn"
                onClick={startRecording}
                title="Start recording"
              >
                <Mic size={14} />
                <span>Start Recording</span>
              </button>
            )}

            {answer && status !== "recording" && (
              <button
                type="button"
                className="voiceActionBtn retryBtn"
                onClick={handleClearTranscript}
                disabled={loading}
                title="Clear answer and reset"
              >
                <RotateCcw size={14} />
                <span>Clear Transcript</span>
              </button>
            )}

            {onSwitchToText && (
              <button
                type="button"
                className="voiceActionBtn textSwitchBtn"
                onClick={() => {
                  pauseRecording();
                  onSwitchToText();
                }}
                disabled={loading}
                title="Switch to full Text Interview mode"
              >
                <Keyboard size={14} />
                <span>Switch to Text Mode</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Notification Banner if an error occurred */}
        {errorMessage && (
          <div className="voiceErrorBanner" role="alert">
            <AlertCircle size={18} className="errorBannerIcon" />
            <div className="errorBannerBody">
              <strong>Notice</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Live Interim Transcription Preview Box */}
        {status === "recording" && interimTranscript && (
          <div className="liveInterimBox" aria-live="polite">
            <div className="interimHeader">
              <Volume2 size={14} className="interimIcon" />
              <span>Hearing now:</span>
            </div>
            <p className="interimText">“{interimTranscript}”</p>
          </div>
        )}
      </div>

      {/* ================= EDITABLE TRANSCRIPT TEXTAREA ================= */}
      <div className="transcriptEditorSection">
        <div className="transcriptEditorHeader">
          <div className="editorTitleGroup">
            <label htmlFor="voice-transcript-editor" className="editorTitle">
              Your Answer Transcript
            </label>
            <span className="editableTag">Directly Editable</span>
          </div>

          <div className="editorCounters">
            <span>{wordCount} words</span>
            <span className="dotDivider">•</span>
            <span>{charCount} characters</span>
          </div>
        </div>

        <textarea
          id="voice-transcript-editor"
          className="voiceTranscriptTextarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={
            status === "recording"
              ? "Your speech will appear here in real time... You can pause naturally or edit directly."
              : "Click the microphone above to start speaking, or type your answer here manually..."
          }
          disabled={loading}
          rows={6}
          aria-describedby="transcript-editor-hint"
        />

        <div className="transcriptEditorFooter">
          <p id="transcript-editor-hint" className="editorHint">
            Review and adjust your response before submitting. The AI evaluation will score only the text shown above.
          </p>

          {answer && (
            <button
              type="button"
              className="clearTextBtn"
              onClick={handleClearTranscript}
              disabled={loading || status === "recording"}
              title="Clear transcript text"
            >
              Clear Transcript
            </button>
          )}
        </div>
      </div>

      {/* Honest Web Speech API Limitation Notice */}
      <div className="speechApiNotice">
        <Info size={14} className="noticeIcon" aria-hidden="true" />
        <span>
          Browser-managed speech recognition (<strong>{locale}</strong>). Offline availability and performance
          depend on your browser and operating system. Your speech is transcribed locally and submitted only when you click Submit Answer.
        </span>
      </div>

      {/* ================= SUBMIT ACTION BAR ================= */}
      <div className="answerFooter">
        <div className="answerFooterNote">
          <Sparkles size={14} className="sparkleIcon" aria-hidden="true" />
          <span>Confirm your answer before submitting for evaluation.</span>
        </div>

        <button
          type="button"
          className="primary submitButton"
          onClick={handleSubmitAnswer}
          disabled={
            loading ||
            isSubmitting ||
            !answer.trim() ||
            status === "recording" ||
            status === "processing"
          }
          aria-label={isLastQuestion ? "Submit and view report" : "Submit answer and continue"}
        >
          {loading || isSubmitting ? (
            <>
              <Loader2 size={16} className="spinIcon" />
              <span>Submitting Answer...</span>
            </>
          ) : (
            <>
              <span>{isLastQuestion ? "Submit & View Report" : "Submit Answer"}</span>
              <ChevronRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default VoiceAnswer;
