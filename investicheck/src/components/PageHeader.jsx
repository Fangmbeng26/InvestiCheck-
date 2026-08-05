import './PageHeader.css'

// The "eyebrow label + big title + supporting sentence" block used at the
// top of nearly every page. icon and eyebrow are optional so this same
// component works for pages that don't need an eyebrow tag.
function PageHeader({ icon: Icon, eyebrow, title, subtitle, centered = false }) {
  return (
    <div className={`page-header ${centered ? 'page-header--centered' : ''}`}>
      {eyebrow && (
        <span className="section-eyebrow">
          {Icon && <Icon size={14} />}
          {eyebrow}
        </span>
      )}
      <h1 className="page-header__title">{title}</h1>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </div>
  )
}

export default PageHeader
