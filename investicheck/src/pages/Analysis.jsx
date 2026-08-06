import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AnalysisStep from '../components/AnalysisStep.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import { analyzeInvestment } from '../utils/riskAnalysis.js'
import './Analysis.css'

const steps = [
  'Checking website information',
  'Checking company details',
  'Looking for scam indicators',
  'Calculating risk score',
  'Preparing report',
]

// How long each step stays "active" before the next one starts, in ms.
const STEP_DURATION = 950

function Analysis() {
  const location = useLocation()
  const navigate = useNavigate()

  const formData = location.state

  // Visual step progress (cosmetic — see steps array above).
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  // The real, server-authoritative analysis. 'pending' | 'success' | 'error'.
  const [apiStatus, setApiStatus] = useState('pending')
  const [apiResult, setApiResult] = useState(null)
  const [apiError, setApiError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
// Redirect if someone lands here directly with no form data to analyze.
  useEffect(() => {
    if (!formData) {
      navigate('/check-investment', { replace: true })
    }
  }, [formData, navigate])

  useEffect(() => {
    if (!formData) return

    let cancelled = false
    setApiStatus('pending')

    analyzeInvestment(formData)
      .then((result) => {
        if (!cancelled) {
          setApiResult(result)
          setApiStatus('success')
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setApiError(error.message || 'An error occurred during analysis.')
          setApiStatus('error')
        }
      })

    return () => {
      cancelled = true
    }
  }, [formData, retryCount])

  // Advances the visual step list. Stops (and holds) on the final step —
  // it does not proceed past "Preparing report" until the real result
  useEffect(() => {
    if (!formData) return
    if (activeStepIndex >= steps.length - 1) return

    const stepTimer = setTimeout(() => {
      setActiveStepIndex((prev) => prev + 1)
    }, STEP_DURATION)

    return () => clearTimeout(stepTimer)
  }, [activeStepIndex, formData, navigate])

  //the visual step is done and real results are available, navigate to the RiskResult page
  useEffect(() => {
    if (activeStepIndex >= steps.length - 1 && apiStatus === 'success') {
      const timer = setTimeout(() => {
        navigate('/risk-result', { state: { formData, result: apiResult } })
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [activeStepIndex, apiStatus, apiResult, formData, navigate])
  const handleRetry = () => {
    setRetryCount((count) => count + 1)
  }

  // Avoid rendering the page body for a split second before the redirect above fires.
  if (!formData) return null

  return (
    <>
      <Navbar />
      <main className="analysis-page">
        <div className="container analysis-page__inner">
          <div className="analysis-page__header">
            <div className="analysis-page__badge">
              <ShieldAlert size={22} strokeWidth={2.25} />
            </div>
            <h1 className="analysis-page__title">Analyzing Investment Platform</h1>
            <p className="analysis-page__platform">{formData.platformName}</p>
            <p className="analysis-page__description">
              We are checking available information and looking for potential risk indicators.
            </p>
          </div>

        {apiStatus === 'error' ? (
          <div className="analysis-card analysis-card--error">
              <AlertCircle size={22} />
              <p className="analysis-error__message">{apiError}</p>
              <p className="analysis-error__hint">
                Make sure the backend server is running and reachable.
              </p>
              <div className="analysis-error__actions">
                <PrimaryButton onClick={handleRetry}>Retry</PrimaryButton>
                <SecondaryButton onClick={() => navigate('/check-investment')}>
                  Back to Form
                </SecondaryButton>
              </div>
            </div>
          ) : (
          <div className="analysis-card">
            {steps.map((label, index) => {
              let status = 'pending'
              if (index < activeStepIndex) status = 'done'
              else if (index === activeStepIndex) status = 'active'

              return <AnalysisStep key={label} label={label} status={status} />
            })}
          </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Analysis
