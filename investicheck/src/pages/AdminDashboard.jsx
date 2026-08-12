import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, LogOut, Check, X, Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import PageHeader from '../components/PageHeader.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import SecondaryButton from '../components/SecondaryButton.jsx'
import PrimaryButton from '../components/PrimaryButton.jsx'
import FormCard from '../components/form/FormCard.jsx'
import FormInput from '../components/form/FormInput.jsx'
import FormSelect from '../components/form/FormSelect.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../Services/api.js'
import './AdminDashboard.css'

const regulators = ['COSUMAF', 'MINFI', 'BEAC', 'other']

function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')

  const [pendingReports, setPendingReports] = useState([])
  const [reportsError, setReportsError] = useState('')

  const [watchlist, setWatchlist] = useState([])
  const [watchlistError, setWatchlistError] = useState('')
  const [newEntry, setNewEntry] = useState({
    entityName: '',
    regulator: '',
    sourceUrl: '',
    domains: '',
    notes: '',
  })
  const [watchlistFormError, setWatchlistFormError] = useState('')

  const loadStats = () => {
    api
      .get('/api/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setStatsError(err.response?.data?.message || 'Could not load statistics.'))
  }

  const loadPendingReports = () => {
    api
      .get('/api/admin/reports', { params: { status: 'pending', page: 1, limit: 20 } })
      .then((res) => setPendingReports(res.data.items))
      .catch((err) => setReportsError(err.response?.data?.message || 'Could not load reports.'))
  }

  const loadWatchlist = () => {
    api
      .get('/api/admin/watchlist')
      .then((res) => setWatchlist(res.data.items))
      .catch((err) => setWatchlistError(err.response?.data?.message || 'Could not load the watchlist.'))
  }

  useEffect(() => {
    loadStats()
    loadPendingReports()
    loadWatchlist()
  }, [])

  const handleModerate = async (reportId, status) => {
    try {
      await api.patch(`/api/admin/reports/${reportId}`, { status })
      // Remove it from the pending queue locally rather than refetching.
      setPendingReports((prev) => prev.filter((r) => r._id !== reportId))
    } catch (err) {
      setReportsError(err.response?.data?.message || 'Could not update that report.')
    }
  }

  const handleAddWatchlistEntry = async (event) => {
    event.preventDefault()
    setWatchlistFormError('')

    if (!newEntry.entityName.trim() || !newEntry.regulator || !newEntry.sourceUrl.trim()) {
      setWatchlistFormError('Entity name, regulator, and source URL are required.')
      return
    }

    try {
      const response = await api.post('/api/admin/watchlist', {
        entityName: newEntry.entityName,
        regulator: newEntry.regulator,
        sourceUrl: newEntry.sourceUrl,
        domains: newEntry.domains
          ? newEntry.domains.split(',').map((d) => d.trim()).filter(Boolean)
          : [],
        notes: newEntry.notes || undefined,
      })
      setWatchlist((prev) => [...prev, response.data.entry])
      setNewEntry({ entityName: '', regulator: '', sourceUrl: '', domains: '', notes: '' })
    } catch (err) {
      setWatchlistFormError(err.response?.data?.message || 'Could not add that entry.')
    }
  }

  const handleDeleteWatchlistEntry = async (id) => {
    try {
      await api.delete(`/api/admin/watchlist/${id}`)
      setWatchlist((prev) => prev.filter((entry) => entry._id !== id))
    } catch (err) {
      setWatchlistError(err.response?.data?.message || 'Could not remove that entry.')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <Navbar />
      <main className="admin-page">
        <div className="container">
          <div className="admin-page__header-row">
            <PageHeader
              icon={ShieldAlert}
              eyebrow="Administrator"
              title={user?.firstName ? `Admin Panel — ${user.firstName}` : 'Admin Panel'}
              subtitle="Report moderation and regulator watch-list management."
            />
            <SecondaryButton onClick={handleLogout}>
              <LogOut size={16} /> Log Out
            </SecondaryButton>
          </div>

          {/* ---------- Stats ---------- */}
          {statsError && <p className="admin-page__error">{statsError}</p>}
          {stats && (
            <div className="admin-stats">
              <div className="admin-stat">
                <p className="admin-stat__value">{stats.analyses.total}</p>
                <p className="admin-stat__label">Total Analyses</p>
              </div>
              <div className="admin-stat admin-stat--high">
                <p className="admin-stat__value">{stats.analyses.high}</p>
                <p className="admin-stat__label">High Risk</p>
              </div>
              <div className="admin-stat admin-stat--medium">
                <p className="admin-stat__value">{stats.analyses.medium}</p>
                <p className="admin-stat__label">Medium Risk</p>
              </div>
              <div className="admin-stat">
                <p className="admin-stat__value">{stats.reports.pending}</p>
                <p className="admin-stat__label">Pending Reports</p>
              </div>
              <div className="admin-stat">
                <p className="admin-stat__value">{stats.watchlistEntries}</p>
                <p className="admin-stat__label">Watch-list Entries</p>
              </div>
            </div>
          )}

          {stats?.frequentlyReportedPlatforms?.length > 0 && (
            <FormCard className="admin-section">
              <SectionTitle title="Frequently Reported Platforms" />
              <ul className="admin-simple-list">
                {stats.frequentlyReportedPlatforms.map((p) => (
                  <li key={p.domain}>
                    <span>{p.platformName || p.domain}</span>
                    <span className="admin-simple-list__meta">{p.reportCount} reviewed reports</span>
                  </li>
                ))}
              </ul>
            </FormCard>
          )}

          {/* ---------- Report moderation queue ---------- */}
          <FormCard className="admin-section">
            <SectionTitle
              title="Pending Reports"
              subtitle="Reports submitted by users, awaiting review before they can be used as corroborating evidence."
            />
            {reportsError && <p className="admin-page__error">{reportsError}</p>}
            {pendingReports.length === 0 ? (
              <p className="admin-empty">No reports are currently pending review.</p>
            ) : (
              <div className="admin-report-list">
                {pendingReports.map((report) => (
                  <div className="admin-report" key={report._id}>
                    <div>
                      <p className="admin-report__platform">{report.platformName}</p>
                      <p className="admin-report__meta">
                        {report.complaintType} — {report.website || 'no website given'}
                      </p>
                      <p className="admin-report__description">{report.description}</p>
                    </div>
                    <div className="admin-report__actions">
                      <button
                        type="button"
                        className="admin-report__approve"
                        onClick={() => handleModerate(report._id, 'reviewed')}
                      >
                        <Check size={15} /> Approve
                      </button>
                      <button
                        type="button"
                        className="admin-report__reject"
                        onClick={() => handleModerate(report._id, 'rejected')}
                      >
                        <X size={15} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </FormCard>

          {/* ---------- Watchlist management ---------- */}
          <FormCard className="admin-section">
            <SectionTitle
              title="Regulator Watch-list"
              subtitle="Entities publicly named by COSUMAF, MINFI, or BEAC as operating without authorisation."
            />
            {watchlistError && <p className="admin-page__error">{watchlistError}</p>}

            <ul className="admin-simple-list">
              {watchlist.map((entry) => (
                <li key={entry._id}>
                  <span>
                    {entry.entityName} <span className="admin-simple-list__meta">({entry.regulator})</span>
                  </span>
                  <button
                    type="button"
                    className="admin-watchlist__delete"
                    onClick={() => handleDeleteWatchlistEntry(entry._id)}
                    aria-label={`Remove ${entry.entityName}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>

            <form className="admin-watchlist-form" onSubmit={handleAddWatchlistEntry} noValidate>
              <h3>Add an Entry</h3>
              {watchlistFormError && <p className="admin-page__error">{watchlistFormError}</p>}
              <div className="admin-watchlist-form__row">
                <FormInput
                  id="entityName"
                  label="Entity Name"
                  value={newEntry.entityName}
                  onChange={(e) => setNewEntry((p) => ({ ...p, entityName: e.target.value }))}
                />
                <FormSelect
                  id="regulator"
                  label="Regulator"
                  options={regulators}
                  value={newEntry.regulator}
                  onChange={(e) => setNewEntry((p) => ({ ...p, regulator: e.target.value }))}
                />
              </div>
              <FormInput
                id="sourceUrl"
                label="Source URL"
                type="url"
                placeholder="https://..."
                value={newEntry.sourceUrl}
                onChange={(e) => setNewEntry((p) => ({ ...p, sourceUrl: e.target.value }))}
              />
              <FormInput
                id="domains"
                label="Known Domains"
                optional
                placeholder="comma-separated, e.g. example.com, example.net"
                value={newEntry.domains}
                onChange={(e) => setNewEntry((p) => ({ ...p, domains: e.target.value }))}
              />
              <PrimaryButton type="submit" className="admin-watchlist-form__submit">
                <Plus size={16} /> Add to Watch-list
              </PrimaryButton>
            </form>
          </FormCard>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default AdminDashboard
