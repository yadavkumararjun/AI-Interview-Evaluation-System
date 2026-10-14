import { useState } from "react";
import {
  Globe,
  Bot,
  BrainCircuit,
  Database,
  Server,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Briefcase,
  GraduationCap,
} from "lucide-react";

export const ROLES_LIST = [
  {
    id: "web_developer",
    title: "Web Developer",
    short_description:
      "Build, optimize, and maintain responsive web applications, modern UI/UX, and client-server integrations.",
    skills: ["HTML/CSS", "JavaScript", "React", "REST APIs", "Web Performance"],
    icon: Globe,
    accent: "blue",
  },
  {
    id: "ai_engineer",
    title: "AI Engineer",
    short_description:
      "Design and deploy AI systems, LLM integrations, prompt architectures, and intelligent agents.",
    skills: ["LLMs", "Prompt Engineering", "Python", "RAG", "Vector DBs", "API Integration"],
    icon: Bot,
    accent: "purple",
  },
  {
    id: "ml_engineer",
    title: "Machine Learning Engineer",
    short_description:
      "Develop, train, evaluate, and productionize machine learning models and predictive pipelines.",
    skills: ["Machine Learning", "Python", "PyTorch/TensorFlow", "Scikit-Learn", "Model Deployment"],
    icon: BrainCircuit,
    accent: "indigo",
  },
  {
    id: "data_engineer",
    title: "Data Engineer",
    short_description:
      "Build reliable data pipelines, distributed architectures, ETL workflows, and scalable warehouses.",
    skills: ["SQL", "Python", "ETL Pipelines", "Data Warehousing", "Distributed Systems"],
    icon: Database,
    accent: "teal",
  },
  {
    id: "backend_developer",
    title: "Backend Developer",
    short_description:
      "Design scalable server architectures, robust APIs, database schemas, and microservices.",
    skills: ["Python/Node/Java", "FastAPI/Express", "Databases & SQL", "API Design", "Architecture"],
    icon: Server,
    accent: "emerald",
  },
  {
    id: "data_analyst",
    title: "Data Analyst",
    short_description:
      "Extract actionable business insights, analyze structured data, build metrics, and test hypotheses.",
    skills: ["SQL", "Python/R", "Data Visualization", "Statistical Analysis", "Business Metrics"],
    icon: BarChart3,
    accent: "amber",
  },
];

export const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    title: "Beginner",
    tagline: "0–1 yrs • Entry Level / Student",
    description: "Foundational concepts, core algorithms, and standard patterns",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    tagline: "1–3 yrs • Mid Level",
    description: "Practical engineering trade-offs, architecture, and real-world debugging",
  },
  {
    id: "advanced",
    title: "Advanced",
    tagline: "3+ yrs • Senior Level",
    description: "System scalability, edge-case resilience, and senior technical leadership",
  },
];

function RoleSelector({
  role,
  setRole,
  experienceLevel = "beginner",
  setExperienceLevel,
  onContinue,
  onBack,
}) {
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function handleContinue() {
    if (!role) {
      setAttemptedSubmit(true);
      return;
    }
    setAttemptedSubmit(false);
    onContinue();
  }

  return (
    <section className="roleSelectionSection" aria-labelledby="role-selection-heading">
      {onBack && (
        <button
          type="button"
          className="backLink"
          onClick={onBack}
          aria-label="Back to overview"
        >
          <ArrowLeft size={16} />
          <span>Back to Overview</span>
        </button>
      )}

      {/* Header */}
      <div className="roleHeader">
        <div className="roleStepBadge">
          <Briefcase size={13} aria-hidden="true" />
          <span>STEP 1 OF 2: TARGET ROLE & SENIORITY</span>
        </div>
        <h1 id="role-selection-heading">Select Your Target Job Role</h1>
        <p className="subtitle">
          Choose the position and seniority level you wish to practice for. Interview question selection,
          conceptual depth, and evaluation rubrics will be tailored directly to your chosen role.
        </p>
      </div>

      {/* Experience Level Segmented Control */}
      <div className="experienceControlGroup" aria-labelledby="exp-level-heading">
        <div className="experienceHeader">
          <div className="expTitleGroup">
            <GraduationCap size={16} className="expIcon" aria-hidden="true" />
            <h3 id="exp-level-heading">Target Experience Level</h3>
          </div>
          <span className="expDefaultNotice">Default: Beginner</span>
        </div>

        <div className="experienceGrid" role="radiogroup" aria-label="Experience level options">
          {EXPERIENCE_LEVELS.map((level) => {
            const isSelected = (experienceLevel || "beginner") === level.id;
            return (
              <button
                key={level.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`experienceCard ${isSelected ? "selected" : ""}`}
                onClick={() => setExperienceLevel && setExperienceLevel(level.id)}
              >
                <div className="experienceTop">
                  <strong>{level.title}</strong>
                  {isSelected && (
                    <span className="selectedCheckIcon" aria-label="Selected">
                      <CheckCircle2 size={16} />
                    </span>
                  )}
                </div>
                <span className="experienceTagline">{level.tagline}</span>
                <p className="experienceDesc">{level.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className="rolesSectionWrapper">
        <div className="rolesGridHeader">
          <h3>Choose a Career Track</h3>
          <span className="rolesCountTag">6 Tracks Available</span>
        </div>

        {attemptedSubmit && !role && (
          <div className="roleValidationError" role="alert">
            Please select a target job role before continuing to response mode.
          </div>
        )}

        <div className="rolesGrid" role="radiogroup" aria-label="Available job roles">
          {ROLES_LIST.map((r) => {
            const isSelected = role === r.id;
            const IconComponent = r.icon;

            return (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`roleCard ${isSelected ? "selected" : ""} ${r.accent}`}
                onClick={() => {
                  setRole(r.id);
                  setAttemptedSubmit(false);
                }}
              >
                <div className="roleCardHeader">
                  <div className="roleIconWrapper" aria-hidden="true">
                    <IconComponent size={24} />
                  </div>
                  {isSelected ? (
                    <span className="selectedBadge" aria-label="Selected">
                      <CheckCircle2 size={18} />
                    </span>
                  ) : (
                    <span className="selectPillPrompt">Select</span>
                  )}
                </div>

                <h2>{r.title}</h2>
                <p className="roleDescription">{r.short_description}</p>

                <div className="roleSkillsSection">
                  <span className="skillsLabel">Key Evaluated Skills:</span>
                  <div className="skillsPillsWrapper">
                    {r.skills.map((skill, idx) => (
                      <span className="skillPill" key={idx}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="roleActions">
        <div className="roleSelectedSummary">
          {role ? (
            <span>
              Target: <strong>{ROLES_LIST.find((r) => r.id === role)?.title}</strong> •{" "}
              <span className="summaryExpLevel">
                {EXPERIENCE_LEVELS.find((l) => l.id === (experienceLevel || "beginner"))?.title} Level
              </span>
            </span>
          ) : (
            <span className="noRolePrompt">Click a role card above to proceed</span>
          )}
        </div>

        <button
          type="button"
          className="primary continueButton"
          onClick={handleContinue}
          disabled={!role}
          aria-label="Continue to interview mode selection"
        >
          <span>Continue to Mode Selection</span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default RoleSelector;
