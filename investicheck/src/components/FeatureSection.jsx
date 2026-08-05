import { Globe, ShieldAlert, BadgeCheck, MessageSquareText } from 'lucide-react'
import FeatureCard from './FeatureCard.jsx'
import './FeatureSection.css'

const features = [
  {
    icon: Globe,
    title: 'Website Analysis',
    description: 'Analyze basic website and domain indicators.',
  },
  {
    icon: ShieldAlert,
    title: 'Risk Detection',
    description: 'Identify common investment scam warning signs.',
  },
  {
    icon: BadgeCheck,
    title: 'Platform Verification',
    description: 'Check available company and platform information.',
  },
  {
    icon: MessageSquareText,
    title: 'Clear Explanations',
    description: 'Understand why an investment platform may be considered risky.',
  },
]

function FeatureSection() {
  return (
    <section className="feature-section" id="how-it-works">
      <div className="container">
        <div className="feature-section__header">
          <span className="section-eyebrow">What InvestiCheck does</span>
          <h2 className="feature-section__title">
            Built to spot the signs before you commit
          </h2>
        </div>

        <div className="feature-section__grid">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeatureSection
