import {
  Mic,
  Keyboard,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  Sparkles,
  Edit2,
  Loader2,
} from "lucide-react";
import { ROLES_LIST, EXPERIENCE_LEVELS } from "./RoleSelector";

function ModeSelector({
  mode,
  setMode,
  role,
  experienceLevel,
  onChangeRole,
  onContinue,
  onBack,
  loading = false,
}) {
  const selectedRoleInfo = ROLES_LIST.find((r) => r.id === role);
  const selectedLevelInfo = EXPERIENCE_LEVELS.find(
    (l) => l.id === (experienceLevel || "beginner")
  );

  return (
    <section className="modeSelection" aria-labelledby="mode-selection-heading">
      {onBack && (
        <button
          type="button"
          className="backLink"
          onClick={onBack}
          aria-label="Back to role selection"
          disabled={loading}
        >
          <ArrowLeft size={16} />
          <span>Back to Role Selection</span>
        </button>
      )}

      {/* Selected Setup Summary Banner */}
      {selectedRoleInfo && (
        <div className="setupSummaryBanner" aria-label="Interview configuration summary">
          <div className="setupSummaryInfo">
            <div className="setupSummaryBadge">
              <Briefcase size={13} aria-hidden="true" />
              <span>INTERVIEW CONFIGURATION</span>
            </div>
            <div className="setupSummaryDetails">
              <span className="setupRoleTitle">
                Role: <strong>{selectedRoleInfo.title}</strong>
              </span>
              <span className="setupDivider" aria-hidden="true">•</span>
              <span className="setupLevelTitle">
                <GraduationCap size={14} aria-hidden="true" />
                Seniority: <strong>{selectedLevelInfo?.title || "Beginner"}</strong>
              </span>
            </div>
          </div>

          {onChangeRole && (
            <button
              type="button"
              className="ghostButton changeRoleBtn"
              onClick={onChangeRole}
              disabled={loading}
              title="Change target role or seniority"
            >
              <Edit2 size={13} aria-hidden="true" />
              <span>Change Role</span>
            </button>
          )}
        </div>
      )}

      <div className="modeHeader">
        <p className="eyebrow">STEP 2 OF 2: RESPONSE MODALITY</p>
        <h1 id="mode-selection-heading">Select Your Response Style</h1>
        <p className="subtitle">
          Choose how you prefer to answer questions for your{" "}
          <strong>{selectedRoleInfo?.title || "selected"}</strong> interview. Both modalities
          are evaluated against the exact same rubric standards.
        </p>
      </div>

      <div className="modeGrid" role="radiogroup" aria-label="Interview modes">
        {/* TEXT MODE */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === "text"}
          className={`modeCard ${mode === "text" ? "selected" : ""}`}
          onClick={() => setMode("text")}
          disabled={loading}
        >
          <div className="modeCardHeader">
            <div className="modeIcon">
              <Keyboard size={28} aria-hidden="true" />
            </div>
            {mode === "text" && (
              <span className="selectedBadge" aria-label="Selected">
                <CheckCircle2 size={18} />
              </span>
            )}
          </div>

          <h2>Text Interview</h2>
          <p>
            Type your structured answers in a distraction-free editor. Ideal for
            carefully drafting code explanations, algorithmic steps, and system designs.
          </p>

          <div className="modeFeatures">
            <span>• Self-paced typing</span>
            <span>• Edit before submitting</span>
            <span>• Clean review box</span>
          </div>

          <span className="modeTag">Best for written precision</span>
        </button>

        {/* VOICE MODE */}
        <button
          type="button"
          role="radio"
          aria-checked={mode === "voice"}
          className={`modeCard ${mode === "voice" ? "selected" : ""}`}
          onClick={() => setMode("voice")}
          disabled={loading}
        >
          <div className="modeCardHeader">
            <div className="modeIcon">
              <Mic size={28} aria-hidden="true" />
            </div>
            {mode === "voice" && (
              <span className="selectedBadge" aria-label="Selected">
                <CheckCircle2 size={18} />
              </span>
            )}
          </div>

          <h2>Voice Interview</h2>
          <p>
            Speak your answers out loud naturally. Utilizes real-time in-browser
            speech recognition with continuous audio capture to simulate a live interview.
          </p>

          <div className="modeFeatures">
            <span>• Continuous voice capture</span>
            <span>• Realistic time pressure</span>
            <span>• Question read-aloud TTS</span>
          </div>

          <span className="modeTag">Speech-to-text powered</span>
        </button>
      </div>

      <div className="modeActions">
        <button
          className="primary continueButton startInterviewBtn"
          onClick={onContinue}
          disabled={!mode || loading}
          aria-label="Start Mock Interview"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spinIcon" aria-hidden="true" />
              <span>Starting Interview...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              <span>Start {selectedRoleInfo?.title || "Mock"} Interview</span>
              <ChevronRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </section>
  );
}

export default ModeSelector;