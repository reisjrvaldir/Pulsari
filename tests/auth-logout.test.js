import { beforeEach, describe, expect, it } from 'vitest'
import { __setSql } from '../api/_lib/db.js'
import { SESSION_COOKIE, generateToken, hashToken } from '../api/_lib/session.js'
import logout from '../api/auth/logout.js'
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

beforeEach(() => {
  sql = createFakeSql({ users: [{ ...USER }] })
  __setSql(sql)

  token = generateToken()
  sql.__db.sessions.push({
    id: 'sess-1',
    user_id: 'u-1',
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    revoked_at: null,
  })
})

const postLogout = (cookie) => {
  const res = mockRes()
  return logout(mockReq({ method: 'POST', cookie }), res).then(() => res)
}

describe('POST /api/auth/logout', () => {
  it('revoga a sessão no banco', async () => {
    const res = await postLogout(`${SESSION_COOKIE}=${token}`)

    expect(res.statusCode).toBe(200)
    expect(sql.__db.sessions[0].revoked_at).toBeTruthy()
  })

  it('limpa o cookie no navegador', async () => {
    const res = await postLogout(`${SESSION_COOKIE}=${token}`)
    const setCookie = res.headers['set-cookie']

    expect(setCookie).toContain('Max-Age=0')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toMatch(/pulsari_session=;/)
  })

  it('o token deixa de valer mesmo se o cliente tiver guardado uma cópia', async () => {
    await postLogout(`${SESSION_COOKIE}=${token}`)

    const res = mockRes()
    await sessionRoute(mockReq({ method: 'GET', cookie: `${SESSION_COOKIE}=${token}` }), res)

    expect(res.statusCode).toBe(401)
  })

  it('é idempotente: deslogar sem sessão não é erro', async () => {
    const res = await postLogout(undefined)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('deslogar duas vezes seguidas continua respondendo 200', async () => {
    await postLogout(`${SESSION_COOKIE}=${token}`)
    const res = await postLogout(`${SESSION_COOKIE}=${token}`)
    expect(res.statusCode).toBe(200)
  })

  it('não derruba a sessão de outro usuário', async () => {
    const outroToken = generateToken()
    sql.__db.sessions.push({
      id: 'sess-2',
      user_id: 'u-2',
      token_hash: hashToken(outroToken),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      revoked_at: null,
    })

    await postLogout(`${SESSION_COOKIE}=${token}`)

    expect(sql.__db.sessions.find((s) => s.id === 'sess-1').revoked_at).toBeTruthy()
    expect(sql.__db.sessions.find((s) => s.id === 'sess-2').revoked_at).toBeNull()
  })

  it('recusa métodos que não sejam POST', async () => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = mockRes()
      await logout(mockReq({ method }), res)
      expect(res.statusCode, method + ' deveria ser recusado').toBe(405)
    }
  })
})
