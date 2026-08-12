import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

// Primary navigation.
//
// Every destination here is a real route. An earlier version linked to pages
// that did not exist, and used bare anchors in the mobile menu — those resolve
// relative to the current path, so the same link behaved differently depending
// on which page it was tapped from.

const LINKS = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/report-platform', label: 'Report a platform' },
  { to: '/about', label: 'About' },
]

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Leaving the menu open across a navigation would cover the page the visitor
  // just asked for.
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const activeClass = ({ isActive }) => (isActive ? 'is-active' : undefined)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">
          <ShieldCheck size={22} strokeWidth={2.25} />
          <span>InvestiCheck</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={activeClass}>
              {link.label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink to="/admin" className={activeClass}>
              <LayoutDashboard size={15} /> Admin
            </NavLink>
          )}

          {isAuthenticated ? (
            <button type="button" className="navbar__signout" onClick={handleSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          ) : (
            <NavLink to="/login" className={activeClass}>
              Sign in
            </NavLink>
          )}

          <Link to="/check-investment" className="btn-primary navbar__cta">
            Check a platform
          </Link>
        </nav>

        <button
          type="button"
          className="navbar__hamburger"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMenuOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin">Admin</Link>}
          {isAuthenticated ? (
            <button type="button" className="navbar__signout" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
          <Link to="/check-investment" className="btn-primary">
            Check a platform
          </Link>
        </nav>
      )}
    </header>
  )
}

export default Navbar
