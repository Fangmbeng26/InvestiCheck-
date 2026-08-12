import { Link } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import Alert from '../components/Alert.jsx'
import './AuthPage.css'

// Self-service password reset is not built yet: it needs an email service and
// a token flow that the service does not currently have.
//
// The earlier version of this page accepted an address and replied that a
// reset link had been sent. Nothing was ever sent, so anyone who used it would
// wait for an email that could not arrive. Saying plainly that the feature is
// unavailable is less convenient and considerably more useful.

function ForgotPassword() {
  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="container auth-page__inner">
          <PageHeader
            icon={KeyRound}
            eyebrow="Account help"
            title="Resetting your password"
            subtitle="Accounts on InvestiCheck are only used by administrators who review reports."
            centered
          />

          <FormCard>
            <Alert variant="info" title="Password reset is not available yet">
              We cannot send reset emails at the moment. To regain access to an administrator
              account, ask whoever maintains this installation to reset it for you directly.
            </Alert>

            <p className="auth-page__note">
              If you were trying to check an investment platform, you do not need an account at
              all. The assessment and reporting tools are open to everyone.
            </p>

            <div className="auth-page__actions">
              <SecondaryButton to="/check-investment">Check a platform</SecondaryButton>
            </div>

            <p className="auth-page__switch">
              Remembered your password? <Link to="/login">Sign in</Link>
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default ForgotPassword
