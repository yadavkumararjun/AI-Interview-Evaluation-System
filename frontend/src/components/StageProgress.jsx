import { formatStage } from "../utils/formatStage"

function StageProgress({
  currentStage
}) {

  const stages = [
    "introduction",
    "background",
    "behavioral",
    "technical",
    "coding",
    "project_discussion",
    "closing"
  ]

  const currentIndex =
    stages.indexOf(currentStage)

  return (
    <div className="stageTracker">

      {stages.map(
        (stage, index) => (

          <div
            key={stage}
            className={
              index < currentIndex
                ? "stageItem completed"
                : index === currentIndex
                ? "stageItem active"
                : "stageItem"
            }
          >

            <div className="stageDot">

              {index < currentIndex
                ? "✓"
                : index + 1}

            </div>

            <span>
              {formatStage(stage)}
            </span>

          </div>

        )
      )}

    </div>
  )
}

export default StageProgress