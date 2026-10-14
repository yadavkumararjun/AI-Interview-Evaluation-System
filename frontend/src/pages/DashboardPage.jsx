import { useState, useEffect } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
  Briefcase,
  RotateCcw,
  BookOpen,
  Info,
  FileText,
} from "lucide-react";

import { getAnalytics, getRoles } from "../services/interviewService";
import Footer from "../components/Footer";

function DashboardPage({ onStartInterview, onBackToLanding, onViewReport }) {
  const [selectedRole, setSelectedRole] = useState("all");
  const [rolesList, setRolesList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch supported roles on mount
  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles();
        if (data?.roles) {
          setRolesList(data.roles);
        }
      } catch (err) {
        console.error("Could not load roles:", err);
      }
    }
    loadRoles();
  }, []);

  // Fetch analytics data when selectedRole changes
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError("");
      try {
        const data = await getAnalytics(selectedRole);
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load progress analytics:", err);
        setError("Unable to load interview progress analytics. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [selectedRole]);

  const isEmpty = analytics?.is_empty || analytics?.completed_count === 0;
  const sameRoleComp = analytics?.same_role_comparison;
  const categoryTrends = analytics?.category_trends || {};
  const recurringStrengths = analytics?.recurring_strengths || [];
  const recurringImprovements = analytics?.recurring_improvements || [];
  const scorePoints = analytics?.score_points || [];

  return (
    <div className="dashboardWrapper">
      <section className="dashboard" aria-labelledby="dashboard-heading">
        {/* ================= DASHBOARD HEADER ================= */}
        <div className="dashboardHeader">
          <div className="dashboardHeaderInfo">
            <div className="dashboardBadge">
              <TrendingUp size={14} aria-hidden="true" />
              <span>ROLE-AWARE PROGRESS ANALYTICS</span>
            </div>
            <h1 id="dashboard-heading">Interview Progress & Growth Dashboard</h1>
            <p className="subtitle">
              Track your score trajectories, observe role-specific category trends, and review recurring strengths across your practice sessions.
            </p>
          </div>

          <div className="dashboardHeaderActions">
            <button
              type="button"
              className="primary startInterviewBtn"
              onClick={onStartInterview}
            >
              <span>Practice New Session</span>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ================= ROLE FILTER BAR ================= */}
        <div className="dashboardFilterBar" role="region" aria-label="Filter analytics by role">
          <div className="filterLabelGroup">
            <Filter size={15} aria-hidden="true" />
            <span>Target Role Filter:</span>
          </div>

          <div className="roleFilterPills">
            <button
              type="button"
              className={`filterPill ${selectedRole === "all" ? "active" : ""}`}
              onClick={() => setSelectedRole("all")}
            >
              All Roles ({analytics?.completed_count || 0})
            </button>

            {rolesList.map((r) => {
              const count = analytics?.role_distribution?.[r.id] || 0;
              return (
                <button
                  type="button"
                  key={r.id}
                  className={`filterPill ${selectedRole === r.id ? "active" : ""}`}
                  onClick={() => setSelectedRole(r.id)}
                >
                  {r.title} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= LOADING & ERROR STATES ================= */}
        {loading && (
          <div className="dashboardLoadingCard">
            <div className="spinner" />
            <p>Loading your progress analytics...</p>
          </div>
        )}

        {error && !loading && (
          <div className="dashboardErrorCard" role="alert">
            <p>{error}</p>
          </div>
        )}

        {/* ================= EMPTY STATE ================= */}
        {!loading && !error && isEmpty && (
          <div className="dashboardEmptyCard">
            <div className="emptyStateIcon">
              <Award size={36} aria-hidden="true" />
            </div>
            <h2>Not Enough Sessions to Plot Trends</h2>
            <p className="emptyStateText">
              {analytics?.empty_message ||
                "Complete at least two mock interviews in your target role to unlock comparative progress analytics, score progression, and category trends."}
            </p>
            <div className="emptyStateActions">
              <button
                type="button"
                className="primary"
                onClick={onStartInterview}
              >
                <span>Start Your Next Mock Interview</span>
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* ================= DASHBOARD CONTENT (WHEN SESSIONS EXIST) ================= */}
        {!loading && !error && !isEmpty && (
          <>
            {/* Top KPI Cards Grid */}
            <div className="dashboardKpiGrid">
              <div className="kpiCard">
                <span className="kpiLabel">Total Completed</span>
                <strong className="kpiValue">{analytics.completed_count}</strong>
                <span className="kpiNote">Practice Sessions</span>
              </div>

              <div className="kpiCard">
                <span className="kpiLabel">Latest Overall Score</span>
                <strong className="kpiValue">
                  {analytics.latest_score !== null ? `${analytics.latest_score}/10` : "—"}
                </strong>
                <span className="kpiNote">Most Recent Session</span>
              </div>

              <div className="kpiCard">
                <span className="kpiLabel">First vs Latest Delta</span>
                <strong
                  className={`kpiValue ${
                    (analytics.score_delta || 0) > 0
                      ? "deltaPositive"
                      : (analytics.score_delta || 0) < 0
                      ? "deltaNegative"
                      : "deltaNeutral"
                  }`}
                >
                  {analytics.score_delta !== null ? (
                    <>
                      {analytics.score_delta > 0 && "+"}
                      {analytics.score_delta} pts
                    </>
                  ) : (
                    "—"
                  )}
                </strong>
                <span className="kpiNote">
                  {analytics.score_delta !== null
                    ? `From ${analytics.first_score} to ${analytics.latest_score}`
                    : "Baseline established"}
                </span>
              </div>

              <div className="kpiCard">
                <span className="kpiLabel">Active Roles Practiced</span>
                <strong className="kpiValue">
                  {Object.keys(analytics.role_distribution || {}).length}
                </strong>
                <span className="kpiNote">Job Specializations</span>
              </div>
            </div>

            {/* Same-Role Comparison Panel (when 2+ interviews exist for the role) */}
            {sameRoleComp && (
              <div className="sameRoleComparisonCard">
                <div className="comparisonHeader">
                  <div className="compTitleGroup">
                    <Sparkles size={18} className="compSparkle" aria-hidden="true" />
                    <h3>
                      Target Role Progression: <strong>{sameRoleComp.role_title}</strong>
                    </h3>
                  </div>
                  <span className="compBadge">Consecutive Sessions Comparison</span>
                </div>

                {sameRoleComp.experience_level_note && (
                  <div className="levelChangeAlert">
                    <Info size={16} aria-hidden="true" />
                    <span>{sameRoleComp.experience_level_note}</span>
                  </div>
                )}

                <div className="comparisonMetricsGrid">
                  <div className="compSessionBox previous">
                    <span className="sessionTag">Previous Session (#{sameRoleComp.previous_session.id})</span>
                    <strong className="sessionScore">
                      {sameRoleComp.previous_session.score !== null
                        ? `${sameRoleComp.previous_session.score}/10`
                        : "—"}
                    </strong>
                    <span className="sessionMeta">
                      🎓 {sameRoleComp.previous_session.experience_level?.toUpperCase()} •{" "}
                      {new Date(sameRoleComp.previous_session.date).toLocaleDateString()}
                    </span>
                    {onViewReport && sameRoleComp.previous_session.id && (
                      <button
                        type="button"
                        className="ghostButton viewSavedReportBtn"
                        onClick={() => onViewReport(sameRoleComp.previous_session.id)}
                        title={`Reopen evaluation report for session #${sameRoleComp.previous_session.id}`}
                      >
                        <FileText size={12} aria-hidden="true" />
                        <span>View Report</span>
                      </button>
                    )}
                  </div>

                  <div className="compDeltaIndicator">
                    <div
                      className={`deltaBubble ${
                        (sameRoleComp.overall_point_delta || 0) > 0
                          ? "positive"
                          : (sameRoleComp.overall_point_delta || 0) < 0
                          ? "negative"
                          : "neutral"
                      }`}
                    >
                      {(sameRoleComp.overall_point_delta || 0) > 0 ? (
                        <ArrowUpRight size={20} aria-hidden="true" />
                      ) : (sameRoleComp.overall_point_delta || 0) < 0 ? (
                        <ArrowDownRight size={20} aria-hidden="true" />
                      ) : (
                        <Minus size={20} aria-hidden="true" />
                      )}
                      <strong>
                        {(sameRoleComp.overall_point_delta || 0) > 0 && "+"}
                        {sameRoleComp.overall_point_delta || 0} pts
                      </strong>
                    </div>
                    <span className="deltaSub">Score Points Change</span>
                  </div>

                  <div className="compSessionBox latest">
                    <span className="sessionTag">Latest Session (#{sameRoleComp.latest_session.id})</span>
                    <strong className="sessionScore">
                      {sameRoleComp.latest_session.score !== null
                        ? `${sameRoleComp.latest_session.score}/10`
                        : "—"}
                    </strong>
                    <span className="sessionMeta">
                      🎓 {sameRoleComp.latest_session.experience_level?.toUpperCase()} •{" "}
                      {new Date(sameRoleComp.latest_session.date).toLocaleDateString()}
                    </span>
                    {onViewReport && sameRoleComp.latest_session.id && (
                      <button
                        type="button"
                        className="ghostButton viewSavedReportBtn"
                        onClick={() => onViewReport(sameRoleComp.latest_session.id)}
                        title={`Reopen evaluation report for session #${sameRoleComp.latest_session.id}`}
                      >
                        <FileText size={12} aria-hidden="true" />
                        <span>View Report</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category differences table */}
                {Object.keys(sameRoleComp.category_diffs || {}).length > 0 && (
                  <div className="categoryDiffsTableWrapper">
                    <h4>Assessed Category Progression</h4>
                    <div className="categoryDiffsGrid">
                      {Object.entries(sameRoleComp.category_diffs).map(([cat, data]) => (
                        <div className="catDiffCard" key={cat}>
                          <span className="catDiffName">{cat.replace("_", " ").toUpperCase()}</span>
                          <div className="catDiffValues">
                            <span className="prevVal">{data.previous}</span>
                            <span className="arrow">→</span>
                            <span className="nextVal">{data.latest}</span>
                            <span
                              className={`diffTag ${
                                data.point_delta > 0
                                  ? "positive"
                                  : data.point_delta < 0
                                  ? "negative"
                                  : "neutral"
                              }`}
                            >
                              {data.point_delta > 0 && "+"}
                              {data.point_delta} pts
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Overall Score Trajectory Timeline */}
            {scorePoints.length > 0 && (
              <div className="dashboardSectionCard">
                <div className="sectionHeaderWithIcon">
                  <BarChart3 size={18} aria-hidden="true" />
                  <div>
                    <h3>Completed Interview Score History</h3>
                    <p className="sectionSub">
                      Chronological progression of interview sessions with calibrated seniority levels.
                    </p>
                  </div>
                </div>

                <div className="scoreTrajectoryList">
                  {scorePoints.map((pt, index) => (
                    <div className="trajectoryItem" key={pt.id || index}>
                      <div className="trajectoryIndex">#{index + 1}</div>
                      <div className="trajectoryDetails">
                        <strong className="trajectoryRole">{pt.role_title}</strong>
                        <span className="trajectoryMeta">
                          🎓 {pt.experience_level?.toUpperCase()} •{" "}
                          {pt.mode === "voice" ? "🎙️ Voice" : "⌨️ Text"} •{" "}
                          {new Date(pt.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="trajectoryScore">
                        <strong>{pt.score}/10</strong>
                        <div className="trajectoryBarTrack">
                          <div
                            className="trajectoryBarFill"
                            style={{ width: `${Math.round(pt.score * 10)}%` }}
                          />
                        </div>
                      </div>
                      {onViewReport && pt.id && (
                        <button
                          type="button"
                          className="ghostButton viewSavedReportBtn"
                          onClick={() => onViewReport(pt.id)}
                          title={`Reopen evaluation report for session #${pt.id}`}
                        >
                          <FileText size={13} aria-hidden="true" />
                          <span>View Report</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role-Specific Category Trends */}
            {Object.keys(categoryTrends).length > 0 && (
              <div className="dashboardSectionCard">
                <div className="sectionHeaderWithIcon">
                  <Layers size={18} aria-hidden="true" />
                  <div>
                    <h3>Assessed Category Trends</h3>
                    <p className="sectionSub">
                      Showing progress only for categories assessed across multiple sessions.
                    </p>
                  </div>
                </div>

                <div className="categoryTrendsGrid">
                  {Object.entries(categoryTrends).map(([cat, trend]) => (
                    <div className="categoryTrendCard" key={cat}>
                      <div className="catTrendTop">
                        <strong className="catName">{cat.replace("_", " ").toUpperCase()}</strong>
                        <span
                          className={`pointDeltaTag ${
                            trend.point_delta > 0
                              ? "positive"
                              : trend.point_delta < 0
                              ? "negative"
                              : "neutral"
                          }`}
                        >
                          {trend.point_delta > 0 && "+"}
                          {trend.point_delta} pts
                        </span>
                      </div>

                      <div className="catTrendScores">
                        <span>First: <strong>{trend.first_score}</strong></span>
                        <span className="arrow">→</span>
                        <span>Latest: <strong>{trend.latest_score}</strong></span>
                      </div>

                      <span className="catTrendCount">
                        Based on {trend.supporting_sessions_count} supporting session(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Strengths & Focus Areas */}
            <div className="dashboardDualGrid">
              <div className="dashboardSectionCard strengthsSection">
                <div className="sectionHeaderWithIcon">
                  <CheckCircle2 size={18} className="successIcon" aria-hidden="true" />
                  <div>
                    <h3>Repeated Strengths</h3>
                    <p className="sectionSub">Consistent competencies observed across multiple sessions.</p>
                  </div>
                </div>

                {recurringStrengths.length > 0 ? (
                  <ul className="frequencyList">
                    {recurringStrengths.map((s, i) => (
                      <li key={i} className="frequencyItem">
                        <span className="freqBadge">{s.count}x</span>
                        <span className="freqText">{s.item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="emptySubText">Complete more sessions to identify recurring strengths.</p>
                )}
              </div>

              <div className="dashboardSectionCard improvementsSection">
                <div className="sectionHeaderWithIcon">
                  <BookOpen size={18} className="warningIcon" aria-hidden="true" />
                  <div>
                    <h3>Recurring Improvement Areas</h3>
                    <p className="sectionSub">Skills and topics that benefit from continued reinforcement.</p>
                  </div>
                </div>

                {recurringImprovements.length > 0 ? (
                  <ul className="frequencyList">
                    {recurringImprovements.map((imp, i) => (
                      <li key={i} className="frequencyItem improveItem">
                        <span className="freqBadge warning">{imp.count}x</span>
                        <span className="freqText">{imp.item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="emptySubText">No recurring areas flagged across sessions.</p>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default DashboardPage;
