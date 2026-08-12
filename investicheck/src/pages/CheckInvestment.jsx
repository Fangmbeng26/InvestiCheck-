import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import IndicatorQuestion from '../components/IndicatorQuestions.jsx'
import api from '../Services/api.js'
import './CheckInvestment.css'

function CheckInvestment() {
  const navigate = useNavigate()


  const [platformName, setPlatformName] = useState('')
  const [website, setWebsite] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})


  const [questions, setQuestions] = useState([])
  const [technicalIndicators, setTechnicalIndicators] = useState([])
  const [loadStatus, setLoadStatus] = useState('pending') // pending | success | error
  const [loadError, setLoadError] = useState('')

  // indicatorId -> 'yes' | 'no' | 'unknown'
  const [answers, setAnswers] = useState({})

  const loadIndicators = () => {
    setLoadStatus('pending')
    api
      .get('/api/analysis/indicators')
      .then((response) => {
        setQuestions(response.data.questions)
        setTechnicalIndicators(response.data.technicalIndicators || [])
      
        const initialAnswers = {}
        response.data.questions.forEach((q) => {
          initialAnswers[q.id] = 'unknown'
        })
        setAnswers(initialAnswers)
        setLoadStatus('success')
      })
      .catch((error) => {
        setLoadError(
          error.response?.data?.message || 'Could not load the assessment questions.'
        )
        setLoadStatus('error')
      })
  }

  useEffect(() => {
    loadIndicators()
  }, [])

  const handleAnswerChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!platformName.trim()) {
      nextErrors.platformName = 'Platform name is required.'
    }

    if (!website.trim()) {
      nextErrors.website = 'Website URL is required.'
    } else {
      try {
        new URL(website)
      } catch {
        nextErrors.website = 'Enter a valid URL, including https://'
      }
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validate()) return

    // The Analysis.jsx reads this shape and POSTs it to /api/analysis.
    navigate('/analysis', { state: { platformName, website, answers } })
  }

  return (
    <>
      <Navbar />
      <main className="check-page">
        <div className="container check-page__inner">
          <PageHeader
            icon={ShieldCheck}
            eyebrow="Step 1 of 3"
            title="Check an Investment Platform"
            subtitle="Enter the platform's details, then answer what you know about it. It's fine to leave answers as “Don't know” — that's a real, honest answer here."
          />

          {loadStatus === 'error' && (
            <FormCard className="check-page__load-error">
              <AlertCircle size={20} />
              <p>{loadError}</p>
              <p className="check-page__load-error-hint">
                Make sure the backend server is running and reachable.
              </p>
              <PrimaryButton onClick={loadIndicators}>Try Again</PrimaryButton>
            </FormCard>
          )}

          {loadStatus === 'pending' && (
            <FormCard>
              <p className="check-page__loading">Loading assessment questions…</p>
            </FormCard>
          )}

          {loadStatus === 'success' && (
            <FormCard as="form" onSubmit={handleSubmit} noValidate>
              <FormInput
                id="platformName"
                name="platformName"
                label="Platform Name"
                placeholder="Enter the investment platform name"
                value={platformName}
                onChange={(event) => setPlatformName(event.target.value)}
                error={fieldErrors.platformName}
              />

              <FormInput
                id="website"
                name="website"
                label="Website URL"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                error={fieldErrors.website}
              />

              <div className="check-page__questions">
                <h2 className="check-page__questions-title">About the Platform</h2>
                {questions.map((q) => (
                  <IndicatorQuestion
                    key={q.id}
                    question={q.question}
                    help={q.help}
                    value={answers[q.id]}
                    onChange={(value) => handleAnswerChange(q.id, value)}
                  />
                ))}
              </div>

              {technicalIndicators.length > 0 && (
                <div className="check-page__auto-checks">
                  <h3>We'll also automatically check</h3>
                  <ul>
                    {technicalIndicators.map((i) => (
                      <li key={i.id}>{i.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <PrimaryButton type="submit" className="check-page__submit">
                Start Analysis →
              </PrimaryButton>
            </FormCard>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default CheckInvestment