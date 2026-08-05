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
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
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
