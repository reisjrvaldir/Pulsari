import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { getSql } from './db.js'

export const SESSION_COOKIE = 'pulsari_session'

/** Expiração absoluta. Não há renovação deslizante: 12h e o usuário reautentica. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000

const isProd = () => process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'

/**
 * O banco guarda apenas o SHA-256 do token. Um dump do banco não permite
 * sequestrar sessão nenhuma, porque o valor do cookie não está lá.
 * SHA-256 puro basta aqui (ao contrário de senha): o token tem 256 bits de
 * entropia real, então não há espaço de busca para força bruta.
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function generateToken() {
  return randomBytes(32).toString('base64url')
}

export async function createSession(userId, { ip, userAgent } = {}) {
  const sql = getSql()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at, ip, user_agent)
    VALUES (${userId}, ${hashToken(token)}, ${expiresAt.toISOString()}, ${ip ?? null}, ${userAgent ?? null})
  `
  return { token, expiresAt }
}

/**
 * Devolve o usuário da sessão, ou null. Recusa em quatro situações distintas:
 * sessão inexistente, revogada, expirada, ou dono da conta não mais ativo.
 * A checagem de status vive aqui de propósito: desativar um usuário derruba
 * as sessões dele na hora, sem esperar expirar.
 */
export async function getSessionUser(token) {
  if (!token || typeof token !== 'string') return null
  const sql = getSql()

  const rows = await sql`
    SELECT s.id   AS session_id,
           s.expires_at,
           s.revoked_at,
           u.id, u.name, u.email, u.role, u.status, u.last_login_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ${hashToken(token)}
     LIMIT 1
  `
  const row = rows[0]
  if (!row) return null
  if (row.revoked_at) return null
  if (new Date(row.expires_at).getTime() <= Date.now()) return null
  if (row.status !== 'active') return null

  return {
    sessionId: row.session_id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at,
  }
}

export async function revokeSession(token) {
  if (!token) return false
  const sql = getSql()
  const rows = await sql`
    UPDATE sessions SET revoked_at = now()
     WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
     RETURNING id
  `
  return rows.length > 0
}

/** Usado ao desativar um usuário: derruba todas as sessões dele de uma vez. */
export async function revokeAllUserSessions(userId) {
  const sql = getSql()
  const rows = await sql`
    UPDATE sessions SET revoked_at = now()
     WHERE user_id = ${userId} AND revoked_at IS NULL
     RETURNING id
  `
  return rows.length
}

export function buildSessionCookie(token, expiresAt) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
  if (isProd()) parts.push('Secure')
  return parts.join('; ')
}

export function buildClearCookie() {
  const parts = [
    `${SESSION_COOKIE}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
  ]
  if (isProd()) parts.push('Secure')
  return parts.join('; ')
}

export function readSessionCookie(req) {
  const header = req.headers?.cookie
  if (!header) return null
  for (const chunk of header.split(';')) {
    const idx = chunk.indexOf('=')
    if (idx === -1) continue
    if (chunk.slice(0, idx).trim() === SESSION_COOKIE) {
      return decodeURIComponent(chunk.slice(idx + 1).trim()) || null
    }
  }
  return null
}

/** Comparação sem vazar tempo, para quando for preciso comparar tokens. */
export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
