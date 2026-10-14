import {
  Brain,
  ChevronRight,
  Keyboard,
  Mic,
  Layers,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import Stage from "../components/Stage";
import Footer from "../components/Footer";

function LandingPage({ onStart, loading }) {
  const workflowSteps = [
    {
      step: "01",
      title: "Choose Interview Mode",
      desc: "Select between text input or speech-to-text voice mode depending on how you wish to practice.",
    },
    {
      step: "02",
      title: "Complete 7 Structured Stages",
      desc: "Answer 15 targeted questions spanning introduction, background, behavioral, coding, and projects.",
    },
    {
      step: "03",
      title: "Receive Detailed AI Analysis",
      desc: "Review category-by-category scores from 0-10, concrete strengths, and prioritized areas to improve.",
    },
  ];

  const features = [
    {
      icon: <Keyboard size={24} className="featureIconSvg" />,
      title: "Text Interview",
      tag: "Self-Paced",
      desc: "Formulate well-structured answers using the distraction-free text editor. Perfect for thoughtful composition.",
    },
    {
      icon: <Mic size={24} className="featureIconSvg" />,
      title: "Voice Interview",
      tag: "Live Audio",
      desc: "Speak naturally using browser-native speech recognition. Simulates the cadence and spontaneity of a real phone screen.",
    },
    {
      icon: <Layers size={24} className="featureIconSvg" />,
      title: "7 Structured Stages",
      tag: "Full Cycle",
      desc: "Covers the entire interview lifecycle: Introduction, Background, Behavioral, Technical, Coding, Projects, and Closing.",
    },
    {
      icon: <Award size={24} className="featureIconSvg" />,
      title: "Multi-Category Scoring",
      tag: "Actionable",
      desc: "Evaluates communication, technical rigor, relevance, and STAR technique, producing itemized ratings and advice.",
    },
  ];

  return (
    <div className="landingWrapper">
      <section className="landing">
        {/* ================= HERO ================= */}
        <div className="hero">
          <div className="heroContent">
            <div className="heroBadge">
              <Sparkles size={14} />
              <span>AI-Powered Technical & Behavioral Prep</span>
            </div>

            <h1>
              Master Your Next Interview with{" "}
              <span className="heroHighlight">Intelligent Feedback</span>
            </h1>

            <p className="subtitle">
              Simulate high-stakes technical interviews with 7 structured stages,
              flexible speech or text modalities, and rubric-driven AI evaluation.
            </p>

            <div className="heroActions">
              <button
                className="primary heroButton"
                onClick={onStart}
                disabled={loading}
                aria-label="Start Mock Interview"
              >
                {loading ? "Starting Session..." : "Start Mock Interview"}
                <ChevronRight size={19} aria-hidden="true" />
              </button>

              <div className="heroMetaPoints">
                <span>
                  <CheckCircle2 size={16} /> 15 Sequenced Questions
                </span>
                <span>
                  <CheckCircle2 size={16} /> 7 Evaluation Stages
                </span>
                <span>
                  <CheckCircle2 size={16} /> Instant Report
                </span>
              </div>
            </div>
          </div>

          <div className="heroCard">
            <div className="heroCardHeader">
              <div className="heroCardBadge">
                <Brain size={22} />
                <span>Simulation Studio</span>
              </div>
              <span className="liveDot">Live</span>
            </div>

            <div className="heroCardStats">
              <div className="statBox">
                <span className="statValue">7</span>
                <span className="statLabel">Rounds</span>
              </div>
              <div className="statDivider" />
              <div className="statBox">
                <span className="statValue">15</span>
                <span className="statLabel">Questions</span>
              </div>
              <div className="statDivider" />
              <div className="statBox">
                <span className="statValue">10 pt</span>
                <span className="statLabel">Rubric</span>
              </div>
            </div>

            <div className="heroCardPreview">
              <div className="previewRow">
                <span className="previewStage">01. Introduction</span>
                <span className="previewStatus done">Ready</span>
              </div>
              <div className="previewRow">
                <span className="previewStage">04. Technical Core</span>
                <span className="previewStatus active">Adaptive</span>
              </div>
              <div className="previewRow">
                <span className="previewStage">07. Closing & Fit</span>
                <span className="previewStatus pending">Final</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FEATURE CARDS ================= */}
        <section className="featuresSection">
          <div className="sectionHeader">
            <p className="eyebrow">CORE CAPABILITIES</p>
            <h2>Engineered for Realistic Practice</h2>
            <p className="sectionSubtitle">
              Choose your answering style, progress through vetted stages, and uncover
              blind spots before real interviews.
            </p>
          </div>

          <div className="featureGrid">
            {features.map((feat, idx) => (
              <div className="featureCard" key={idx}>
                <div className="featureCardTop">
                  <div className="featureIcon">{feat.icon}</div>
                  <span className="featureTag">{feat.tag}</span>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= WORKFLOW EXPLANATION ================= */}
        <section className="workflowSection">
          <div className="sectionHeader">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2>Three Steps to Confident Interviewing</h2>
            <p className="sectionSubtitle">
              A frictionless workflow designed to reproduce real interview rigor.
            </p>
          </div>

          <div className="workflowGrid">
            {workflowSteps.map((step, idx) => (
              <div className="workflowCard" key={idx}>
                <div className="workflowStepNumber">{step.step}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {idx < workflowSteps.length - 1 && (
                  <div className="workflowArrow" aria-hidden="true">
                    <ArrowRight size={18} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================= 7 STAGES OVERVIEW ================= */}
        <section className="panel">
          <div className="sectionTitle">
            <Clock3 size={20} aria-hidden="true" />
            <div>
              <h2>Comprehensive 7-Stage Curriculum</h2>
              <p className="sectionNote">
                Every interview walks through the standard lifecycle used by top technology companies.
              </p>
            </div>
          </div>

          <div className="stageGrid">
            <Stage
              number="01"
              title="Introduction"
              text="Tell me about yourself & elevator pitch"
            />
            <Stage
              number="02"
              title="Background"
              text="Academic foundation & learning journey"
            />
            <Stage
              number="03"
              title="Behavioral"
              text="Conflict resolution, teamwork & ownership"
            />
            <Stage
              number="04"
              title="Technical"
              text="Data structures, systems & algorithms"
            />
            <Stage
              number="05"
              title="Coding"
              text="Algorithmic problem solving & complexity"
            />
            <Stage
              number="06"
              title="Projects"
              text="Architectural decisions & engineering impact"
            />
            <Stage
              number="07"
              title="Closing"
              text="Career goals, trajectory & candidate queries"
            />
          </div>
        </section>
      </section>

      {/* Clean Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;