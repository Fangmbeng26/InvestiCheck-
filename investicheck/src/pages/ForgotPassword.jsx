import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import './AuthPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(false)

    if (!email.trim()) {
      setError('Email address is required.')
      return
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    setError('')
    setSubmitted(true)
  }

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="container auth-page__inner">
          <PageHeader
            icon={KeyRound}
            eyebrow="Reset your password"
            title="Forgot Password"
            subtitle="Enter your email and we'll send you a link to reset your password."
            centered
          />

          <FormCard as="form" onSubmit={handleSubmit} noValidate>
            {submitted ? (
              <p className="auth-page__success">
                If an account exists for {email}, a reset link has been sent. 
              </p>
            ) : (
              <FormInput
                id="email"
                name="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={error}
              />
            )}

            <PrimaryButton type="submit" className="auth-page__submit">
              Send Reset Link →
            </PrimaryButton>

            <p className="auth-page__switch">
              Remembered your password? <Link to="/login">Login</Link>
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default ForgotPassword
