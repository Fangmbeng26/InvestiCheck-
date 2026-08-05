import { Link } from 'react-router-dom'

// The lower-emphasis counterpart to PrimaryButton — a bordered button
// instead of a solid navy one. Used for actions like "View Detailed Report"
// or "Return Home" that shouldn't compete visually with the main action.
function SecondaryButton({ to, children, className = '', ...rest }) {
  const classes = `btn-secondary ${className}`.trim()

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

export default SecondaryButton
