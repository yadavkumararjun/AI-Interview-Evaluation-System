import {
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Printer,
  RotateCcw,
  BookOpen,
  Calendar,
  CheckSquare,
  Mic,
  FileText,
  BarChart3,
  Layers,
  Briefcase,
} from "lucide-react";

import AnalysisCard, { isCategoryAssessed } from "../components/AnalysisCard";
import Footer from "../components/Footer";

// Canonical list of the 7 core evaluation dimensions
const ASSESSMENT_DIMENSIONS = [
  {
    key: "communication",
    title: "Communication",
    description: "Clarity, pacing, articulation, and professional delivery",
  },
  {
    key: "relevance",
    title: "Relevance",
    description: "Directness and alignment with the questions asked",
  },
  {
    key: "structure",
    title: "Structure",
    description: "Logical organization, flow, and framework usage",
  },
  {
    key: "specificity",
    title: "Specificity",
    description: "Concrete examples, measurable results, and factual depth",
  },
  {
    key: "behavioral",
    title: "Behavioral Responses",
    description: "Situational awareness, collaboration, and self-reflection",
  },
  {
    key: "technical",
    title: "Technical Understanding",
    description: "Conceptual accuracy, engineering depth, and domain knowledge",
  },
  {
    key: "coding",
    title: "Coding & Problem Solving",
    description: "Algorithmic thinking, edge cases, implementation accuracy, and syntax clarity",
  },
  {
    key: "project_discussion",
    title: "Project Discussion",
    description: "Architecture, trade-offs, ownership, and technical impact",
  },
];

