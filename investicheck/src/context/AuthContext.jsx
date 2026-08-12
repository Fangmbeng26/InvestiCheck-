import { createContext, useContext, useState } from 'react'
import api from '../Services/api.js'

const AuthContext = createContext(null)
const TOKEN_KEY = 'investicheck_token'
const USER_KEY = 'investicheck_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const persist = (data) => {
    setToken(data.token)
    setUser(data.user)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }

  const register = async ({ firstName, lastName, email, password, country }) => {
    const response = await api.post('/api/auth/signup', {
      firstName,
      lastName,
      email,
      password,
      country,
    })
    // Signup already returns a token, so registering logs the user in too.
    persist(response.data)
    return response.data
  }

  const login = async ({ email, password }) => {
    const response = await api.post('/api/auth/login', { email, password })
    persist(response.data)
    return response.data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    register,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return context
}
