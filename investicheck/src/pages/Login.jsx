import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormCheckbox from '../components/form/FormCheckbox.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthPage.css'


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Return the visitor to whatever they were trying to reach. Failing that,
  // administrators land on their dashboard and everyone else on the home page —
  // sending a general user to an admin-only route would bounce them straight
  // back out again.
  const redirectAfterSignIn = (user) =>
    location.state?.from ?? (user?.role === 'admin' ? '/admin' : '/')


  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitted('')

    if (!validate()) return

    setSubmitted(true)
    try{
      const user = await login({ email: formData.email, password: formData.password })
      navigate(redirectAfterSignIn(user), { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setSubmitted(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="container auth-page__inner">
          <PageHeader
            icon={LogIn}
            eyebrow="Administrator access"
            title="Sign in"
            subtitle="Accounts are for the team who review submitted reports and maintain the regulator watchlist. Checking a platform needs no account."
            centered
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <p className="auth-page__error">
                {serverError}
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
                label="Keep me signed in"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <Link to="/forgot-password" className="link-secondary auth-page__forgot">
                Forgot your password?
              </Link>
            </div>

            <PrimaryButton type="submit" className="auth-page__submit" disabled={submitted}>
              {submitted ? 'Signing in…' : 'Sign in'}
            </PrimaryButton>

            <p className="auth-page__switch">
              Need an account? <Link to="/signup">Create one</Link>
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Login
