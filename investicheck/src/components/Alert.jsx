import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import './Alert.css'

// One component for every inline message the app shows, so success, failure
// and caution look consistent wherever they appear.
//
// Error alerts announce themselves to assistive technology, because a failed
// submit usually leaves focus on the button and a silent message would go
// unnoticed by screen-reader users.

const VARIANTS = {
  info: { icon: Info, role: 'status' },
  success: { icon: CheckCircle2, role: 'status' },
  warning: { icon: AlertTriangle, role: 'status' },
  error: { icon: XCircle, role: 'alert' },
}

function Alert({ variant = 'info', title, children, className = '' }) {
  const { icon: Icon, role } = VARIANTS[variant] ?? VARIANTS.info

  return (
    <div className={`alert alert--${variant} ${className}`.trim()} role={role}>
      <Icon size={18} className="alert__icon" />
      <div className="alert__body">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__message">{children}</div>}
      </div>
    </div>
  )
}

export default Alert
