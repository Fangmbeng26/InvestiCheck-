import { ShieldCheck, FileText, Star, Search, FolderOpen, Settings } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import './Dashboard.css'

const stats = [
  { icon: ShieldCheck, label: 'Platforms Analyzed', value: '12' },
  { icon: FileText, label: 'Saved Reports', value: '5' },
  { icon: Star, label: 'Favorite Platforms', value: '3' },
]

const recentAnalyses = [
  { name: 'ABC Investment', level: 'high', score: 78 },
  { name: 'Northgate Capital', level: 'moderate', score: 52 },
  { name: 'Sunrise Trading Co.', level: 'low', score: 21 },
]

const savedReports = ['ABC Investment — Full Report', 'Northgate Capital — Full Report']

const favoritePlatforms = ['Sunrise Trading Co.', 'Coastal Yield Partners']

function Dashboard() {
  return (
    <>
      <Navbar />
      <main className="dashboard-page">
        <div className="container">
          <PageHeader
            eyebrow="Your Dashboard"
            title="Welcome back"
            subtitle="This is placeholder data — real accounts and saved history will appear here once sign-in is connected."
          />

          <div className="dashboard-stats">
            {stats.map(({ icon: Icon, label, value }) => (
              <div className="dashboard-stat" key={label}>
                <div className="dashboard-stat__icon">
                  <Icon size={20} />
                </div>
                <div>
                  <p className="dashboard-stat__value">{value}</p>
                  <p className="dashboard-stat__label">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <FormCard className="dashboard-block">
              <SectionTitle title="Recent Analyses" />
              <ul className="dashboard-list">
                {recentAnalyses.map((item) => (
                  <li key={item.name}>
                    <span>{item.name}</span>
                    <span className={`risk-badge risk-badge--${item.level}`}>{item.score}/100</span>
                  </li>
                ))}
              </ul>
            </FormCard>

            <FormCard className="dashboard-block">
              <SectionTitle title="Saved Reports" />
              <ul className="dashboard-list dashboard-list--plain">
                {savedReports.map((item) => (
                  <li key={item}>
                    <FileText size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FormCard>

            <FormCard className="dashboard-block">
              <SectionTitle title="Favorite Platforms" />
              <ul className="dashboard-list dashboard-list--plain">
                {favoritePlatforms.map((item) => (
                  <li key={item}>
                    <Star size={16} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </FormCard>
          </div>

          <section className="dashboard-actions">
            <SectionTitle title="Quick Actions" />
            <div className="dashboard-actions__row">
              <PrimaryButton to="/check-investment">
                <Search size={16} /> Analyze New Platform
              </PrimaryButton>
              <SecondaryButton to="/report">
                <FolderOpen size={16} /> View Reports
              </SecondaryButton>
              <SecondaryButton to="/register">
                <Settings size={16} /> Account Settings
              </SecondaryButton>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default Dashboard
