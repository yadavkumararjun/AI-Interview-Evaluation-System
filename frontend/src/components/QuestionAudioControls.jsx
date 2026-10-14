import { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2,
  VolumeX,
  Square,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const TTS_MUTED_STORAGE_KEY = "interview_tts_muted";

function getBestEnglishVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Try en-IN voice first if available
  const indianVoice = voices.find(
    (v) => v.lang === "en-IN" || v.lang === "en_IN"
  );
  if (indianVoice) return indianVoice;

  // 2. Try any other English voice
  const englishVoice = voices.find((v) => v.lang.startsWith("en"));
  if (englishVoice) return englishVoice;

  // 3. Fallback to default voice or first available
  return voices.find((v) => v.default) || voices[0] || null;
}

export function QuestionAudioControls({
  questionText,
  questionId,
  mode,
  isRecordingActive,
  onStopRecording,
  registerStopSpeaking,
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem(TTS_MUTED_STORAGE_KEY) === "true";
    } catch (e) {
      return false;
    }
  });

  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";

  const currentUtteranceRef = useRef(null);
  const lastSpokenIdRef = useRef(null);
  const selectedVoiceRef = useRef(null);

  // Stop speech playback immediately
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
  }, []);

  // Register stopSpeaking with parent if requested (for mutual exclusion with mic)
  useEffect(() => {
    if (registerStopSpeaking) {
      registerStopSpeaking(stopSpeaking);
    }
  }, [registerStopSpeaking, stopSpeaking]);

  // Load browser voices & listen for voiceschanged event
  useEffect(() => {
    if (!isSupported) return;

    function loadVoices() {
      selectedVoiceRef.current = getBestEnglishVoice();
    }

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Speak the clean question text aloud
  const speakQuestion = useCallback(
    (force = false) => {
      if (!isSupported || !questionText) return;
      if (isMuted && !force) return;
      if (mode !== "voice") return;

      // Stop any microphone recording first to prevent echo/interference
      if (isRecordingActive && onStopRecording) {
        onStopRecording();
      }

      // Stop previous utterance
      stopSpeaking();

      const cleanText = questionText.trim();
      if (!cleanText) return;

      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "en-IN";
        utterance.rate = 0.95; // Slightly measured rate for interview clarity
        utterance.pitch = 1.0;

        if (selectedVoiceRef.current) {
          utterance.voice = selectedVoiceRef.current;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
        };

        utterance.onerror = (e) => {
          console.warn("Speech synthesis notice:", e);
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis failed to play:", err);
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
      }
    },
    [
      isSupported,
      questionText,
      isMuted,
      mode,
      isRecordingActive,
      onStopRecording,
      stopSpeaking,
    ]
  );

  // Auto-read question when a new question loads in Voice Mode
  useEffect(() => {
    if (!isSupported || mode !== "voice" || !questionText) {
      stopSpeaking();
      return;
    }

    const currentKey = questionId || questionText;

    // Prevent speaking same question repeatedly because of React re-renders
    if (lastSpokenIdRef.current !== currentKey) {
      lastSpokenIdRef.current = currentKey;
      if (!isMuted) {
        speakQuestion(false);
      } else {
        stopSpeaking();
      }
    }

    return () => {
      stopSpeaking();
    };
  }, [questionId, questionText, mode, isMuted, isSupported, speakQuestion, stopSpeaking]);

  // Cancel ongoing speech if user leaves screen / unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Toggle Mute / Auto-Read
  function handleToggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem(TTS_MUTED_STORAGE_KEY, String(nextMuted));
    } catch (e) {}

    if (nextMuted) {
      stopSpeaking();
    } else {
      speakQuestion(true);
    }
  }

  // Handle explicit Replay Question click
  function handleReplay() {
    speakQuestion(true);
  }

  // Only render controls in Voice Interview mode
  if (mode !== "voice") {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="audioUnsupportedNotice" aria-label="Speech synthesis not supported">
        <AlertCircle size={14} />
        <span>Text-to-speech audio is not supported in this browser.</span>
      </div>
    );
  }

  return (
    <div
      className={`questionAudioToolbar ${isSpeaking ? "isPlaying" : ""}`}
      aria-label="Interview question audio controls"
    >
      {/* Live Speaking Indicator */}
      <div className="speakingIndicatorArea">
        {isSpeaking ? (
          <div className="speakingBadge active" aria-live="polite">
            <span className="speakingDot" aria-hidden="true" />
            <span className="speakingText">AI Interviewer Speaking...</span>
            <div className="speakingWaves" aria-hidden="true">
              <span className="ttsWave bar1" />
              <span className="ttsWave bar2" />
              <span className="ttsWave bar3" />
            </div>
          </div>
        ) : (
          <div className="speakingBadge idle">
            <Volume2 size={13} className="ttsIconIdle" aria-hidden="true" />
            <span className="speakingText">
              {isMuted ? "Question Audio Muted" : "Voice Playback Enabled"}
            </span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="audioButtonsGroup">
        {/* Stop Speaking (Visible while playing) */}
        {isSpeaking && (
          <button
            type="button"
            className="audioBtn stopSpeakingBtn"
            onClick={stopSpeaking}
            title="Stop question reading"
            aria-label="Stop reading question aloud"
          >
            <Square size={13} aria-hidden="true" />
            <span>Stop Audio</span>
          </button>
        )}

        {/* Replay Question */}
        <button
          type="button"
          className="audioBtn replayBtn"
          onClick={handleReplay}
          title="Replay question aloud"
          aria-label="Replay interview question aloud"
        >
          <RotateCcw size={13} aria-hidden="true" />
          <span>Replay Question</span>
        </button>

        {/* Mute / Unmute Auto-Read */}
        <button
          type="button"
          className={`audioBtn muteToggleBtn ${isMuted ? "muted" : ""}`}
          onClick={handleToggleMute}
          title={isMuted ? "Unmute question audio" : "Mute question audio"}
          aria-label={isMuted ? "Unmute question reading" : "Mute question reading"}
          aria-pressed={isMuted}
        >
          {isMuted ? (
            <>
              <VolumeX size={13} aria-hidden="true" />
              <span>Unmute Audio</span>
            </>
          ) : (
            <>
              <Volume2 size={13} aria-hidden="true" />
              <span>Mute</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default QuestionAudioControls;
