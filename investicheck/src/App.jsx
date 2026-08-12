import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Privacy from './pages/Privacy.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import CheckInvestment from './pages/CheckInvestment.jsx'
import Assessment from './pages/Assessment.jsx'
import RiskResult from './pages/RiskResult.jsx'
import AssessmentDetails from './pages/AssessmentDetails.jsx'
import ReportPlatform from './pages/ReportPlatform.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import NotFound from './pages/NotFound.jsx'

// Paths describe what the visitor is doing rather than which component
// renders, so a link still reads sensibly when shared or seen in the address
// bar. Results are addressable by id for the same reason — an assessment is
// something people will want to send to someone else.
function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/check-investment" element={<CheckInvestment />} />
        <Route path="/assessment" element={<Assessment />} />
        <Route path="/result/:id" element={<RiskResult />} />
        <Route path="/result/:id/details" element={<AssessmentDetails />} />

        <Route path="/report-platform" element={<ReportPlatform />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Paths used by earlier drafts, redirected so existing links and
            bookmarks land somewhere useful instead of on the 404 page. */}
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/signup" replace />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/analysis" element={<Navigate to="/check-investment" replace />} />
        <Route path="/risk-result" element={<Navigate to="/check-investment" replace />} />
        <Route path="/report" element={<Navigate to="/report-platform" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
