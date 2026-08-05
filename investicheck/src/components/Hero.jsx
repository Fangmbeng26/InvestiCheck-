import RiskPreviewCard from './RiskPreviewCard.jsx'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <h1 className="hero__headline">Know the risk before you invest.</h1>
          <p className="hero__description">
            Analyze investment platforms, identify warning signs, and make more
            informed decisions before committing your money.
          </p>
          <div className="hero__actions">
            <a href="/check-investment" className="btn-primary">
              Check an Investment →
            </a>
            <a href="how-it-works" className="link-secondary">
              How It Works
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <RiskPreviewCard />
        </div>
      </div>
    </section>
  )
}

export default Hero
