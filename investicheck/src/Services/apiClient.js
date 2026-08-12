import axios from 'axios'

// One configured axios instance for the whole app, so authentication and error
// shape are handled once rather than at every call site.
//
// The base URL comes from the environment because the API host differs between
// local development and any deployed build. Vite only exposes variables
// prefixed with VITE_, and everything it exposes ends up in the public bundle —
// so this may hold a host name, never a secret.

const STORAGE_KEY = 'investicheck_token'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const readStoredToken = () => localStorage.getItem(STORAGE_KEY)

export const storeToken = (token) => {
  if (token) localStorage.setItem(STORAGE_KEY, token)
  else localStorage.removeItem(STORAGE_KEY)
}

// Read the token per-request rather than once at module load, so a sign-in
// during the session takes effect immediately.
apiClient.interceptors.request.use((config) => {
  const token = readStoredToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * The error shape every screen can rely on.
 * Components should render `message` and, where a form is involved, map
 * `fieldErrors` onto the matching inputs.
 */
export class ApiError extends Error {
  constructor({ message, status, fieldErrors, isNetworkError }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors ?? {}
    this.isNetworkError = Boolean(isNetworkError)
  }
}

// Turn every failure — network, validation, auth, server — into a single
// predictable shape. Without this each screen would have to know the API's
// internal error format, and an offline browser would surface as a confusing
// "undefined" instead of something a user can act on.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new ApiError({
          message:
            'Could not reach the InvestiCheck service. Check your connection and try again.',
          isNetworkError: true,
        })
      )
    }

    const { status, data } = error.response

    // The API returns validation problems as a list of { field, message }.
    // Collapsing them into an object lets forms look up errors by field name.
    const fieldErrors = Array.isArray(data?.details)
      ? Object.fromEntries(data.details.map((detail) => [detail.field, detail.message]))
      : {}

    // An expired or revoked token should not leave the app in a half-signed-in
    // state where every subsequent request fails the same way.
    if (status === 401) storeToken(null)

    return Promise.reject(
      new ApiError({
        message: data?.error ?? 'Something went wrong. Please try again.',
        status,
        fieldErrors,
      })
    )
  }
)

export default apiClient
