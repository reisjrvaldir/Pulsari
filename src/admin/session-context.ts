import { createContext, useContext } from 'react'
import type { LoginResult, SessionUser } from './authClient'

export interface SessionState {
  user: SessionUser | null
  /** true enquanto a sessão inicial ainda não foi resolvida. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<LoginResult>
  signOut: () => Promise<void>
}

export const SessionContext = createContext<SessionState | null>(null)

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession precisa estar dentro de <SessionProvider>')
  return ctx
}
