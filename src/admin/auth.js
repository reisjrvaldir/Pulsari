const SESSION_KEY = 'pulsari_admin_session'
const API = import.meta.env.VITE_API_URL || '/api'

/* Login via servidor — credenciais nunca ficam no frontend */
export const login = async (email, pass) => {
  try {
    const res = await fetch(`${API}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pass }),
    })
    const data = await res.json()
    if (res.ok && data.ok) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, ts: Date.now() }))
      return true
    }
    return false
  } catch {
    return false
  }
}

export const logout = () => sessionStorage.removeItem(SESSION_KEY)

export const isAuthenticated = () => {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return false
  try {
    const { ts } = JSON.parse(raw)
    return Date.now() - ts < 8 * 60 * 60 * 1000   // expira em 8h
  } catch { return false }
}
