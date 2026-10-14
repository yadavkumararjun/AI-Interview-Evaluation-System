import { Check } from "lucide-react";
import { formatStage } from "../utils/formatStage";

function StageProgress({ currentStage }) {
  const stages = [
    "introduction",
    "background",
    "behavioral",
    "technical",
    "coding",
    "project_discussion",
    "closing",
  ];

  const currentIndex = stages.indexOf(currentStage);

  return (
    <nav aria-label="Interview stages progress" className="stageTrackerContainer">
      <div className="stageTrackerHeader">
        <span className="stageTrackerTitle">INTERVIEW STAGES</span>
        <span className="stageTrackerBadge">
          Stage {currentIndex >= 0 ? currentIndex + 1 : 1} of {stages.length}
        </span>
      </div>

      <ol className="stageTracker">
        {stages.map((stage, index) => {
          const isCompleted = currentIndex > -1 && index < currentIndex;
          const isActive = index === currentIndex;

          let statusClass = "stageItem";
          if (isCompleted) statusClass += " completed";
          if (isActive) statusClass += " active";

          return (
            <li
              key={stage}
              className={statusClass}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="stageDot" aria-hidden="true">
                {isCompleted ? (
                  <Check size={14} strokeWidth={2.8} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <span className="stageLabel">{formatStage(stage)}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StageProgress;