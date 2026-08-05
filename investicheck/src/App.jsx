import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import Contact from './pages/Contact.jsx'
import CheckInvestment from './pages/CheckInvestment.jsx'
import Analysis from './pages/Analysis.jsx'
import RiskResult from './pages/RiskResult.jsx'
import Report from './pages/Report.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/check-investment" element={<CheckInvestment />} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/risk-result" element={<RiskResult />} />
      <Route path="/report" element={<Report />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
