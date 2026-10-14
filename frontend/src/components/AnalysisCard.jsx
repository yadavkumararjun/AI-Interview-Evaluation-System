import {
  MessageSquare,
  Target,
  Layout,
  Search,
  Users,
  Code2,
  FolderGit2,
  Award,
  MinusCircle,
} from "lucide-react";

import { isCategoryAssessed, getScoreTier } from "../utils/assessmentUtils";

export { isCategoryAssessed, getScoreTier };

function getCategoryIcon(title = "") {
  const lower = title.toLowerCase();
  if (lower.includes("communication")) return <MessageSquare size={18} />;
  if (lower.includes("relevance")) return <Target size={18} />;
  if (lower.includes("structure")) return <Layout size={18} />;
  if (lower.includes("specificity")) return <Search size={18} />;
  if (lower.includes("behavioral")) return <Users size={18} />;
  if (lower.includes("technical")) return <Code2 size={18} />;
  if (lower.includes("project")) return <FolderGit2 size={18} />;
  return <Award size={18} />;
}

function AnalysisCard({ title, data, description }) {
  const assessed = isCategoryAssessed(data);

  let numericScore = 0;
  if (assessed) {
    const raw = typeof data.score === "number" ? data.score : parseFloat(data.score);
    numericScore = Math.min(Math.max(raw, 0), 10);
  }

  const tier = getScoreTier(numericScore, assessed);
  const percentage = assessed ? Math.round(numericScore * 10) : 0;

  const feedbackText =
    data?.feedback?.trim() ||
    (assessed
      ? "Evaluation recorded for this dimension."
      : "Insufficient evidence to assess this category in the current interview responses.");

  return (
    <div className={`analysisCard ${!assessed ? "isUnassessedCard" : ""}`}>
      <div className="analysisCardTop">
        <div className="analysisCategoryHeader">
          <div className={`categoryIcon ${!assessed ? "unassessedIcon" : ""}`} aria-hidden="true">
            {getCategoryIcon(title)}
          </div>
          <div>
            <h3>{title}</h3>
            {description && <p className="categoryDescription">{description}</p>}
          </div>
        </div>

        <div className="scorePillGroup">
          <span className={`scoreTierBadge ${tier.className}`}>
            {!assessed && <MinusCircle size={11} aria-hidden="true" />}
            {tier.label}
          </span>

          <strong className="scoreNumber">
            {assessed ? (
              <>
                {numericScore}
                <span className="scoreMax">/10</span>
              </>
            ) : (
              <span className="unassessedScoreValue">—</span>
            )}
          </strong>
        </div>
      </div>

      <div
        className={`scoreBar ${!assessed ? "scoreBarUnassessed" : ""}`}
        role="progressbar"
        aria-valuenow={assessed ? numericScore : undefined}
        aria-valuemin="0"
        aria-valuemax="10"
        aria-label={
          assessed
            ? `${title} score: ${numericScore} out of 10 (${tier.label})`
            : `${title}: Not assessed due to insufficient evidence`
        }
      >
        {assessed ? (
          <div
            className={`scoreFill ${tier.className}`}
            style={{ width: `${percentage}%` }}
          />
        ) : (
          <div className="unassessedFillPattern" />
        )}
      </div>

      <p className="analysisFeedback">{feedbackText}</p>

      {data?.evidence && (
        <div className="analysisEvidence">
          <span className="evidenceLabel">Evidence Cited:</span>
          <p className="evidenceText">"{data.evidence}"</p>
        </div>
      )}

      {(data?.correct_points?.length > 0 || data?.missing_points?.length > 0) && (
        <div className="analysisPointsGrid">
          {data?.correct_points?.length > 0 && (
            <div className="analysisPointsGroup correctGroup">
              <span className="pointsHeader">✓ Demonstrated</span>
              <ul className="pointsList">
                {data.correct_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
          {data?.missing_points?.length > 0 && (
            <div className="analysisPointsGroup missingGroup">
              <span className="pointsHeader">! Missing or Incomplete</span>
              <ul className="pointsList">
                {data.missing_points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnalysisCard;