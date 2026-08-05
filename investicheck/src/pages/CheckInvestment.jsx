import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormSelect from '../components/form/FormSelect.jsx'
import FormTextArea from '../components/form/FormTextArea.jsx'
import './CheckInvestment.css'

const countries = ['Cameroon', 'Nigeria', 'Ghana', 'Kenya', 'Other']
const categories = ['Crypto', 'Forex', 'Real Estate', 'Trading', 'Savings', 'Crowdfunding', 'Other']
const durations = ['7 days', '30 days', '3 months', '6 months', '1 year']
const yesNo = ['Yes', 'No']

// Only these two fields are marked required in the brief (the rest are
// extra detail that helps the future scoring engine, but shouldn't block
// someone from starting an analysis with limited information).
function CheckInvestment() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    platformName: '',
    websiteUrl: '',
    companyName: '',
    country: '',
    category: '',
    promisedReturn: '',
    duration: '',
    minimumInvestment: '',
    referralRequired: '',
    guaranteedProfits: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.platformName.trim()) {
      nextErrors.platformName = 'Platform name is required.'
    }

    if (!formData.websiteUrl.trim()) {
      nextErrors.websiteUrl = 'Website URL is required.'
    } else {
      try {
        new URL(formData.websiteUrl)
      } catch {
        nextErrors.websiteUrl = 'Enter a valid URL, including https://'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validate()) return

    // No backend yet: the form data travels to the next page via router state.
    navigate('/analysis', { state: formData })
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
            subtitle="Enter the details of an investment platform to begin a risk assessment."
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            <FormInput
              id="platformName"
              name="platformName"
              label="Platform Name"
              placeholder="Enter the investment platform name"
              value={formData.platformName}
              onChange={handleChange}
              error={errors.platformName}
            />

            <FormInput
              id="websiteUrl"
              name="websiteUrl"
              label="Website URL"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={handleChange}
              error={errors.websiteUrl}
            />

            <FormInput
              id="companyName"
              name="companyName"
              label="Company Name"
              optional
              placeholder="Enter the registered company name"
              value={formData.companyName}
              onChange={handleChange}
            />

            <FormSelect
              id="country"
              name="country"
              label="Country of Operation"
              optional
              options={countries}
              value={formData.country}
              onChange={handleChange}
            />

            <FormSelect
              id="category"
              name="category"
              label="Investment Category"
              optional
              options={categories}
              value={formData.category}
              onChange={handleChange}
            />

            <FormInput
              id="promisedReturn"
              name="promisedReturn"
              label="Promised Return (%)"
              optional
              type="number"
              min="0"
              placeholder="e.g. 25"
              value={formData.promisedReturn}
              onChange={handleChange}
            />

            <FormSelect
              id="duration"
              name="duration"
              label="Investment Duration"
              optional
              options={durations}
              value={formData.duration}
              onChange={handleChange}
            />

            <FormInput
              id="minimumInvestment"
              name="minimumInvestment"
              label="Minimum Investment Amount"
              optional
              type="number"
              min="0"
              placeholder="e.g. 100"
              value={formData.minimumInvestment}
              onChange={handleChange}
            />

            <FormSelect
              id="referralRequired"
              name="referralRequired"
              label="Referral Required?"
              optional
              options={yesNo}
              value={formData.referralRequired}
              onChange={handleChange}
            />

            <FormSelect
              id="guaranteedProfits"
              name="guaranteedProfits"
              label="Can Profits Be Guaranteed?"
              optional
              options={yesNo}
              value={formData.guaranteedProfits}
              onChange={handleChange}
            />

            <FormTextArea
              id="notes"
              name="notes"
              label="Additional Notes"
              optional
              rows={4}
              placeholder="Anything else worth mentioning about this platform?"
              value={formData.notes}
              onChange={handleChange}
            />

            <PrimaryButton type="submit" className="check-page__submit">
              Start Analysis →
            </PrimaryButton>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default CheckInvestment
