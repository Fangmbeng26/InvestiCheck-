import { Lock } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FormCard from '../components/form/FormCard.jsx'
import './ContentPage.css'

// A plain-language account of what is stored and why.
//
// The product asks people to describe money they may have lost, so being
// specific about what is kept is part of earning that disclosure — and the
// collection here is deliberately narrow so there is little to describe.

function Privacy() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page__inner content-page__inner--narrow">
          <PageHeader
            icon={Lock}
            eyebrow="Privacy"
            title="What we keep, and what we do not"
            subtitle="InvestiCheck is built to need as little about you as possible."
          />

          <FormCard className="content-page__panel">
            <h2 className="content-page__panel-title">Checking a platform</h2>
            <p>
              You do not need an account to check a platform or to report one. We do not ask for
              your name, your phone number, or any banking detail, and we never ask you to sign in
              to an investment platform on our behalf.
            </p>
            <p>
              We store the platform name, its website address, the answers given, and the result.
              This record is about the platform, not about the person who looked it up.
            </p>
          </FormCard>

          <FormCard className="content-page__panel">
            <h2 className="content-page__panel-title">Reports you submit</h2>
            <p>
              A report is stored with the platform name, the category chosen and the description
              written. Please do not include passwords, bank details, or other people&apos;s
              personal information in that description.
            </p>
            <p>
              To stop one person flooding the system with false reports about a business, we store
              a one-way fingerprint of the network address a report came from. The address itself is
              not kept, and the fingerprint cannot be turned back into one.
            </p>
          </FormCard>

          <FormCard className="content-page__panel">
            <h2 className="content-page__panel-title">Accounts</h2>
            <p>
              Accounts exist only for the administrators who review reports. Passwords are stored as
              a one-way hash, never as text, and are never returned by the service once set.
            </p>
          </FormCard>

          <FormCard className="content-page__panel">
            <h2 className="content-page__panel-title">Your rights</h2>
            <p>
              Cameroon&apos;s Law No. 2024/017 of 23 December 2024 on personal data protection gives
              you rights over information held about you, including access and correction. To ask
              about anything held here, use the contact page.
            </p>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Privacy
