import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import './IndicatorList.css'


// Renders a list of strings as icon + text rows.
// "negative" = a real warning sign (red/orange)
// "positive" = a good sign (green)
// "neutral"  = a data gap — NOT a warning, just "we couldn't assess this"
// (see D-21: missing data should never look like evidence of risk)
function IndicatorList({ items, variant = 'negative' }) {
  if (!items || items.length === 0) return null

  const Icon = {
    positive: CheckCircle2,
    negative: AlertTriangle,
    neutral: AlertTriangle, 
  }
  const icon = Icon[variant] || AlertTriangle

  return (
    <ul className={`indicator-list indicator-list--${variant}`}>
      {items.map((item) => {
        const label = typeof item === 'string' ? item : item.label
        const detail = typeof item === 'string' ? null : item.detail
        return (
          <li key={label}>
            <Icon size={16} />
            <span>
              {label}
              {detail && <span className="indicator-list__detail"> {detail}</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export default IndicatorList
