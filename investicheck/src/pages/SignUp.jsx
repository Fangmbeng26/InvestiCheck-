import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EyeOff, UserPlus } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormSelect from '../components/form/FormSelect.jsx'
import FormCheckbox from '../components/form/FormCheckbox.jsx'
import './AuthPage.css'
import api from '../Services/api.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const countries = ['Cameroon', 'Nigeria', 'Ghana', 'Kenya', 'Other']

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    acceptTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const nextErrors = {}

    
    if (!formData.firstName.trim()) {
      nextErrors.firstName = 'First name is required.'
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = 'Last name is required.'
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.'
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    if (!formData.acceptTerms) {
      nextErrors.acceptTerms = 'You must accept the terms to continue.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(false)

    if (!validate()) return

    setSubmitted(true)
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="container auth-page__inner">
          <PageHeader
            icon={UserPlus}
            eyebrow="Get started"
            title="Create your account"
            subtitle="Join InvestiCheck to save reports and track platforms you've analyzed."
            centered
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>

            <FormInput
              id="firstName"
              name="firstName"
              label="First Name"
              placeholder="Enter your first name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
            />
            <FormInput
              id="lastName"
              name="lastName"
              label="Last Name"
              placeholder="Enter your last name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />

            <FormInput
              id="email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <FormInput
              id="password"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={20} /> : <UserPlus size={20} />} Password
            </button>

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <FormSelect
              id="country"
              name="country"
              label="Country"
              optional
              options={countries}
              value={formData.country}
              onChange={handleChange}
            />

            <FormCheckbox
              id="acceptTerms"
              name="acceptTerms"
              label="I accept the Terms of Service and Privacy Policy"
              checked={formData.acceptTerms}
              onChange={handleChange}
              error={errors.acceptTerms}
            />

            <PrimaryButton type="submit" className="auth-page__submit">
              Create Account →
            </PrimaryButton>

            <p className="auth-page__switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default SignUp
