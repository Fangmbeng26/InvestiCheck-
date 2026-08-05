import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import './IndicatorList.css'

// Renders a list of strings as icon + text rows. "variant" controls whether
// it shows a warning icon (red/orange) or a check icon (green) — used by
// both RiskResult (summary view) and Report (full detail view).
function IndicatorList({ items, variant = 'negative' }) {
  if (!items || items.length === 0) return null

  const Icon = variant === 'positive' ? CheckCircle2 : AlertTriangle

  return (
    <ul className={`indicator-list indicator-list--${variant}`}>
      {items.map((text) => (
        <li key={text}>
          <Icon size={16} />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}

export default IndicatorList
