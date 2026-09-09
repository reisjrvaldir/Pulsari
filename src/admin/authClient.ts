/**
 * Cliente da API de autenticação.
 *
 * Nada de token no navegador: a sessão vive num cookie HttpOnly que o próprio
 * browser envia. Por isso não há `Authorization`, nem sessionStorage, nem
 * localStorage em lugar nenhum deste arquivo — é justamente o modelo que a
 * Sprint 01 veio substituir.
 */

export type Role = 'admin' | 'manager' | 'developer' | 'financial' | 'commercial'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'inactive' | 'suspended'
  lastLoginAt: string | null
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; error: string; retryAfter?: number }

const API = '/api/auth'

/** Same-origin: o cookie acompanha a requisição sem CORS no meio. */
const BASE: RequestInit = {
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
}

async function parse(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Devolve o usuário logado, ou null. 401 aqui é resposta esperada, não erro. */
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const res = await fetch(`${API}/session`, { ...BASE, method: 'GET' })
    if (!res.ok) return null
    const data = await parse(res)
    return (data.user as SessionUser) ?? null
  } catch {
    return null
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API}/login`, {
      ...BASE,
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await parse(res)

    if (res.ok && data.user) {
      return { ok: true, user: data.user as SessionUser }
    }

    return {
      ok: false,
      error: (data.error as string) ?? 'Não foi possível entrar. Tente novamente.',
      retryAfter: typeof data.retryAfter === 'number' ? data.retryAfter : undefined,
    }
  } catch {
    return { ok: false, error: 'Falha de conexão. Verifique sua internet.' }
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API}/logout`, { ...BASE, method: 'POST' })
  } catch {
    // Mesmo sem resposta do servidor, o front segue para a tela de login.
  }
}
