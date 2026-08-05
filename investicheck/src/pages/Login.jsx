import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormCheckbox from '../components/form/FormCheckbox.jsx'
import './AuthPage.css'

// A simple, reusable pattern for checking email shape. Not perfect (no
// regex catches every invalid email), but good enough for frontend validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.'
    } else if (!EMAIL_PATTERN.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

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
            icon={LogIn}
            eyebrow="Welcome back"
            title="Log in to InvestiCheck"
            subtitle="Access your saved reports and continue where you left off."
            centered
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            {submitted && (
              <p className="auth-page__success">
                Login form validated successfully. Backend sign-in isn't connected yet.
              </p>
            )}

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
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <div className="auth-page__row">
              <FormCheckbox
                id="rememberMe"
                name="rememberMe"
                label="Remind me"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <Link to="/forgot-password" className="link-secondary auth-page__forgot">
                Forgot Password?
              </Link>
            </div>

            <PrimaryButton type="submit" className="auth-page__submit">
              Login →
            </PrimaryButton>

            <p className="auth-page__switch">
              Don&apos;t have an account? <Link to="/register">Create Account</Link>
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Login
