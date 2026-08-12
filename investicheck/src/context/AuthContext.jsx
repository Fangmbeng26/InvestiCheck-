import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readStoredToken, storeToken } from '../services/apiClient.js'
import { fetchCurrentUser, signIn, signUp } from '../services/investicheckApi.js'

// Sign-in state is shared by the navigation bar, the route guards and the
// account pages, so it lives in context rather than being threaded through
// props or duplicated per screen.
//
// Deliberately, the assessment and reporting features do not consult this at
// all: they work for anonymous visitors. Accounts exist only for the admin
// tools, and requiring one to check a platform would put a barrier in front of
// exactly the people the product is meant to help.

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // A stored token proves nothing on its own — it may be expired or revoked.
  // The session is treated as unresolved until the server confirms it, so the
  // UI never flashes a signed-in state it then has to take away.
  const [isResolving, setIsResolving] = useState(Boolean(readStoredToken()))

  useEffect(() => {
    if (!readStoredToken()) return

    let cancelled = false

    fetchCurrentUser()
      .then(({ user: currentUser }) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch(() => {
        // The client already clears an unusable token; nothing more to do than
        // continue as a signed-out visitor.
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const applySession = useCallback((session) => {
    storeToken(session.token)
    setUser(session.user)
    return session.user
  }, [])

  const login = useCallback(
    async (credentials) => applySession(await signIn(credentials)),
    [applySession]
  )

  const register = useCallback(
    async (details) => applySession(await signUp(details)),
    [applySession]
  )

  const logout = useCallback(() => {
    storeToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isResolving,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, isResolving, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
