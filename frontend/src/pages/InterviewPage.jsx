import { ChevronRight, Mic, MicOff, Keyboard } from "lucide-react";
import { useState } from "react";

import StageProgress from "../components/StageProgress";
import { formatStage } from "../utils/formatStage";

function InterviewPage({
  question,
  answer,
  setAnswer,
  progress,
  loading,
  onSubmit,
  mode,
}) {
  const progressPercentage = progress
    ? Math.round((progress.answered_questions / progress.total_questions) * 100)
    : 0;

  return (
    <section className="interview">
      <div className="interviewHeader">
        <div>
          <p className="eyebrow">CURRENT STAGE</p>

          <h2>{formatStage(question.stage)}</h2>
        </div>

        <div className="questionCounter">
          Question {progress ? progress.answered_questions + 1 : 1} of{" "}
          {progress?.total_questions || 15}
        </div>
      </div>

      <div className="stageProgress">
        <div
          className="stageProgressBar"
          style={{
            width: `${progressPercentage}%`,
          }}
        />
      </div>

      <div className="questionCard">
        <div className="questionMeta">
          <span>{question.category}</span>

          <span>{question.difficulty}</span>

          <div className="interviewMode">
            {mode === "text" ? "⌨️ Text Interview" : "🎙️ Voice Interview"}
          </div>
        </div>

        <p className="eyebrow">INTERVIEW QUESTION</p>

        <h1>{question.question}</h1>

        {/* =========================
      TEXT MODE
  ========================= */}

        {mode === "text" && (
          <>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Take your time and answer as you would in a real interview..."
              disabled={loading}
            />

            <div className="answerFooter">
              <span>Your answer will be analyzed after the interview.</span>

              <button
                className="primary"
                onClick={onSubmit}
                disabled={loading || !answer.trim()}
              >
                {loading ? "Submitting..." : "Submit Answer"}

                <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* =========================
      VOICE MODE
  ========================= */}

        {mode === "voice" && (
          <VoiceAnswer
            answer={answer}
            setAnswer={setAnswer}
            loading={loading}
            onSubmit={onSubmit}
          />
        )}
      </div>

      <StageProgress currentStage={question.stage} />
    </section>
  );
}

function VoiceAnswer({ answer, setAnswer, loading, onSubmit }) {
  const [listening, setListening] = useState(false);

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;

      setAnswer(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);

      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }

  return (
    <div className="voiceAnswer">
      <div className="voiceBox">
        <button
          type="button"
          className={listening ? "voiceButton listening" : "voiceButton"}
          onClick={startListening}
          disabled={loading}
        >
          {listening ? <MicOff size={32} /> : <Mic size={32} />}
        </button>

        <h3>{listening ? "Listening..." : "Click the microphone to answer"}</h3>

        <p>Speak naturally as you would during a real interview.</p>
      </div>

      {answer && (
        <div className="transcriptBox">
          <div className="transcriptHeader">
            <span>Your Answer</span>

            <Keyboard size={17} />
          </div>

          <p>{answer}</p>
        </div>
      )}

      <div className="answerFooter">
        <span>Your speech will be converted to text before AI evaluation.</span>

        <button
          className="primary"
          onClick={onSubmit}
          disabled={loading || !answer.trim() || listening}
        >
          {loading ? "Submitting..." : "Submit Answer"}

          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default InterviewPage;
