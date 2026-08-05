import { AlertTriangle, ShieldAlert, FileWarning, Clock3, Lock, CheckCircle2 } from 'lucide-react'
import './RiskPreviewCard.css'

// Static placeholder data representing what a real risk report will look like.
// This is only for visual demonstration — no real analysis happens here yet.
const negativeIndicators = [
  { icon: AlertTriangle, text: 'Promises unusually high returns' },
  { icon: FileWarning, text: 'Company information unverified' },
  { icon: Clock3, text: 'Website recently created' },
]

const positiveIndicators = [
  { icon: Lock, text: 'HTTPS security detected' },
]

function RiskPreviewCard() {
  return (
    <div className="risk-card-wrapper">
      {/* Floating badge, top-right */}
      <div className="risk-card__badge risk-card__badge--detected">
        <ShieldAlert size={14} />
        Risk Detected
      </div>

      <div className="risk-card">
        <p className="risk-card__label">Investment Risk Assessment</p>

        <div className="risk-card__platform">
          <span className="risk-card__platform-name">ABC Investment</span>
          <span className="risk-card__status">High Risk</span>
        </div>

        <div className="risk-card__score-row">
          <div className="risk-card__score">
            <span className="risk-card__score-number">78</span>
            <span className="risk-card__score-max">/ 100</span>
          </div>
          <div className="risk-card__score-bar">
            <div className="risk-card__score-bar-fill" style={{ width: '78%' }} />
          </div>
        </div>

        <div className="risk-card__indicators">
          {negativeIndicators.map(({ icon: Icon, text }) => (
            <div className="risk-card__indicator risk-card__indicator--negative" key={text}>
              <Icon size={16} />
              <span>{text}</span>
            </div>
          ))}
          {positiveIndicators.map(({ icon: Icon, text }) => (
            <div className="risk-card__indicator risk-card__indicator--positive" key={text}>
              <Icon size={16} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <a href="#report" className="risk-card__link">
          View Detailed Report →
        </a>
      </div>

      {/* Floating badge, bottom-left */}
      <div className="risk-card__badge risk-card__badge--complete">
        <CheckCircle2 size={14} />
        Analysis Complete
      </div>
    </div>
  )
}

export default RiskPreviewCard
