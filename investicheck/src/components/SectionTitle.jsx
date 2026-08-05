import './SectionTitle.css'

// A mid-size heading used to label a block of content inside a page
// (e.g. "Mission", "How the Platform Works", "Website Analysis").
// This is smaller than PageHeader's title, which is reserved for the
// one big heading at the very top of a page.
function SectionTitle({ title, subtitle }) {
  return (
    <div className="section-title">
      <h2 className="section-title__heading">{title}</h2>
      {subtitle && <p className="section-title__subtitle">{subtitle}</p>}
    </div>
  )
}

export default SectionTitle
