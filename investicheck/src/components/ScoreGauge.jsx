import './ScoreGauge.css'

// A semicircular gauge for the risk score.
//
// Drawn as an SVG arc rather than a bar because the score is a position on a
// bounded scale, and an arc makes "how far along the scale" readable without
// reading the number. The arc is stroked with a dash offset so the fill length
// is a direct function of the score.

const RADIUS = 90
const STROKE = 16
const ARC_LENGTH = Math.PI * RADIUS

const LEVEL_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  insufficient_data: 'Insufficient Data',
}

function ScoreGauge({ score = 0, level = 'low' }) {
  const clamped = Math.min(100, Math.max(0, score))
  const filled = (clamped / 100) * ARC_LENGTH

  const centreX = RADIUS + STROKE / 2
  const centreY = RADIUS + STROKE / 2
  const arcPath = `M ${STROKE / 2} ${centreY} A ${RADIUS} ${RADIUS} 0 0 1 ${
    centreX * 2 - STROKE / 2
  } ${centreY}`

  return (
    <div className={`score-gauge score-gauge--${level}`}>
      <svg
        viewBox={`0 0 ${centreX * 2} ${centreY + 8}`}
        className="score-gauge__svg"
        role="img"
        aria-label={`Risk score ${clamped} out of 100. ${LEVEL_LABELS[level] ?? level}.`}
      >
        <path d={arcPath} className="score-gauge__track" strokeWidth={STROKE} fill="none" />
        <path
          d={arcPath}
          className="score-gauge__fill"
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${filled} ${ARC_LENGTH}`}
          strokeLinecap="round"
        />
      </svg>

      <div className="score-gauge__readout">
        <span className="score-gauge__value">{clamped}</span>
        <span className="score-gauge__max">/ 100</span>
      </div>
    </div>
  )
}

export default ScoreGauge
