import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import './NotFound.css'

// Catches any URL that doesn't match a defined route — including
// "/forgot-password", which is linked from the Login page but not built
// yet. Better to land here with a clear message than see a blank screen.
function NotFound() {
  return (
    <>
      <Navbar />
      <main className="not-found-page">
        <div className="container">
          <PageHeader
            eyebrow="Page not found"
            title="This page isn't built yet"
            subtitle="The page you're looking for doesn't exist yet, or is still under construction."
            centered
          />
          <div className="not-found-page__action">
            <PrimaryButton to="/">Return Home →</PrimaryButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default NotFound
