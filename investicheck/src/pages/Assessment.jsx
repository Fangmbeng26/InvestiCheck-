import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardList, RotateCcw } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import ChoiceGroup from '../components/ChoiceGroup.jsx'
import TechnicalChecks from '../components/TechnicalChecks.jsx'
import Alert from '../components/Alert.jsx'
import PageLoader from '../components/PageLoader.jsx'
import { fetchIndicators, runTechnicalChecks, submitAssessment } from '../Services/investicheckApi.js'
import { displayWebsite } from '../utils/website.js'
import './Assessment.css'

// Step two: the automated checks and the user's answers are gathered together.
//
// The two run in parallel on purpose. The website checks involve several
// network round trips, and blocking the user behind a progress bar wastes that
// time. Starting both at once means the technical findings are usually on
// screen before the questions have been worked through.

function Assessment() {
  const location = useLocation()
  const navigate = useNavigate()
  const platform = location.state

  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [questionsError, setQuestionsError] = useState('')
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)

  const [osint, setOsint] = useState(null)
  const [osintError, setOsintError] = useState('')
  const [isCheckingWebsite, setIsCheckingWebsite] = useState(true)

  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadQuestions = useCallback(() => {
    setIsLoadingQuestions(true)
    setQuestionsError('')

    return fetchIndicators()
      .then((data) => {
        setQuestions(data.questions)

        // Start every question unanswered rather than defaulting to "no".
        // A default of "no" would silently assert the absence of warning signs
        // the user never actually confirmed.
        setAnswers((previous) =>
          data.questions.reduce(
            (accumulator, question) => ({
              ...accumulator,
              [question.id]: previous[question.id] ?? 'unknown',
            }),
            {}
          )
        )
      })
      .catch((error) => setQuestionsError(error.message))
      .finally(() => setIsLoadingQuestions(false))
  }, [])

  const checkWebsite = useCallback(() => {
    if (!platform?.website) return undefined

    setIsCheckingWebsite(true)
    setOsintError('')

    return runTechnicalChecks(platform.website)
      .then((data) => setOsint(data.osint))
      .catch((error) => setOsintError(error.message))
      .finally(() => setIsCheckingWebsite(false))
  }, [platform?.website])

  useEffect(() => {
    if (!platform?.website) return
    loadQuestions()
    checkWebsite()
  }, [platform?.website, loadQuestions, checkWebsite])

  const handleAnswer = useCallback((id, value) => {
    setAnswers((previous) => ({ ...previous, [id]: value }))
  }, [])

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value === 'yes' || value === 'no').length,
    [answers]
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)

    try {
      const result = await submitAssessment({
        platformName: platform.platformName,
        website: platform.website,
        answers,
      })
      // Replace rather than push: going "back" should return to the form, not
      // re-submit the assessment.
      navigate(`/result/${result.id}`, { replace: true, state: { result } })
    } catch (error) {
      setSubmitError(error.message)
      setIsSubmitting(false)
    }
  }

  // Landing here directly — by refreshing or pasting the URL — means there is
  // no platform to assess, so send the visitor back to the start.
  if (!platform?.website) {
    return <Navigate to="/check-investment" replace />
  }

  return (
    <>
      <Navbar />
      <main className="assessment-page">
        <div className="container assessment-page__inner">
          <PageHeader
            icon={ClipboardList}
            eyebrow="Step 2 of 2"
            title={platform.platformName}
            subtitle={displayWebsite(platform.website)}
          />

          <div className="assessment-page__layout">
            <div className="assessment-page__main">
              <FormCard as="form" onSubmit={handleSubmit} noValidate>
                <div className="assessment-page__intro">
                  <h2 className="assessment-page__questions-title">
                    What do you know about this platform?
                  </h2>
                  <p className="assessment-page__questions-lead">
                    Answer only what you are sure about. Choosing{' '}
                    <strong>Not sure</strong> is an honest answer. It lowers the confidence
                    shown with your result rather than making the platform look safer than it is.
                  </p>
                </div>

                {isLoadingQuestions && <PageLoader label="Loading questions" />}

                {questionsError && (
                  <Alert variant="error" title="The questions could not be loaded">
                    {questionsError}{' '}
                    <button type="button" className="assessment-page__retry" onClick={loadQuestions}>
                      Try again
                    </button>
                  </Alert>
                )}

                {!isLoadingQuestions && !questionsError && (
                  <>
                    <div className="assessment-page__questions">
                      {questions.map((question) => (
                        <ChoiceGroup
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          help={question.help}
                          value={answers[question.id]}
                          onChange={handleAnswer}
                        />
                      ))}
                    </div>

                    <div className="assessment-page__actions">
                      <p className="assessment-page__progress">
                        {answeredCount} of {questions.length} answered
                      </p>

                      {submitError && <Alert variant="error">{submitError}</Alert>}

                      <PrimaryButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Assessing…' : 'See the result'}
                        {!isSubmitting && <ArrowRight size={18} />}
                      </PrimaryButton>
                      <SecondaryButton to="/check-investment">
                        <RotateCcw size={16} /> Change platform
                      </SecondaryButton>
                    </div>
                  </>
                )}
              </FormCard>
            </div>

            <aside className="assessment-page__side">
              <TechnicalChecks
                osint={osint}
                isRunning={isCheckingWebsite}
                error={osintError}
              />
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Assessment
