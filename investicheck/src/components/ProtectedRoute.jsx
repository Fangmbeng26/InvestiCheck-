import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import PageLoader from './PageLoader.jsx'

/**
 * Gate for pages that require a signed-in user, optionally an administrator.
 *
 * This is a usability measure, not the security boundary — the API enforces
 * the same rules independently, since anything the browser decides can be
 * bypassed. Its job is to avoid showing a page that is guaranteed to fail.
 */
function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin, isResolving } = useAuth()
  const location = useLocation()

  // Redirecting before the stored session has been checked would bounce a
  // legitimately signed-in user out on every page refresh.
  if (isResolving) return <PageLoader label="Checking your session" />

  if (!isAuthenticated) {
    // Remember where they were headed so sign-in can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
