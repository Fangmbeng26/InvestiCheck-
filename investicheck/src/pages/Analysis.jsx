import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import AnalysisStep from '../components/AnalysisStep.jsx'
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

  // The platform name (and other fields) travel here from CheckInvestment.jsx
  // via navigate('/analysis', { state: formData }). If someone lands on this
  // page directly (e.g. refreshing, or typing the URL), there's no state,
  // so we send them back to fill the form in first.
  const formData = location.state

  // Index of the step currently in progress. Steps before this are "done",
  // steps after are "pending".
  const [activeStepIndex, setActiveStepIndex] = useState(0)

  useEffect(() => {
    if (!formData) {
      navigate('/check-investment', { replace: true })
      return
    }

    if (activeStepIndex >= steps.length - 1) {
      // Last step reached: hold on it briefly, then move to the results page.
      const finishTimer = setTimeout(() => {
        navigate('/risk-result', { state: formData })
      }, STEP_DURATION)
      return () => clearTimeout(finishTimer)
    }

    const stepTimer = setTimeout(() => {
      setActiveStepIndex((prev) => prev + 1)
    }, STEP_DURATION)

    return () => clearTimeout(stepTimer)
  }, [activeStepIndex, formData, navigate])

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

          <div className="analysis-card">
            {steps.map((label, index) => {
              let status = 'pending'
              if (index < activeStepIndex) status = 'done'
              else if (index === activeStepIndex) status = 'active'

              return <AnalysisStep key={label} label={label} status={status} />
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Analysis
