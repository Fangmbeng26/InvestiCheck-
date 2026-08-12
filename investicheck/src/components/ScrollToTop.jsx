import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// A single-page app keeps the scroll position when the route changes, so
// moving from a long page to a new one can leave the visitor halfway down
// content they have not seen. Resetting on navigation restores the behaviour
// people expect from following a link.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export default ScrollToTop
