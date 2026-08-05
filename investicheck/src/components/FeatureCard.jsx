import './FeatureCard.css'

// A small reusable card. It receives "props" (icon, title, description) from
// its parent (FeatureSection) so the same component can be reused 4 times
// with different content, instead of writing 4 near-identical blocks of JSX.
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon">
        <Icon size={22} strokeWidth={2} />
      </div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
    </div>
  )
}

export default FeatureCard
