import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="container navbar_inner">
        <Link to="/" className="navbar_logo" onClick={closeMenu}>
          <ShieldCheck size={22} strokeWidth={2.25} />
          <span>InvestiCheck</span>
        </Link>

        <nav className="navbar_links" aria-label="Primary">
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/about">About</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
              </Link>
              <button type="button" className="btn-primary navbar_cta" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign In</Link>
          <Link to="/signup" className="btn-primary_navbar__cta" onClick={closeMenu}>
            Get Started
          </Link>
          </>
          )}
        </nav>

        <button
          className="navbar_hamburger"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    
      {isMenuOpen && (
        <nav className="navbar_mobile-menu" aria-label="Mobile">
          <Link to="/how-it-works" onClick={closeMenu}>
            How It Works
          </Link>
          <Link to="/about" onClick={closeMenu}>
            About
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" onClick={closeMenu}>
                {user?.firstName ? `Hi, ${user.firstName}` : 'Dashboard'}
              </Link>
              <button type="button" className="btn-primary" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
          <Link to="/login" onClick={closeMenu}>
            Login
          </Link>
          <Link to="/signup" onClick={closeMenu}>
            SignUp
          </Link>
          <Link to="/get-started" className="btn-primary" onClick={closeMenu}>
            Get Started
          </Link>
          </>
          )}
        </nav>
      )}
    </header>
  )
}

export default Navbar
