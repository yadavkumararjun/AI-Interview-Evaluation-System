import {
  Brain,
  ChevronRight,
  Clock3
} from "lucide-react"

import Stage from "../components/Stage"

function LandingPage({
  onStart,
  loading
}) {

  return (
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
            onClick={onStart}
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
  )
}

export default LandingPage