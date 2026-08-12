import { useLocation, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import IndicatorList from '../components/IndicatorList.jsx'
import './Report.css'

function Report() {
  const location = useLocation()

  // RiskResult.jsx passes { formData, result } forward — this page only
  // displays it, it never recalculates anything.
  const { formData, result } = location.state || {}

  if (!formData || !result) {
    return <Navigate to="/check-investment" replace />
  }

  const { riskScore, riskLevel, riskLabel, coverage, explanation, osint } = result

  const detectedItems = (explanation?.indicators || []).map((i) => ({
    label: i.label,
    detail: `${i.points} pts — ${i.source || 'no cited source'}`,
  }))

  return (
    <>
      <Navbar />
      <main className="report-page">
        <div className="container report-page__inner">
          <PageHeader
            eyebrow="Detailed Report"
            title={formData.platformName}
            subtitle={`Full analysis breakdown \u2014 risk score ${riskScore}/100 (${riskLabel}).`}
          />

          <div className="report-page__sections">
            <FormCard className="report-section">
              <h2>Overall Risk Summary</h2>
              <span className={`risk-badge risk-badge--${riskLevel}`}>{riskLabel}</span>
              <p>{explanation?.summary}</p>
              <p>{explanation?.narrative}</p>
              {coverage !== null && coverage !== undefined && (
                <p>Based on {Math.round(coverage * 100)}% of the indicators this system evaluates.</p>
              )}
            </FormCard>

            <FormCard className="report-section">
              <h2>Website Analysis</h2>
              <dl className="report-facts">
                <div>
                  <dt>Website</dt>
                  <dd>{formData.website}</dd>
                </div>
                <div>
                  <dt>Reachable</dt>
                  <dd>{osint?.availability?.data?.reachable === true ? 'Yes' : osint?.availability?.data?.reachable === false ? 'No' : 'Not available'}</dd>
                </div>
                <div>
                  <dt>HTTPS</dt>
                  <dd>{osint?.tls?.data?.httpsAvailable ? (osint.tls.data.certValid ? 'Valid certificate' : 'Present, but invalid certificate') : 'Not available'}</dd>
                </div>
                <div>
                  <dt>Domain Age</dt>
                  <dd>{osint?.domain_registration?.data?.ageDays != null ? `${osint.domain_registration.data.ageDays} days` : 'Not available'}</dd>
                </div>
                <div>
                  <dt>DNS</dt>
                  <dd>{osint?.dns?.data?.resolves === false ? 'Does not resolve' : osint?.dns?.data ? `${osint.dns.data.nameserverCount ?? '?'} nameserver(s)` : 'Not available'}</dd>
                </div>
              </dl>
            </FormCard>

            <FormCard className="report-section">
              <h2>Indicators Detected</h2>
              <IndicatorList items={detectedItems} variant="negative" />
            </FormCard>

            {explanation?.overrides?.length > 0 && (
              <FormCard className="report-section">
                <h2>Regulator &amp; Report Overrides</h2>
                {explanation.overrides.map((o) => (
                  <p key={o.reason} className="report-override">
                    {o.reason}
                    {o.sourceUrl && (
                      <>
                        {' '}
                        <a href={o.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                      </>
                    )}
                  </p>
                ))}
              </FormCard>
            )}

            {explanation?.notes?.length > 0 && (
              <FormCard className="report-section">
                <h2>Notes</h2>
                <IndicatorList items={explanation.notes} variant="neutral" />
              </FormCard>
            )}

            <FormCard className="report-section">
              <h2>Recommendations</h2>
              <ul className="report-recommendations">
                {(explanation?.recommendations || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </FormCard>

            <div className="report-disclaimer">
              <p>{explanation?.disclaimer}</p>
            </div>
          </div>

          <div className="report-page__actions">
            <SecondaryButton to="/risk-result" state={{ formData, result }}>
              Back to Summary
            </SecondaryButton>
            <PrimaryButton to="/check-investment">Analyze Another Platform →</PrimaryButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Report