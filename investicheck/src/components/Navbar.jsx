import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, ShieldCheck } from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen((prev) => !prev)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          <ShieldCheck size={22} strokeWidth={2.25} />
          <span>InvestiCheck</span>
        </Link>

        <nav className="navbar__links" aria-label="Primary">
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/about">About</Link>
          <Link to="/login">Login</Link>
          <Link to="/signup">Sign Up</Link>
          <Link to="/signup" className="btn-primary navbar__cta" onClick={closeMenu}>
            Get Started
          </Link>
        </nav>

        <button
          className="navbar__hamburger"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

    
      {isMenuOpen && (
        <nav className="navbar__mobile-menu" aria-label="Mobile">
          <Link to="/how-it-works" onClick={closeMenu}>
            How It Works
          </Link>
          <Link to="/about" onClick={closeMenu}>
            About
          </Link>
          <Link to="/login" onClick={closeMenu}>
            Login
          </Link>
          <Link to="/signup" onClick={closeMenu}>
            SignUp
          </Link>
          <Link to="/get-started" className="btn-primary" onClick={closeMenu}>
            Get Started
          </Link>
        </nav>
      )}
    </header>
  )
}

export default Navbar
