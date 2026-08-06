import { ShieldCheck } from 'lucide-react'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="container footer__inner">
        <div className="footer__brand">
          <div className="footer__logo">
            <ShieldCheck size={20} strokeWidth={2.25} />
            <span>InvestiCheck</span>
          </div>
          <p className="footer__tagline">
            Helping users make more informed investment decisions.
          </p>
        </div>

        <nav className="footer__links" aria-label="Footer">
          <Link to="/how-it-works">How It Works</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>
      </div>

      <div className="container">
        <p className="footer__copyright">
          © {new Date().getFullYear()} InvestiCheck. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
