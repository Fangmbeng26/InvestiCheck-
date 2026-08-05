import './FormCard.css'

// The white, rounded, shadowed card that wraps every form in the app
// (login, register, check-investment, contact). Previously this box style
// was written directly inside CheckInvestment.css as ".check-form" —
// pulling it out here means every new form gets the same card for free.
function FormCard({ children, as: Component = 'div', className = '', ...rest }) {
  return (
    <Component className={`form-card ${className}`.trim()} {...rest}>
      {children}
    </Component>
  )
}

export default FormCard
