import { Check, Loader2, Circle } from 'lucide-react'
import './AnalysisStep.css'

// status is one of: 'done' | 'active' | 'pending'
// This single component renders all three visual states so Analysis.jsx
// only needs to track which step index is currently active.
function AnalysisStep({ label, status }) {
  return (
    <div className={`analysis-step analysis-step--${status}`}>
      <span className="analysis-step__icon">
        {status === 'done' && <Check size={16} strokeWidth={3} />}
        {status === 'active' && <Loader2 size={16} className="analysis-step__spinner" />}
        {status === 'pending' && <Circle size={10} fill="currentColor" />}
      </span>
      <span className="analysis-step__label">{label}</span>
    </div>
  )
}

export default AnalysisStep
