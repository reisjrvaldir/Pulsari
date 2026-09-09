import { getSql } from './db.js'

/** Janela em que as falhas são contadas. */
export const WINDOW_MINUTES = 15

/** A partir daqui começa o bloqueio. */
export const FAILURE_THRESHOLD = 5

/** Teto do bloqueio progressivo. */
export const MAX_LOCKOUT_SECONDS = 60 * 60

/**
 * Bloqueio progressivo: 5 falhas → 1 min, 6 → 2 min, 7 → 4 min… até 1 hora.
 * Conta por e-mail e por IP separadamente e aplica o maior dos dois, para que
 * nem a força bruta numa conta nem a varredura de várias contas do mesmo IP
 * passem.
 */
export function lockoutSecondsFor(failures) {
  if (failures < FAILURE_THRESHOLD) return 0
  const seconds = 60 * 2 ** (failures - FAILURE_THRESHOLD)
  return Math.min(seconds, MAX_LOCKOUT_SECONDS)
}

export async function recordAttempt({ email, ip, successful }) {
  const sql = getSql()
  await sql`
    INSERT INTO login_attempts (email, ip, successful)
    VALUES (${email ?? null}, ${ip ?? null}, ${Boolean(successful)})
  `
}

/** Zera o histórico de falhas após um login bem-sucedido. */
export async function clearFailures({ email, ip }) {
  const sql = getSql()
  await sql`
    DELETE FROM login_attempts
     WHERE successful = false
       AND (lower(email) = lower(${email ?? ''}) OR ip = ${ip ?? ''})
  `
}

export async function checkLoginRateLimit({ email, ip }) {
  const sql = getSql()
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString()

  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE lower(email) = lower(${email ?? ''})) AS by_email,
      count(*) FILTER (WHERE ip = ${ip ?? ''})                     AS by_ip
    FROM login_attempts
   WHERE successful = false AND attempted_at > ${since}
  `

  const byEmail = Number(rows[0]?.by_email ?? 0)
  const byIp = Number(rows[0]?.by_ip ?? 0)
  const retryAfter = Math.max(lockoutSecondsFor(byEmail), lockoutSecondsFor(byIp))

  return { blocked: retryAfter > 0, retryAfter, failures: { byEmail, byIp } }
}
