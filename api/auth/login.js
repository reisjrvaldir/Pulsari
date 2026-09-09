import { getSql } from '../_lib/db.js'
import { DUMMY_HASH, verifyPassword } from '../_lib/password.js'
import { buildSessionCookie, createSession } from '../_lib/session.js'
import { checkLoginRateLimit, clearFailures, recordAttempt } from '../_lib/rateLimit.js'
import { getClientIp, guardMethod, json, readJsonBody, withErrorHandling } from '../_lib/http.js'

const INVALID = 'E-mail ou senha incorretos.'

async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const body = await readJsonBody(req)
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const ip = getClientIp(req)

  if (!email || !password) {
    return json(res, 400, { error: 'Informe e-mail e senha.' })
  }

  // 1) Rate limit antes de tocar em hash: força bruta não deve custar CPU.
  const limit = await checkLoginRateLimit({ email, ip })
  if (limit.blocked) {
    res.setHeader('Retry-After', String(limit.retryAfter))
    return json(res, 429, {
      error: 'Muitas tentativas. Tente novamente em instantes.',
      retryAfter: limit.retryAfter,
    })
  }

  const sql = getSql()
  const rows = await sql`
    SELECT id, name, email, password_hash, role, status
      FROM users
     WHERE lower(email) = lower(${email})
     LIMIT 1
  `
  const user = rows[0] ?? null

  // 2) Verifica a senha SEMPRE — inclusive contra um hash de descarte quando o
  //    e-mail não existe. Sem isso, o tempo de resposta revela quais contas
  //    existem. Também é por isso que o status só é checado depois: quem não
  //    sabe a senha não descobre se a conta existe nem se está desativada.
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH)

  if (!user || !ok) {
    await recordAttempt({ email, ip, successful: false })
    return json(res, 401, { error: INVALID })
  }

  if (user.status !== 'active') {
    await recordAttempt({ email, ip, successful: false })
    return json(res, 403, {
      error: 'Esta conta está desativada. Fale com um administrador.',
    })
  }

  // 3) Credencial válida: cria a sessão server-side e devolve só o cookie.
  const { token, expiresAt } = await createSession(user.id, {
    ip,
    userAgent: req.headers['user-agent'] ?? null,
  })

  await sql`UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = ${user.id}`

  await recordAttempt({ email, ip, successful: true })
  await clearFailures({ email, ip })

  res.setHeader('Set-Cookie', buildSessionCookie(token, expiresAt))

  return json(res, 200, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    expiresAt: expiresAt.toISOString(),
  })
}

export default withErrorHandling(handler)