function ReportPage({ analysis, progress, mode, role, experienceLevel, onNewInterview, onOpenDashboard }) {
  if (!analysis) {
    return null;
  }

  // Calculate assessed metrics without fabricating benchmarks
  const assessedCategories = ASSESSMENT_DIMENSIONS.map((dim) => {
    const data = analysis[dim.key];
    const assessed = isCategoryAssessed(data);
    let numericScore = null;
    if (assessed) {
      const raw = typeof data.score === "number" ? data.score : parseFloat(data.score);
      numericScore = isNaN(raw) ? null : Math.min(Math.max(raw, 0), 10);
    }
    return {
      ...dim,
      data,
      assessed,
      score: numericScore,
    };
  });

  const validScores = assessedCategories
    .filter((c) => c.assessed && c.score !== null)
    .map((c) => c.score);

  const assessedCount = validScores.length;
  const totalDimensions = ASSESSMENT_DIMENSIONS.length;

  const averageScore =
    analysis?.overall_score !== undefined && analysis?.overall_score !== null
      ? Number(analysis.overall_score).toFixed(1)
      : assessedCount > 0
      ? (validScores.reduce((acc, score) => acc + score, 0) / assessedCount).toFixed(1)
      : null;

  // Completion metrics
  const answeredQuestions = progress?.answered_questions || 0;
  const totalQuestions = progress?.total_questions || 15;
  const isEarlyFinish = answeredQuestions > 0 && answeredQuestions < totalQuestions;

  const currentRoleTitle =
    progress?.role_title || analysis?.role_title || analysis?.role || "Web Developer";
  const currentLevel = (
    experienceLevel || progress?.experience_level || analysis?.experience_level || "beginner"
  ).toUpperCase();

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="reportWrapper">
      <section className="report" aria-labelledby="report-heading">
        {/* ================= REPORT HEADER ================= */}
        <div className="reportHeader">
          <div className="reportHeaderInfo">
            <div className="reportBadge">
              <Award size={14} aria-hidden="true" />
              <span>OFFICIAL EVALUATION REPORT</span>
            </div>

            <h1 id="report-heading">Performance & Feedback Report</h1>

            <p className="subtitle">
              Comprehensive evaluation of your mock interview responses for the{" "}
              <strong>{currentRoleTitle}</strong> position across communication,
              technical understanding, and behavioral delivery.
            </p>
          </div>

          <div className="reportHeaderActions">
            {onOpenDashboard && (
              <button
                type="button"
                className="secondary dashboardNavBtn"
                onClick={onOpenDashboard}
                aria-label="View Progress Analytics Dashboard"
              >
                <TrendingUp size={16} aria-hidden="true" />
                <span>Progress Dashboard</span>
              </button>
            )}

            <button
              type="button"
              className="ghostButton printBtn"
              onClick={() => window.print()}
              aria-label="Print or save report as PDF"
            >
              <Printer size={16} aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              className="primary newInterviewBtn"
              onClick={onNewInterview}
            >
              <RotateCcw size={16} aria-hidden="true" />
              <span>Start New Interview</span>
            </button>
          </div>
        </div>

        {/* ================= CONCISE INTERVIEW COMPLETION SUMMARY ================= */}
        <div className="completionSummaryCard" aria-label="Interview session summary">
          <div className="completionSummaryHeader">
            <div className="completionTitleGroup">
              <CheckSquare size={18} className="summaryHeaderIcon" aria-hidden="true" />
              <h3>Interview Completion Summary</h3>
            </div>
            <span className="practiceDisclaimer">
              Formative Practice • Not a Hiring Decision
            </span>
          </div>

          <div className="completionMetricsGrid">
            <div className="completionMetricItem">
              <span className="metricLabel">Target Position</span>
              <strong className="metricValue roleMetricValue">
                <Briefcase size={15} aria-hidden="true" />
                <span>{currentRoleTitle}</span>
              </strong>
              <span className="metricNote">{currentLevel} Seniority Level</span>
            </div>

            <div className="completionMetricItem">
              <span className="metricLabel">Questions Answered</span>
              <strong className="metricValue">
                {answeredQuestions > 0 ? `${answeredQuestions} of ${totalQuestions}` : `${totalQuestions} Questions`}
              </strong>
              <span className="metricNote">
                {isEarlyFinish ? "Session concluded early" : "All questions completed"}
              </span>
            </div>

            <div className="completionMetricItem">
              <span className="metricLabel">Interview Mode</span>
              <strong className="metricValue modeValue">
                {mode === "voice" ? (
                  <>
                    <Mic size={16} aria-hidden="true" />
                    <span>Voice Interview</span>
                  </>
                ) : (
                  <>
                    <FileText size={16} aria-hidden="true" />
                    <span>Text Interview</span>
                  </>
                )}
              </strong>
              <span className="metricNote">Web Speech & AI Evaluator</span>
            </div>

            <div className="completionMetricItem">
              <span className="metricLabel">Rubric Coverage</span>
              <strong className="metricValue">
                {assessedCount} of {totalDimensions} Assessed
              </strong>
              <span className="metricNote">
                {assessedCount === totalDimensions
                  ? "Full 7-dimension evaluation"
                  : `${totalDimensions - assessedCount} dimension(s) had insufficient evidence`}
              </span>
            </div>

            <div className="completionMetricItem">
              <span className="metricLabel">Evaluation Date</span>
              <strong className="metricValue dateValue">
                <Calendar size={15} aria-hidden="true" />
                <span>{formattedDate}</span>
              </strong>
              <span className="metricNote">Completed Session</span>
            </div>
          </div>
        </div>

        {/* ================= EXECUTIVE SUMMARY CARD ================= */}
        <div className="summaryCard">
          <div className="summaryCardTop">
            <div className="summaryTitleGroup">
              <Sparkles size={20} className="summaryIcon" aria-hidden="true" />
              <h2>Executive Assessment</h2>
            </div>

            <div className="overallScorePill" aria-label={`Average score: ${averageScore || "Not assessed"}`}>
              <span className="scoreLabel">Average Assessed Score</span>
              <span className="scoreValue">
                {averageScore ? (
                  <>
                    {averageScore}
                    <span className="scoreScale">/10</span>
                  </>
                ) : (
                  <span className="unassessedText">Not Assessed</span>
                )}
              </span>
              {assessedCount > 0 && (
                <span className="assessedCountTag">
                  ({assessedCount} assessed)
                </span>
              )}
            </div>
          </div>

          <p className="summaryText">
            {analysis.overall_summary?.trim() ||
              "No overall executive summary was provided for this interview session. Refer to the category breakdown below for detailed observations."}
          </p>

          {/* Inline score visualization summary */}
          {assessedCount > 0 && (
            <div className="scoreVisualOverview" aria-label="Score visual overview by category">
              <div className="scoreVisualTitle">
                <BarChart3 size={15} aria-hidden="true" />
                <span>Rubric Dimension Scores at a Glance</span>
              </div>
              <div className="scoreMiniBarsGrid">
                {assessedCategories.map((cat) => (
                  <div className="scoreMiniBarItem" key={cat.key}>
                    <div className="scoreMiniBarHeader">
                      <span className="miniBarName">{cat.title}</span>
                      <span className="miniBarValue">
                        {cat.assessed ? `${cat.score}/10` : "Not assessed"}
                      </span>
                    </div>
                    <div className="miniBarTrack">
                      {cat.assessed ? (
                        <div
                          className={`miniBarFill ${
                            cat.score >= 8 ? "tierHigh" : cat.score >= 6 ? "tierMid" : "tierLow"
                          }`}
                          style={{ width: `${Math.round(cat.score * 10)}%` }}
                        />
                      ) : (
                        <div className="miniBarUnassessed" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= CATEGORY SCORE BREAKDOWN ================= */}
        <div className="reportSectionTitle">
          <div className="sectionHeaderWithIcon">
            <Layers size={20} className="sectionIcon" aria-hidden="true" />
            <div>
              <h3>Category Breakdown & Rubric Scores</h3>
              <p>Individual scores and targeted observations across 7 assessment dimensions.</p>
            </div>
          </div>
        </div>

        <div className="analysisGrid">
          {ASSESSMENT_DIMENSIONS.map((dim) => (
            <AnalysisCard
              key={dim.key}
              title={dim.title}
              description={dim.description}
              data={analysis[dim.key]}
            />
          ))}
        </div>

        {/* ================= PER-QUESTION EVIDENCE & FEEDBACK ================= */}
        {analysis.per_question_feedback && Array.isArray(analysis.per_question_feedback) && analysis.per_question_feedback.length > 0 && (
          <div className="perQuestionSection">
            <div className="reportSectionTitle">
              <div className="sectionHeaderWithIcon">
                <CheckSquare size={20} className="sectionIcon" aria-hidden="true" />
                <div>
                  <h3>Itemized Question Observations & Evidence</h3>
                  <p>Targeted feedback, key strengths demonstrated, and missed points for each question.</p>
                </div>
              </div>
            </div>

            <div className="perQuestionGrid">
              {analysis.per_question_feedback.map((item, index) => (
                <div className="perQuestionCard" key={item.question_id || index}>
                  <div className="perQuestionTop">
                    <span className="qIdBadge">Question #{index + 1} • {item.stage?.toUpperCase()}</span>
                    {item.skill && <span className="qSkillBadge">⚡ {item.skill}</span>}
                    {item.score !== null && item.score !== undefined && (
                      <span className="qScoreBadge">{item.score}/10</span>
                    )}
                  </div>

                  {item.feedback && <p className="qFeedbackText">{item.feedback}</p>}

                  {item.evidence && (
                    <div className="qEvidenceBox">
                      <span className="qEvidenceLabel">Evidence Cited:</span>
                      <p className="qEvidenceQuote">"{item.evidence}"</p>
                    </div>
                  )}

                  {(item.correct_points?.length > 0 || item.missing_points?.length > 0) && (
                    <div className="qPointsSplit">
                      {item.correct_points?.length > 0 && (
                        <div className="qPointGroup correct">
                          <span className="qPointHeading">Demonstrated:</span>
                          <ul>
                            {item.correct_points.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.missing_points?.length > 0 && (
                        <div className="qPointGroup missing">
                          <span className="qPointHeading">Missing / Incomplete:</span>
                          <ul>
                            {item.missing_points.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= STRENGTHS & IMPROVEMENTS DUAL COLUMN ================= */}
        <div className="reportColumns">
          {/* Key Strengths Section */}
          <div className="reportBox strengthsBox">
            <div className="boxHeader">
              <div className="boxIcon success">
                <CheckCircle2 size={20} aria-hidden="true" />
              </div>
              <div>
                <h2>Key Strengths</h2>
                <p className="boxSub">Specific areas where your responses demonstrated strong competency.</p>
              </div>
            </div>

            {analysis.strengths && Array.isArray(analysis.strengths) && analysis.strengths.length > 0 ? (
              <ul className="feedbackList" aria-label="Candidate strengths">
                {analysis.strengths.map((item, index) => (
                  <li className="feedbackItem successItem" key={index}>
                    <span className="itemBullet" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="emptyFeedback">
                No specific strengths recorded for this session. Review individual category feedback for observations.
              </p>
            )}
          </div>

          {/* Areas to Improve Section */}
          <div className="reportBox improvementsBox">
            <div className="boxHeader">
              <div className="boxIcon warning">
                <TrendingUp size={20} aria-hidden="true" />
              </div>
              <div>
                <h2>Areas to Improve</h2>
                <p className="boxSub">Actionable growth opportunities identified from your answers.</p>
              </div>
            </div>

            {analysis.improvements && Array.isArray(analysis.improvements) && analysis.improvements.length > 0 ? (
              <ul className="feedbackList" aria-label="Areas for improvement">
                {analysis.improvements.map((item, index) => (
                  <li className="feedbackItem improveItem" key={index}>
                    <span className="itemBullet" aria-hidden="true">→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="emptyFeedback">
                No specific improvement areas recorded for this session. Refer to the category scores above.
              </p>
            )}
          </div>
        </div>

        {/* ================= FINAL ACTIONABLE FEEDBACK ================= */}
        <div className="reportBox finalFeedbackBox">
          <div className="boxHeader">
            <div className="boxIcon info">
              <BookOpen size={20} aria-hidden="true" />
            </div>
            <div>
              <h2>Final Feedback & Next Steps</h2>
              <p className="boxSub">Strategic steps to implement before your next practice or real interview.</p>
            </div>
          </div>

          {analysis.final_feedback && Array.isArray(analysis.final_feedback) && analysis.final_feedback.length > 0 ? (
            <ol className="actionableList">
              {analysis.final_feedback.map((item, index) => (
                <li className="actionableItem" key={index}>
                  <div className="actionableNumber" aria-hidden="true">{index + 1}</div>
                  <p className="actionableText">{item}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="emptyFeedback">
              No additional final recommendations recorded for this session.
            </p>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="reportBottomAction">
          <button
            type="button"
            className="primary bottomStartBtn"
            onClick={onNewInterview}
          >
            <span>Start Another Interview Session</span>
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default ReportPage;