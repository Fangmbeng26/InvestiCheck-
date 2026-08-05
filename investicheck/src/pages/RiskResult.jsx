import { useMemo } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import IndicatorList from '../components/IndicatorList.jsx'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { analyzeInvestment } from '../utils/riskAnalysis.js'
import './RiskResult.css'

function RiskResult() {
  const location = useLocation()
  const formData = location.state

  // useMemo re-runs analyzeInvestment only when formData changes, instead
  // of recalculating the score on every re-render. Cheap here either way,
  // but it's the correct pattern once a calculation isn't free.
  const result = useMemo(() => (formData ? analyzeInvestment(formData) : null), [formData])

  if (!formData || !result) {
    return <Navigate to="/check-investment" replace />
  }

  const { score, level, levelLabel, negativeIndicators, positiveIndicators } = result

  return (
    <>
      <Navbar />
      <main className="result-dashboard">
        <div className="container result-dashboard__inner">
          <div className={`result-summary result-summary--${level}`}>
            <p className="result-summary__label">Platform</p>
            <h1 className="result-summary__platform">{formData.platformName}</h1>

            <div className="result-summary__score-row">
              <div className="result-summary__score">
                <span className="result-summary__score-number">{score}</span>
                <span className="result-summary__score-max">/ 100</span>
              </div>
              <span className={`risk-badge risk-badge--${level}`}>{levelLabel}</span>
            </div>

            <div className="result-summary__bar">
              <div
                className={`result-summary__bar-fill result-summary__bar-fill--${level}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>

          <div className="result-dashboard__grid">
            <section className="result-block">
              <h2>Warning Indicators</h2>
              <IndicatorList items={negativeIndicators} variant="negative" />
            </section>

            {positiveIndicators.length > 0 && (
              <section className="result-block">
                <h2>Positive Indicators</h2>
                <IndicatorList items={positiveIndicators} variant="positive" />
              </section>
            )}
          </div>

          <div className="result-dashboard__actions">
            <PrimaryButton to="/report" state={formData}>
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
