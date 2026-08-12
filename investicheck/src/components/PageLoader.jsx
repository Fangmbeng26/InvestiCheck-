import { Loader2 } from 'lucide-react'
import './PageLoader.css'

// Placeholder for a screen that cannot render until data arrives.
// The label is announced politely so a screen-reader user is told the page is
// working rather than being met with silence.
function PageLoader({ label = 'Loading' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Loader2 size={26} className="page-loader__spinner" />
      <p className="page-loader__label">{label}…</p>
    </div>
  )
}

export default PageLoader
