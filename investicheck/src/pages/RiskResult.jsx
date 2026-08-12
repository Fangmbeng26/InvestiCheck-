import { useLocation, Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import IndicatorList from '../components/IndicatorList.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import './RiskResult.css'

function RiskResult() {
  const location = useLocation()

  // Analysis.jsx passes { formData, result } forward. "result" is exactly
  // what the backend returned — this page only displays it.
  const { formData, result } = location.state || {}

  if (!formData || !result) {
    return <Navigate to="/check-investment" replace />
  }

  const {
    riskScore,
    riskLevel,
    riskLabel,
    coverage,
    explanation,
    osintUnavailable,
  } = result

  // explanation.indicators: [{ id, label, points, category, explanation, source }]
  const negativeItems = (explanation?.indicators || []).map((i) => ({
    label: i.label,
    detail: `${i.points} pts`,
  }))

  return (
    <>
      <Navbar />
      <main className="result-dashboard">
        <div className="container result-dashboard__inner">
          <div className={`result-summary result-summary--${riskLevel}`}>
            <p className="result-summary__label">Platform</p>
            <h1 className="result-summary__platform">{formData.platformName}</h1>

            <div className="result-summary__score-row">
              <div className="result-summary__score">
                <span className="result-summary__score-number">{riskScore}</span>
                <span className="result-summary__score-max">/ 100</span>
              </div>
              <span className={`risk-badge risk-badge--${riskLevel}`}>{riskLabel}</span>
            </div>

            <div className="result-summary__bar">
              <div
                className={`result-summary__bar-fill result-summary__bar-fill--${riskLevel}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>

            {coverage !== null && coverage !== undefined && (
              <p className="result-summary__coverage">
                Based on {Math.round(coverage * 100)}% of the information this assessment looks for.
              </p>
            )}
          </div>

          {explanation?.summary && <p className="result-summary-text">{explanation.summary}</p>}

          {/* Overrides (watchlist match, corroborated reports) are categorically
              stronger evidence than any weighted indicator — shown as a
              standalone banner rather than mixed into the regular list. */}
          {explanation?.overrides?.length > 0 && (
            <div className="result-overrides">
              <ShieldAlert size={18} />
              <div>
                {explanation.overrides.map((o) => (
                  <p key={o.reason}>
                    {o.reason}
                    {o.sourceUrl && (
                      <>
                        {' '}
                        <a href={o.sourceUrl} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      </>
                    )}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="result-dashboard__grid">
            <section className="result-block">
              <h2>Indicators Found</h2>
              <IndicatorList items={negativeItems} variant="negative" />
            </section>

            {explanation?.notes?.length > 0 && (
              <section className="result-block">
                <h2>Notes</h2>
                <IndicatorList items={explanation.notes} variant="neutral" />
              </section>
            )}
          </div>

          {explanation?.recommendations?.length > 0 && (
            <section className="result-block result-block--full">
              <h2>Recommendations</h2>
              <ul className="result-recommendations">
                {explanation.recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {osintUnavailable && (
            <p className="result-osint-note">
              Some technical checks could not be completed, so this assessment relies more
              heavily on the answers you provided.
            </p>
          )}

          {explanation?.disclaimer && (
            <p className="result-disclaimer">{explanation.disclaimer}</p>
          )}

          <div className="result-dashboard__actions">
            <PrimaryButton to="/report" state={{ formData, result }}>
              View Detailed Report →
            </PrimaryButton>
            <SecondaryButton to="/check-investment">Analyze Another Platform</SecondaryButton>
            <SecondaryButton to="/">Return Home</SecondaryButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default RiskResult