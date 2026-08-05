import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import FeatureSection from '../components/FeatureSection.jsx'
import Footer from '../components/Footer.jsx'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureSection />
      </main>
      <Footer />
    </>
  )
}

export default Home
