import { beforeEach, describe, expect, it } from 'vitest'
import { __setSql } from '../api/_lib/db.js'
import { SESSION_COOKIE, generateToken, hashToken } from '../api/_lib/session.js'
import sessionRoute from '../api/auth/session.js'
import { createFakeSql } from './helpers/fakeSql.js'
import { mockReq, mockRes } from './helpers/http.js'

const USER = {
  id: 'u-1', name: 'Ana Souza', email: 'ana@pulsari.com.br',
  password_hash: 'scrypt$65536$8$1$YQ==$YQ==',
  role: 'manager', status: 'active', last_login_at: null,
}

let sql
let token

/** Cria uma sessão diretamente no banco falso, com validade configurável. */
function seedSession({ expiresInMs = 60_000, revoked = false, userId = 'u-1' } = {}) {
  token = generateToken()
  sql.__db.sessions.push({
    id: 'sess-1',
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + expiresInMs).toISOString(),
    revoked_at: revoked ? new Date().toISOString() : null,
    ip: '203.0.113.7',
    user_agent: 'vitest',
  })
  return token
}

const getSession = (cookie) => {
  const res = mockRes()
  return sessionRoute(mockReq({ method: 'GET', cookie }), res).then(() => res)
}

beforeEach(() => {
  sql = createFakeSql({ users: [{ ...USER }] })
  __setSql(sql)
})

describe('GET /api/auth/session', () => {
  it('devolve o usuário quando a sessão é válida', async () => {
    const t = seedSession()
    const res = await getSession(`${SESSION_COOKIE}=${t}`)

    expect(res.statusCode).toBe(200)
    expect(res.body.user).toMatchObject({
      id: 'u-1', email: 'ana@pulsari.com.br', role: 'manager',
    })
  })

  it('acesso sem login devolve 401', async () => {
    const res = await getSession(undefined)
    expect(res.statusCode).toBe(401)
    expect(res.body.error).toBe('Não autenticado')
  })

  it('cookie de outro nome não autentica', async () => {
    seedSession()
    const res = await getSession('outro_cookie=abc123')
    expect(res.statusCode).toBe(401)
  })

  it('token inventado devolve 401', async () => {
    seedSession()
    const res = await getSession(`${SESSION_COOKIE}=token-falsificado`)
    expect(res.statusCode).toBe(401)
  })

  it('sessão expirada devolve 401', async () => {
    const t = seedSession({ expiresInMs: -1000 })
    const res = await getSession(`${SESSION_COOKIE}=${t}`)
    expect(res.statusCode).toBe(401)
  })

  it('sessão revogada devolve 401', async () => {
    const t = seedSession({ revoked: true })
    const res = await getSession(`${SESSION_COOKIE}=${t}`)
    expect(res.statusCode).toBe(401)
  })

  it('desativar o usuário derruba a sessão na hora, sem esperar expirar', async () => {
    const t = seedSession({ expiresInMs: 12 * 60 * 60 * 1000 })

    expect((await getSession(`${SESSION_COOKIE}=${t}`)).statusCode).toBe(200)

    sql.__db.users[0].status = 'inactive'

    expect((await getSession(`${SESSION_COOKIE}=${t}`)).statusCode).toBe(401)
  })

  it('nunca expõe o hash da senha', async () => {
    const t = seedSession()
    const res = await getSession(`${SESSION_COOKIE}=${t}`)
    expect(JSON.stringify(res.body)).not.toContain('scrypt$')
  })

  it('recusa métodos que não sejam GET', async () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const res = mockRes()
      await sessionRoute(mockReq({ method }), res)
      expect(res.statusCode, method + ' deveria ser recusado').toBe(405)
    }
  })

  it('lê o cookie certo mesmo em meio a vários outros', async () => {
    const t = seedSession()
    const res = await getSession(`_ga=GA1.1.99; ${SESSION_COOKIE}=${t}; theme=dark`)
    expect(res.statusCode).toBe(200)
  })

  it('resposta de sessão não é cacheável', async () => {
    const t = seedSession()
    const res = await getSession(`${SESSION_COOKIE}=${t}`)
    expect(res.headers['cache-control']).toContain('no-store')
  })
})
