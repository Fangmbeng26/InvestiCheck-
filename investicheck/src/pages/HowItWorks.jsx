import { ClipboardList, Gauge, Globe, Scale, Search, ShieldQuestion } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import './ContentPage.css'

// Explains the method before anyone relies on a result.
//
// Setting expectations here is part of the product, not marketing copy: a
// score presented without its limits invites people to read it as a verdict,
// which is the one thing this tool must not be taken to give.

const STEPS = [
  {
    icon: Search,
    title: 'You name the platform',
    body: 'Just the name and the website address. No account, and nothing about you.',
  },
  {
    icon: Globe,
    title: 'We check the website automatically',
    body: 'How long the domain has existed, who registered it, whether the site responds, and whether its security certificate is genuine.',
  },
  {
    icon: ClipboardList,
    title: 'You answer a few questions',
    body: 'How the platform says you make money: guaranteed returns, referral rewards, daily tasks, and whether people have had trouble withdrawing.',
  },
  {
    icon: Gauge,
    title: 'You get a score and the reasons behind it',
    body: 'A rating out of 100, the level of risk, every finding that contributed, and how confident the result is.',
  },
]

function HowItWorks() {
  return (
    <>
      <Navbar />
      <main className="content-page">
        <div className="container content-page__inner">
          <PageHeader
            icon={ShieldQuestion}
            eyebrow="How it works"
            title="Four steps, about two minutes"
            subtitle="InvestiCheck brings together what can be found publicly about a platform's website and what you already know about how it operates."
          />

          <ol className="how-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <li className="how-step" key={step.title}>
                  <span className="how-step__number">{index + 1}</span>
                  <div className="how-step__icon">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h2 className="how-step__title">{step.title}</h2>
                    <p className="how-step__body">{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <FormCard className="content-page__panel">
            <h2 className="content-page__panel-title">
              <Scale size={18} /> What the score does and does not mean
            </h2>
            <p>
              A high score means a platform shows several of the patterns that have accompanied
              investment fraud elsewhere. It is a reason to look harder before parting with money,
              not a finding that the platform is fraudulent, and not financial or legal advice.
            </p>
            <p>
              A low score is equally limited. It means few warning signs were visible from the
              information available, which is not the same as a platform being safe. Some schemes
              run for years before they fail.
            </p>
            <p>
              Where too little could be established, InvestiCheck says so instead of reporting low
              risk. A reassuring number drawn from almost no evidence would be worse than no answer
              at all.
            </p>
          </FormCard>

          <div className="content-page__cta">
            <PrimaryButton to="/check-investment">Check a platform</PrimaryButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default HowItWorks
