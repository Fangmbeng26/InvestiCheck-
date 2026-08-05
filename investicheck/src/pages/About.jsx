import { Target, Eye, TrendingUp, Building2, Clock3, Users, FileX } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import './About.css'

const warningSigns = [
  { icon: TrendingUp, text: 'Unrealistic returns' },
  { icon: Building2, text: 'Anonymous companies' },
  { icon: Clock3, text: 'Recently created websites' },
  { icon: Users, text: 'Referral-based investment schemes' },
  { icon: FileX, text: 'Missing company information' },
]

const steps = [
  { number: '01', title: 'Enter Platform Information', description: 'Provide the platform name, website, and any available company details.' },
  { number: '02', title: 'Analyze Available Indicators', description: 'InvestiCheck reviews the information for common warning signs.' },
  { number: '03', title: 'Generate a Risk Score', description: 'A risk score and risk level are calculated from the indicators found.' },
  { number: '04', title: 'Review the Detailed Report', description: 'See exactly which factors contributed to the score, in plain language.' },
]

function About() {
  return (
    <>
      <Navbar />
      <main className="about-page">
        <div className="container">
          <PageHeader
            eyebrow="About InvestiCheck"
            title="Built to help you think before you invest"
            subtitle="InvestiCheck exists to make investment scams easier to spot — before money changes hands, not after."
            centered
          />

          <div className="about-page__mission-grid">
            <div className="about-card">
              <div className="about-card__icon">
                <Target size={22} strokeWidth={2.25} />
              </div>
              <h3>Mission</h3>
              <p>
                Help people identify potentially fraudulent online investment platforms
                before investing.
              </p>
            </div>
            <div className="about-card">
              <div className="about-card__icon">
                <Eye size={22} strokeWidth={2.25} />
              </div>
              <h3>Vision</h3>
              <p>
                Create a safer online investment environment through transparency,
                education, and risk assessment.
              </p>
            </div>
          </div>

          <section className="about-section">
            <SectionTitle
              title="Why InvestiCheck?"
              subtitle="Online investment scams tend to repeat the same patterns. InvestiCheck is designed to help you recognize those patterns before they cost you money."
            />
            <div className="about-warnings">
              {warningSigns.map(({ icon: Icon, text }) => (
                <div className="about-warnings__item" key={text}>
                  <Icon size={18} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="about-section">
            <SectionTitle title="How the Platform Works" />
            <div className="about-steps">
              {steps.map((step) => (
                <div className="about-step-card" key={step.number}>
                  <span className="about-step-card__number">{step.number}</span>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="about-cta">
            <h2>Ready to check a platform?</h2>
            <p>Run an investment platform through InvestiCheck before you commit any money.</p>
            <PrimaryButton to="/check-investment">Check an Investment →</PrimaryButton>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default About
