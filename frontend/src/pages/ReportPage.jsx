import { ChevronRight } from "lucide-react"

import AnalysisCard from "../components/AnalysisCard"

function ReportPage({
  analysis,
  onNewInterview
}) {

  return (
    <section className="report">

      <div className="reportHeader">

        <p className="eyebrow">
          INTERVIEW ANALYSIS
        </p>

        <h1>
          Your Interview Report
        </h1>

        <p className="subtitle">
          AI-generated feedback based on
          your complete mock interview.
        </p>

      </div>

      <div className="summaryCard">

        <h2>
          Overall Summary
        </h2>

        <p>
          {analysis.overall_summary}
        </p>

      </div>

      <div className="analysisGrid">

        <AnalysisCard
          title="Communication"
          data={analysis.communication}
        />

        <AnalysisCard
          title="Relevance"
          data={analysis.relevance}
        />

        <AnalysisCard
          title="Structure"
          data={analysis.structure}
        />

        <AnalysisCard
          title="Specificity"
          data={analysis.specificity}
        />

        <AnalysisCard
          title="Behavioral"
          data={analysis.behavioral}
        />

        <AnalysisCard
          title="Technical"
          data={analysis.technical}
        />

        <AnalysisCard
          title="Project Discussion"
          data={analysis.project_discussion}
        />

      </div>

      <div className="reportColumns">

        <div className="reportBox">

          <h2>
            Strengths
          </h2>

          {analysis.strengths?.map(
            (item, index) => (

              <div
                className="feedbackItem"
                key={index}
              >
                ✓ {item}
              </div>

            )
          )}

        </div>

        <div className="reportBox">

          <h2>
            Areas to Improve
          </h2>

          {analysis.improvements?.map(
            (item, index) => (

              <div
                className="feedbackItem"
                key={index}
              >
                → {item}
              </div>

            )
          )}

        </div>

      </div>

      <div className="reportBox finalFeedback">

        <h2>
          Final Feedback
        </h2>

        {analysis.final_feedback?.map(
          (item, index) => (

            <p key={index}>
              {index + 1}. {item}
            </p>

          )
        )}

      </div>

      <button
        className="primary"
        onClick={onNewInterview}
      >
        Start New Interview

        <ChevronRight size={18} />

      </button>

    </section>
  )
}

export default ReportPage