import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('restoran_user')
    const token = localStorage.getItem('restoran_token')
    if (stored && token) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  function login(userData, token) {
    localStorage.setItem('restoran_user', JSON.stringify(userData))
    localStorage.setItem('restoran_token', token)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('restoran_user')
    localStorage.removeItem('restoran_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export function getToken() {
  return localStorage.getItem('restoran_token')
}