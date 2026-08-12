import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2, Flag } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormSelect from '../components/form/FormSelect.jsx'
import FormTextArea from '../components/form/FormTextArea.jsx'
import Alert from '../components/Alert.jsx'
import { fetchComplaintTypes, submitReport } from '../Services/investicheckApi.js'
import './ReportPlatform.css'

// Lets someone describe what happened to them on a platform.
//
// Submissions are held for review before they influence anything public. This
// form accepts anonymous claims about named businesses, so publishing them
// unchecked would make the feature easy to abuse — the wait is deliberate, and
// saying so on the confirmation screen sets the right expectation.

function ReportPlatform() {
  const location = useLocation()

  // Arriving from a result page carries the platform across, so nobody has to
  // retype what they just looked up.
  const [values, setValues] = useState({
    platformName: location.state?.platformName ?? '',
    website: location.state?.website ?? '',
    complaintType: '',
    description: '',
  })

  const [complaintTypes, setComplaintTypes] = useState([])
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    fetchComplaintTypes()
      .then((data) => setComplaintTypes(data.complaintTypes))
      .catch(() => {
        // The categories are a convenience, not a blocker. If they cannot be
        // fetched the field simply stays empty and the server validates.
        setComplaintTypes([])
      })
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    if (errors[name]) setErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')

    const nextErrors = {}
    if (!values.platformName.trim()) nextErrors.platformName = 'Enter the platform name.'
    if (!values.complaintType) nextErrors.complaintType = 'Choose what happened.'
    if (values.description.trim().length < 10) {
      nextErrors.description = 'Please describe what happened in a little more detail.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await submitReport({
        platformName: values.platformName.trim(),
        website: values.website.trim() || undefined,
        complaintType: values.complaintType,
        description: values.description.trim(),
      })
      setIsSubmitted(true)
    } catch (error) {
      setSubmitError(error.message)
      setErrors(error.fieldErrors ?? {})
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <main className="report-platform-page">
          <div className="container report-platform-page__narrow">
            <div className="report-platform-page__confirmation">
              <span className="report-platform-page__tick">
                <CheckCircle2 size={30} />
              </span>
              <h1>Thank you for reporting this</h1>
              <p>
                Your report has been received and is waiting to be reviewed. Reports are checked
                before they count towards a platform&apos;s risk assessment, so it will not appear
                straight away.
              </p>
              <p className="report-platform-page__followup">
                If you have lost money, consider also reporting the platform to the Ministry of
                Finance or to COSUMAF, the financial market regulator for the CEMAC region.
              </p>
              <div className="report-platform-page__confirmation-actions">
                <PrimaryButton to="/check-investment">Check another platform</PrimaryButton>
                <SecondaryButton to="/">Return home</SecondaryButton>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="report-platform-page">
        <div className="container report-platform-page__inner">
          <PageHeader
            icon={Flag}
            eyebrow="Report a platform"
            title="Tell us what happened"
            subtitle="Your experience helps warn other people. You do not need an account, and we do not ask who you are."
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            {submitError && <Alert variant="error">{submitError}</Alert>}

            <FormInput
              id="platformName"
              name="platformName"
              label="Platform name"
              placeholder="For example, Sunrise Capital"
              value={values.platformName}
              onChange={handleChange}
              error={errors.platformName}
            />

            <FormInput
              id="website"
              name="website"
              label="Website address"
              optional
              placeholder="example.com"
              value={values.website}
              onChange={handleChange}
              error={errors.website}
              inputMode="url"
            />

            <FormSelect
              id="complaintType"
              name="complaintType"
              label="What happened?"
              placeholder="Choose the closest description"
              options={complaintTypes.map((type) => type.label)}
              value={complaintTypes.find((type) => type.value === values.complaintType)?.label ?? ''}
              onChange={(event) => {
                const chosen = complaintTypes.find((type) => type.label === event.target.value)
                setValues((previous) => ({ ...previous, complaintType: chosen?.value ?? '' }))
                setErrors((previous) => ({ ...previous, complaintType: undefined }))
              }}
              error={errors.complaintType}
            />

            <FormTextArea
              id="description"
              name="description"
              label="Describe your experience"
              rows={6}
              placeholder="What were you promised, what did you do, and what went wrong? Dates and amounts are helpful if you have them."
              value={values.description}
              onChange={handleChange}
              error={errors.description}
            />

            <p className="report-platform-page__privacy">
              Please do not include your bank details, passwords, or anyone else&apos;s personal
              information in your description.
            </p>

            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Submit report'}
            </PrimaryButton>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default ReportPlatform
