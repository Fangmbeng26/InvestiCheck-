import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Info } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import CoverageMeter from '../components/CoverageMeter.jsx'
import Alert from '../components/Alert.jsx'
import PageLoader from '../components/PageLoader.jsx'
import { fetchAssessment } from '../Services/investicheckApi.js'
import { displayWebsite } from '../utils/website.js'
import './AssessmentDetails.css'

// The full working of an assessment, for a reader who wants to check the
// reasoning rather than take the headline on trust.
//
// Both what was found and what could not be established are shown. Listing the
// gaps matters as much as listing the findings: a reader who cannot see what
// was missed has no way to judge how much weight the result deserves.

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not available'

function Fact({ label, value }) {
  return (
    <div className="detail-fact">
      <dt>{label}</dt>
      <dd>{value ?? 'Not available'}</dd>
    </div>
  )
}

function AssessmentDetails() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAssessment(id)
      .then(setResult)
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="details-page">
          <PageLoader label="Loading the breakdown" />
        </main>
        <Footer />
      </>
    )
  }

  if (error || !result) {
    return (
      <>
        <Navbar />
        <main className="details-page">
          <div className="container details-page__narrow">
            <Alert variant="error" title="This assessment could not be opened">
              {error || 'It may have been removed, or the link may be incorrect.'}
            </Alert>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const { osint, explanation, detectedIndicators = [], unknownIndicators = [] } = result
  const domain = osint?.domain_registration?.data
  const tls = osint?.tls?.data
  const dns = osint?.dns?.data
  const availability = osint?.availability?.data
  const findings = explanation?.indicators ?? detectedIndicators

  return (
    <>
      <Navbar />
      <main className="details-page">
        <div className="container details-page__inner">
          <PageHeader
            eyebrow="Full breakdown"
            title={result.platformName}
            subtitle={`${displayWebsite(result.website)}, assessed ${formatDate(result.dateAnalyzed)}`}
          />

          <div className="details-page__back">
            <SecondaryButton to={`/result/${id}`}>
              <ArrowLeft size={16} /> Back to the result
            </SecondaryButton>
          </div>

          <div className="details-page__grid">
            <FormCard className="details-card">
              <h2>Overall</h2>
              <p className="details-card__lead">{explanation?.summary}</p>
              <CoverageMeter coverage={result.coverage} unknownCount={unknownIndicators.length} />
            </FormCard>

            <FormCard className="details-card">
              <h2>Website checks</h2>
              <dl className="detail-facts">
                <Fact
                  label="Reachable"
                  value={
                    availability
                      ? availability.reachable
                        ? `Yes, responded with status ${availability.statusCode}`
                        : 'No response'
                      : undefined
                  }
                />
                <Fact
                  label="Secure connection"
                  value={
                    tls
                      ? tls.httpsAvailable
                        ? tls.certValid
                          ? `Valid certificate${tls.issuer ? ` from ${tls.issuer}` : ''}`
                          : 'Certificate present but not valid'
                        : 'No HTTPS certificate'
                      : undefined
                  }
                />
                <Fact label="Nameservers" value={dns?.nameserverCount} />
                <Fact
                  label="Email configured"
                  value={dns ? (dns.hasMx ? 'Yes' : 'No') : undefined}
                />
              </dl>
              {tls?.certValid && (
                <p className="details-card__caveat">
                  <Info size={14} /> A valid certificate encrypts traffic. It does not verify who
                  runs the site, and it is not a sign the platform is legitimate.
                </p>
              )}
            </FormCard>

            <FormCard className="details-card">
              <h2>Domain registration</h2>
              <dl className="detail-facts">
                <Fact label="Registered on" value={formatDate(domain?.registrationDate)} />
                <Fact
                  label="Age"
                  value={
                    domain?.ageDays !== null && domain?.ageDays !== undefined
                      ? `${Math.floor(domain.ageDays / 365)} year(s), ${Math.floor(
                          (domain.ageDays % 365) / 30
                        )} month(s)`
                      : undefined
                  }
                />
                <Fact label="Expires on" value={formatDate(domain?.expiryDate)} />
                <Fact label="Registrar" value={domain?.registrar} />
              </dl>
            </FormCard>

            <FormCard className="details-card details-card--wide">
              <h2>Findings that raised the score</h2>
              {findings.length === 0 ? (
                <p className="details-card__empty">No individual warning signs were detected.</p>
              ) : (
                <ul className="detail-findings">
                  {findings.map((finding) => (
                    <li key={finding.id}>
                      <div className="detail-findings__head">
                        <span className="detail-findings__label">{finding.label}</span>
                        <span className="detail-findings__points">+{finding.points}</span>
                      </div>
                      {finding.explanation && <p>{finding.explanation}</p>}
                      {finding.source && (
                        <p className="detail-findings__source">Basis: {finding.source}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </FormCard>

            {unknownIndicators.length > 0 && (
              <FormCard className="details-card details-card--wide">
                <h2>What could not be established</h2>
                <p className="details-card__lead">
                  These were left unanswered or could not be checked. They did not raise the score,
                  but they are the reason the confidence figure is below 100%.
                </p>
                <ul className="detail-unknowns">
                  {unknownIndicators.map((indicator) => (
                    <li key={indicator.id}>{indicator.label}</li>
                  ))}
                </ul>
              </FormCard>
            )}

            <FormCard className="details-card details-card--wide">
              <h2>Notes on this assessment</h2>
              <ul className="detail-notes">
                {(explanation?.notes ?? []).map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="details-card__disclaimer">{explanation?.disclaimer}</p>
            </FormCard>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default AssessmentDetails
