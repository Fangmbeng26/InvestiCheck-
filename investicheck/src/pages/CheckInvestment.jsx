import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search, ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import { validateWebsite } from '../utils/website.js'
import './CheckInvestment.css'

// Step one of the assessment: identify the platform.
//
// Only two fields are asked here, even though the assessment needs more. The
// automated website checks take a couple of seconds, so the questions are
// deferred to the next screen where they can be answered while those checks
// run. Asking everything up front would mean a long form followed by a blank
// wait, instead of a short form followed by useful work.

function CheckInvestment() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ platformName: '', website: '' })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))

    // Clear the message once the user starts correcting the field. Leaving it
    // in place while they retype reads as though the new value is wrong too.
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: undefined }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}
    if (!values.platformName.trim()) {
      nextErrors.platformName = 'Enter the name of the platform.'
    }
    const websiteError = validateWebsite(values.website)
    if (websiteError) nextErrors.website = websiteError

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    navigate('/assessment', {
      state: { platformName: values.platformName.trim(), website: values.website.trim() },
    })
  }

  return (
    <>
      <Navbar />
      <main className="check-page">
        <div className="container check-page__inner">
          <PageHeader
            icon={Search}
            eyebrow="Step 1 of 2"
            title="Check an investment platform"
            subtitle="Tell us which platform you want to look into. We will check its website automatically, then ask you a few short questions about how it works."
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="platformName"
              name="platformName"
              label="Platform name"
              placeholder="For example, Sunrise Capital"
              value={values.platformName}
              onChange={handleChange}
              error={errors.platformName}
              autoComplete="off"
              autoFocus
            />

            <FormInput
              id="website"
              name="website"
              label="Website address"
              placeholder="example.com"
              value={values.website}
              onChange={handleChange}
              error={errors.website}
              autoComplete="off"
              inputMode="url"
            />
            <p className="check-page__hint">
              Paste the link exactly as you received it. There is no need to type
              &ldquo;https&rdquo; at the start.
            </p>

            <PrimaryButton type="submit" className="check-page__submit">
              Start the check <ArrowRight size={18} />
            </PrimaryButton>
          </FormCard>

          <aside className="check-page__assurance">
            <ShieldCheck size={18} />
            <p>
              No account is needed, and we never ask for your personal or banking details.
              InvestiCheck looks at the platform, not at you.
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default CheckInvestment
