import { Link } from 'react-router-dom'

// If a "to" prop is given, this renders a router Link (navigates to another
// page). Otherwise it renders a normal <button> (for form submits, or
// onClick actions that don't change the page). Same look either way.
function PrimaryButton({ to, children, className = '', ...rest }) {
  const classes = `btn-primary ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  )
}

export default PrimaryButton
