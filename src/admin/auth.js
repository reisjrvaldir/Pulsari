const SESSION_KEY = 'pulsari_admin_session'

export const login = (email, pass) => {
  const okEmail = import.meta.env.VITE_ADMIN_EMAIL
  const okPass  = import.meta.env.VITE_ADMIN_PASS
  if (email.trim() === okEmail && pass === okPass) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, ts: Date.now() }))
    return true
  }
  return false
}

export const logout = () => sessionStorage.removeItem(SESSION_KEY)

export const isAuthenticated = () => {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return false
  try {
    const { ts } = JSON.parse(raw)
    // sessão expira em 8h
    return Date.now() - ts < 8 * 60 * 60 * 1000
  } catch { return false }
}
