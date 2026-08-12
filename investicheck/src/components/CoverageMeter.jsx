import { Info } from 'lucide-react'
import './CoverageMeter.css'

// How much of the assessment could actually be answered.
//
// Shown next to every score because a score alone hides the difference between
// "we checked everything and found little" and "we could barely check
// anything". Presenting only the number would let the second case read as
// reassurance.

const describe = (percent) => {
  if (percent >= 85) return 'Nearly all checks completed'
  if (percent >= 60) return 'Most checks completed'
  if (percent >= 35) return 'Limited information available'
  return 'Very little could be verified'
}

function CoverageMeter({ coverage, unknownCount = 0 }) {
  if (coverage === null || coverage === undefined) return null

  const percent = Math.round(coverage * 100)
  const isLow = percent < 60

  return (
    <div className={`coverage-meter ${isLow ? 'coverage-meter--low' : ''}`}>
      <div className="coverage-meter__header">
        <span className="coverage-meter__label">
          Confidence in this result
          <span className="coverage-meter__tooltip" title="The share of checks that returned a usable answer.">
            <Info size={13} />
          </span>
        </span>
        <span className="coverage-meter__value">{percent}%</span>
      </div>

      <div
        className="coverage-meter__track"
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Confidence in this result"
      >
        <div className="coverage-meter__fill" style={{ width: `${percent}%` }} />
      </div>

      <p className="coverage-meter__caption">
        {describe(percent)}
        {unknownCount > 0 && `, ${unknownCount} question${unknownCount === 1 ? '' : 's'} unanswered`}
      </p>
    </div>
  )
}

export default CoverageMeter
