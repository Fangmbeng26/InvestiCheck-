import { useMemo } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import IndicatorList from '../components/IndicatorList.jsx'
import { analyzeInvestment } from '../utils/riskAnalysis.js'
import './Report.css'

// A short, level-specific paragraph. This is static copy, not generated
// text — just three pre-written summaries 
const summaryCopy = {
  low: 'This platform shows relatively few common warning signs based on the information provided. That does not guarantee it is legitimate — independent research is still recommended.',
  moderate: 'This platform shows a mix of warning signs and positive signals. Extra caution and independent verification are recommended before investing.',
  high: 'This platform shows multiple common warning signs associated with investment scams. Proceed with significant caution.',
}

const recommendationsCopy = {
  low: [
    'Still verify company registration through an official regulator.',
    'Start with a small amount if you choose to invest at all.',
    'Keep records of all communication with the platform.',
  ],
  moderate: [
    'Independently verify the company\u2019s registration and address.',
    'Be cautious of any pressure to invest quickly or recruit others.',
    'Avoid investing more than you can afford to lose.',
  ],
  high: [
    'Avoid investing until the company can be independently verified.',
    'Treat guaranteed or unusually high returns as a major red flag.',
    'Report the platform to your local financial regulator if suspicious.',
  ],
}

function Report() {
  const location = useLocation()
  const formData = location.state

  const result = useMemo(() => (formData ? analyzeInvestment(formData) : null), [formData])

  if (!formData || !result) {
    return <Navigate to="/check-investment" replace />
  }

  const { score, level, levelLabel, negativeIndicators, positiveIndicators } = result

  return (
    <>
      <Navbar />
      <main className="report-page">
        <div className="container report-page__inner">
          <PageHeader
            eyebrow="Detailed Report"
            title={formData.platformName}
            subtitle={`Full analysis breakdown \u2014 risk score ${score}/100 (${levelLabel}).`}
          />

          <div className="report-page__sections">
            <FormCard className="report-section">
              <h2>Overall Risk Summary</h2>
              <span className={`risk-badge risk-badge--${level}`}>{levelLabel}</span>
              <p>{summaryCopy[level]}</p>
            </FormCard>

            <FormCard className="report-section">
              <h2>Website Analysis</h2>
              <dl className="report-facts">
                <div>
                  <dt>Website</dt>
                  <dd>{formData.websiteUrl}</dd>
                </div>
                <div>
                  <dt>HTTPS Security</dt>
                  <dd>{formData.websiteUrl?.startsWith('https://') ? 'Detected' : 'Not detected'}</dd>
                </div>
                <div>
                  <dt>Domain Age</dt>
                  <dd>Could not be verified in this version</dd>
                </div>
              </dl>
            </FormCard>

            <FormCard className="report-section">
              <h2>Company Verification</h2>
              <dl className="report-facts">
                <div>
                  <dt>Company Name</dt>
                  <dd>{formData.companyName || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Country of Operation</dt>
                  <dd>{formData.country || 'Not provided'}</dd>
                </div>
              </dl>
            </FormCard>

            <FormCard className="report-section">
              <h2>Investment Claims</h2>
              <dl className="report-facts">
                <div>
                  <dt>Investment Category</dt>
                  <dd>{formData.category || 'Not specified'}</dd>
                </div>
                <div>
                  <dt>Promised Return</dt>
                  <dd>{formData.promisedReturn ? `${formData.promisedReturn}%` : 'Not specified'}</dd>
                </div>
                <div>
                  <dt>Investment Duration</dt>
                  <dd>{formData.duration || 'Not specified'}</dd>
                </div>
                <div>
                  <dt>Minimum Investment</dt>
                  <dd>{formData.minimumInvestment || 'Not specified'}</dd>
                </div>
                <div>
                  <dt>Referral Required</dt>
                  <dd>{formData.referralRequired || 'Not specified'}</dd>
                </div>
                <div>
                  <dt>Profits Guaranteed</dt>
                  <dd>{formData.guaranteedProfits || 'Not specified'}</dd>
                </div>
              </dl>
              {formData.notes && (
                <>
                  <h3 className="report-section__subheading">Additional Notes</h3>
                  <p className="report-section__notes">{formData.notes}</p>
                </>
              )}
            </FormCard>

            <FormCard className="report-section">
              <h2>Risk Indicators</h2>
              <IndicatorList items={negativeIndicators} variant="negative" />
            </FormCard>

            {positiveIndicators.length > 0 && (
              <FormCard className="report-section">
                <h2>Positive Indicators</h2>
                <IndicatorList items={positiveIndicators} variant="positive" />
              </FormCard>
            )}

            <FormCard className="report-section">
              <h2>Recommendations</h2>
              <ul className="report-recommendations">
                {recommendationsCopy[level].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </FormCard>

            <div className="report-disclaimer">
              <Info size={18} />
              <p>
                This report is generated from a simulated analysis for demonstration purposes.
                InvestiCheck does not provide financial or legal advice, and this should not be
                the only basis for an investment decision.
              </p>
            </div>
          </div>

          <div className="report-page__actions">
            <SecondaryButton to="/risk-result" state={formData}>
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
