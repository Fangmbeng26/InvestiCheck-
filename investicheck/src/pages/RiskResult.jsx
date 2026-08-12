import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { AlertOctagon, ArrowRight, FileText, Flag, Search } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import ScoreGauge from '../components/ScoreGauge.jsx'
import CoverageMeter from '../components/CoverageMeter.jsx'
import Alert from '../components/Alert.jsx'
import PageLoader from '../components/PageLoader.jsx'
import { fetchAssessment } from '../Services/investicheckApi.js'
import { displayWebsite } from '../utils/website.js'
import './RiskResult.css'

// The headline outcome.
//
// Everything shown here is produced by the server. Scoring deliberately does
// not happen in the browser: the weights are part of the assessment method, so
// a second implementation here could disagree with the stored result — quite
// apart from being editable by anyone viewing the page.

// A freshly completed assessment carries its own wording, but a stored one
// holds only the level. Deriving the label here keeps a shared link reading
// the same as the original result instead of showing an empty badge.
const LEVEL_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  insufficient_data: 'Insufficient Data',
}

function RiskResult() {
  const { id } = useParams()
  const location = useLocation()

  // Arriving straight from the assessment, the result is already in hand.
  // Only a shared or reloaded link has to fetch it — which is also what makes
  // a result worth sending to someone else.
  const [result, setResult] = useState(location.state?.result ?? null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(!location.state?.result)

  useEffect(() => {
    if (result || !id) return

    fetchAssessment(id)
      .then(setResult)
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [id, result])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="result-page">
          <PageLoader label="Loading the assessment" />
        </main>
        <Footer />
      </>
    )
  }

  if (error || !result) {
    return (
      <>
        <Navbar />
        <main className="result-page">
          <div className="container result-page__narrow">
            <Alert variant="error" title="This assessment could not be opened">
              {error || 'It may have been removed, or the link may be incorrect.'}
            </Alert>
            <PrimaryButton to="/check-investment" className="result-page__restart">
              Check a platform <ArrowRight size={18} />
            </PrimaryButton>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const {
    riskScore,
    riskLevel,
    riskLabel,
    coverage,
    detectedIndicators = [],
    unknownIndicators = [],
    overrides = [],
    explanation,
    osintUnavailable,
  } = result

  const findings = explanation?.indicators ?? detectedIndicators
  const topFindings = findings.slice(0, 4)
  const isUnresolved = riskLevel === 'insufficient_data'

  return (
    <>
      <Navbar />
      <main className="result-page">
        <div className="container result-page__inner">
          <header className={`result-hero result-hero--${riskLevel}`}>
            <div className="result-hero__identity">
              <p className="result-hero__eyebrow">Assessment result</p>
              <h1 className="result-hero__platform">{result.platformName}</h1>
              <p className="result-hero__website">{displayWebsite(result.website)}</p>
              <span className={`risk-badge risk-badge--${riskLevel}`}>
                {riskLabel ?? LEVEL_LABELS[riskLevel] ?? 'Assessed'}
              </span>
            </div>

            <div className="result-hero__gauge">
              <ScoreGauge score={riskScore} level={riskLevel} />
            </div>
          </header>

          {/* A published regulator warning is stronger evidence than anything
              the questions can establish, so it is shown above the score
              rather than folded into it — and always attributed to the body
              that issued it, never asserted as our own finding. */}
          {overrides.length > 0 && (
            <div className="result-page__overrides">
              {overrides.map((override) => (
                <Alert key={override.type} variant="error" title="Formal warning on record">
                  {override.reason}
                  {override.sourceUrl && (
                    <>
                      {' '}
                      <a href={override.sourceUrl} target="_blank" rel="noreferrer noopener">
                        View the source
                      </a>
                    </>
                  )}
                </Alert>
              ))}
            </div>
          )}

          {isUnresolved && (
            <Alert variant="warning" title="Not enough information for a verdict">
              Too little could be established about this platform to call it low risk. Answering
              more of the questions will make the result more reliable.
            </Alert>
          )}

          {osintUnavailable && (
            <Alert variant="info" title="Automated checks were unavailable">
              This result is based on your answers alone. The platform&apos;s website could not be
              checked at the time of the assessment.
            </Alert>
          )}

          <div className="result-page__summary">
            <p className="result-page__summary-text">{explanation?.summary}</p>
            <CoverageMeter coverage={coverage} unknownCount={unknownIndicators.length} />
          </div>

          {topFindings.length > 0 && (
            <section className="result-section">
              <h2 className="result-section__heading">
                <AlertOctagon size={18} /> What stood out
              </h2>
              <ul className="result-findings">
                {topFindings.map((finding) => (
                  <li key={finding.id} className="result-finding">
                    <span className="result-finding__label">{finding.label}</span>
                    {finding.explanation && (
                      <span className="result-finding__detail">{finding.explanation}</span>
                    )}
                  </li>
                ))}
              </ul>
              {findings.length > topFindings.length && (
                <p className="result-section__more">
                  <Link to={`/result/${id}/details`}>See all {findings.length} findings</Link>
                </p>
              )}
            </section>
          )}

          <section className="result-section">
            <h2 className="result-section__heading">What to do next</h2>
            <ul className="result-advice">
              {(explanation?.recommendations ?? []).map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </section>

          <div className="result-page__actions">
            <PrimaryButton to={`/result/${id}/details`}>
              <FileText size={17} /> Full breakdown
            </PrimaryButton>
            <SecondaryButton
              to="/report-platform"
              state={{ platformName: result.platformName, website: result.website }}
            >
              <Flag size={16} /> Report this platform
            </SecondaryButton>
            <SecondaryButton to="/check-investment">
              <Search size={16} /> Check another
            </SecondaryButton>
          </div>

          <p className="result-page__disclaimer">{explanation?.disclaimer}</p>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default RiskResult
