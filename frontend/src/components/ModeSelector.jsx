import { Mic, Keyboard, ChevronRight } from "lucide-react"

function ModeSelector({ mode, setMode, onContinue }) {
  return (
    <section className="modeSelection">
      <div className="modeHeader">
        <p className="eyebrow">INTERVIEW MODE</p>

        <h1>How would you like to take your interview?</h1>

        <p className="subtitle">
          Choose how you want to answer the interview questions.
          Both modes use the same AI evaluation system.
        </p>
      </div>

      <div className="modeGrid">

        {/* TEXT MODE */}
        <button
          className={`modeCard ${mode === "text" ? "selected" : ""}`}
          onClick={() => setMode("text")}
        >
          <div className="modeIcon">
            <Keyboard size={32} />
          </div>

          <h2>Text Interview</h2>

          <p>
            Type your answers and submit them after each question.
          </p>

          <span>
            Best for typing answers
          </span>
        </button>

        {/* VOICE MODE */}
        <button
          className={`modeCard ${mode === "voice" ? "selected" : ""}`}
          onClick={() => setMode("voice")}
        >
          <div className="modeIcon">
            <Mic size={32} />
          </div>

          <h2>Voice Interview</h2>

          <p>
            Speak your answers naturally like a real interview.
          </p>

          <span>
            Speech-to-text powered
          </span>
        </button>

      </div>

      <button
        className="primary continueButton"
        onClick={onContinue}
        disabled={!mode}
      >
        Continue
        <ChevronRight size={18} />
      </button>
    </section>
  )
}

export default ModeSelector