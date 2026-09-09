import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchSession, login as apiLogin, logout as apiLogout } from './authClient'
import type { LoginResult, SessionUser } from './authClient'
import { SessionContext } from './session-context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Ao montar, pergunta ao servidor quem está logado. O cookie é HttpOnly:
  // o front não tem como saber sozinho, e isso é intencional.
  useEffect(() => {
    let ativo = true
    fetchSession()
      .then((u) => { if (ativo) setUser(u) })
      .finally(() => { if (ativo) setLoading(false) })
    return () => { ativo = false }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await apiLogin(email, password)
    if (result.ok) setUser(result.user)
    return result
  }, [])

  const signOut = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
