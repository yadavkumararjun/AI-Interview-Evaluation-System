function AnalysisCard({
  title,
  data
}) {

  if (!data) {
    return null
  }

  return (
    <div className="analysisCard">

      <div className="analysisCardTop">

        <h3>
          {title}
        </h3>

        <strong>
          {data.score}/10
        </strong>

      </div>

      <div className="scoreBar">

        <div
          style={{
            width: `${data.score * 10}%`
          }}
        />

      </div>

      <p>
        {data.feedback}
      </p>

    </div>
  )
}

export default AnalysisCard