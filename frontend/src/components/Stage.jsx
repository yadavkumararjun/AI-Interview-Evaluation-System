function Stage({
  number,
  title,
  text
}) {
  return (
    <div className="stageCard">

      <span className="stageNumber">
        {number}
      </span>

      <div>

        <strong>
          {title}
        </strong>

        <small>
          {text}
        </small>

      </div>

    </div>
  )
}

export default Stage