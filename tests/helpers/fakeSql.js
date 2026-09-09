/**
 * Dublê do cliente Neon.
 *
 * O driver é usado como tagged template — sql`SELECT ...` — então o dublê é uma
 * função que recebe (strings, ...valores), reconhece a consulta pelo texto e
 * responde a partir de um banco em memória. Assim os testes de rota exercitam
 * o handler de verdade, sem banco e sem rede.
 */
export function createFakeSql(seed = {}) {
  const db = {
    users: [...(seed.users ?? [])],
    sessions: [...(seed.sessions ?? [])],
    loginAttempts: [...(seed.loginAttempts ?? [])],
    projectMembers: [...(seed.projectMembers ?? [])],
  }

  const calls = []

  function run(strings, values) {
    const text = strings.join('?').replace(/\s+/g, ' ').trim()
    calls.push({ text, values })

    // --- users -------------------------------------------------------------
    if (text.includes('FROM users') && text.includes('lower(email)')) {
      const email = String(values[0] ?? '').toLowerCase()
      const found = db.users.find((u) => u.email.toLowerCase() === email)
      return found ? [{ ...found }] : []
    }

    if (text.startsWith('UPDATE users SET last_login_at')) {
      const user = db.users.find((u) => u.id === values[0])
      if (user) user.last_login_at = new Date().toISOString()
      return []
    }

    // --- sessions ----------------------------------------------------------
    if (text.startsWith('INSERT INTO sessions')) {
      const [user_id, token_hash, expires_at, ip, user_agent] = values
      db.sessions.push({
        id: `sess-${db.sessions.length + 1}`,
        user_id, token_hash, expires_at, ip, user_agent,
        revoked_at: null,
      })
      return []
    }

    if (text.includes('FROM sessions s') && text.includes('JOIN users u')) {
      const session = db.sessions.find((s) => s.token_hash === values[0])
      if (!session) return []
      const user = db.users.find((u) => u.id === session.user_id)
      if (!user) return []
      return [{
        session_id: session.id,
        expires_at: session.expires_at,
        revoked_at: session.revoked_at,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        last_login_at: user.last_login_at ?? null,
      }]
    }

    if (text.startsWith('UPDATE sessions SET revoked_at') && text.includes('token_hash')) {
      const session = db.sessions.find((s) => s.token_hash === values[0] && !s.revoked_at)
      if (!session) return []
      session.revoked_at = new Date().toISOString()
      return [{ id: session.id }]
    }

    if (text.startsWith('UPDATE sessions SET revoked_at') && text.includes('user_id')) {
      const hit = db.sessions.filter((s) => s.user_id === values[0] && !s.revoked_at)
      for (const s of hit) s.revoked_at = new Date().toISOString()
      return hit.map((s) => ({ id: s.id }))
    }

    // --- login_attempts ----------------------------------------------------
    if (text.startsWith('INSERT INTO login_attempts')) {
      const [email, ip, successful] = values
      db.loginAttempts.push({ email, ip, successful, attempted_at: new Date().toISOString() })
      return []
    }

    if (text.startsWith('DELETE FROM login_attempts')) {
      const [email, ip] = values
      const before = db.loginAttempts.length
      db.loginAttempts = db.loginAttempts.filter((a) => {
        if (a.successful) return true
        const matchEmail = String(a.email ?? '').toLowerCase() === String(email ?? '').toLowerCase()
        return !(matchEmail || a.ip === ip)
      })
      return [{ removed: before - db.loginAttempts.length }]
    }

    if (text.includes('FROM login_attempts') && text.includes('count(*)')) {
      const [email, ip, since] = values
      const cutoff = new Date(since).getTime()
      const recent = db.loginAttempts.filter(
        (a) => !a.successful && new Date(a.attempted_at).getTime() > cutoff,
      )
      return [{
        by_email: recent.filter((a) => String(a.email ?? '').toLowerCase() === String(email ?? '').toLowerCase()).length,
        by_ip: recent.filter((a) => a.ip === ip).length,
      }]
    }

    // --- project_members ---------------------------------------------------
    if (text.includes('FROM project_members')) {
      const [projectId, userId] = values
      const hit = db.projectMembers.some((m) => m.project_id === projectId && m.user_id === userId)
      return hit ? [{ '?column?': 1 }] : []
    }

    throw new Error(`fakeSql: consulta não reconhecida -> ${text}`)
  }

  const sql = (strings, ...values) => Promise.resolve(run(strings, values))
  sql.query = () => Promise.resolve([])
  sql.__db = db
  sql.__calls = calls
  return sql
}
