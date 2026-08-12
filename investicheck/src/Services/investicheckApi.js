import apiClient from './apiClient.js'

// Every network call the app makes, named after what it means to the product
// rather than after its URL. Screens import from here so that a change to a
// route or payload shape is a one-file edit instead of a hunt through JSX.

const unwrap = (promise) => promise.then((response) => response.data)

/* ---------------------------------- Assessment --------------------------- */

/**
 * The questions to put to the user, plus the risk bands used to label a score.
 * Fetched rather than hardcoded: the scoring weights live in the engine, and a
 * second copy in the UI would silently drift out of step with it.
 */
export const fetchIndicators = () => unwrap(apiClient.get('/api/analysis/indicators'))

/**
 * Technical checks only — domain records, DNS, certificate, reachability.
 * Runs while the user is still answering questions so the wait is spent on
 * something useful instead of a blank progress bar.
 */
export const runTechnicalChecks = (website) =>
  unwrap(apiClient.post('/api/analysis/osint', { website }))

export const submitAssessment = ({ platformName, website, answers }) =>
  unwrap(apiClient.post('/api/analysis', { platformName, website, answers }))

export const fetchAssessment = (id) => unwrap(apiClient.get(`/api/analysis/${id}`))

/* ----------------------------------- Reports ----------------------------- */

export const fetchComplaintTypes = () => unwrap(apiClient.get('/api/reports/complaint-types'))

export const submitReport = (report) => unwrap(apiClient.post('/api/reports', report))

/* ------------------------------------ Auth ------------------------------- */

export const signUp = (details) => unwrap(apiClient.post('/api/auth/signup', details))

export const signIn = (credentials) => unwrap(apiClient.post('/api/auth/login', credentials))

export const fetchCurrentUser = () => unwrap(apiClient.get('/api/auth/me'))

/* ------------------------------------ Admin ------------------------------ */

export const fetchAdminStats = () => unwrap(apiClient.get('/api/admin/stats'))

export const fetchAdminReports = (params) =>
  unwrap(apiClient.get('/api/admin/reports', { params }))

export const moderateReport = (id, decision) =>
  unwrap(apiClient.patch(`/api/admin/reports/${id}`, decision))

export const fetchAdminAssessments = (params) =>
  unwrap(apiClient.get('/api/admin/analyses', { params }))

export const fetchWatchlist = () => unwrap(apiClient.get('/api/admin/watchlist'))

export const addWatchlistEntry = (entry) => unwrap(apiClient.post('/api/admin/watchlist', entry))

export const removeWatchlistEntry = (id) => unwrap(apiClient.delete(`/api/admin/watchlist/${id}`))
