import { beforeEach, describe, expect, it } from 'vitest'
import { __setSql } from '../api/_lib/db.js'
import { hashPassword } from '../api/_lib/password.js'
import login from '../api/auth/login.js'
import { createFakeSql } from './helpers/fakeSql.js'
import { cookieFrom, mockReq, mockRes } from './helpers/http.js'

let sql
let senhaHash

const USER = {
  id: 'u-1', name: 'Ana Souza', email: 'ana@pulsari.com.br',
  role: 'manager', status: 'active', last_login_at: null,
}

beforeEach(async () => {
  senhaHash = senhaHash ?? (await hashPassword('SenhaCorreta#2026'))
  sql = createFakeSql({ users: [{ ...USER, password_hash: senhaHash }] })
  __setSql(sql)
})

const postLogin = (body, headers = {}) => {
  const req = mockReq({ method: 'POST', body, headers })
  const res = mockRes()
  return login(req, res).then(() => res)
}

describe('POST /api/auth/login', () => {
  it('login correto cria sessão e devolve cookie HttpOnly', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })

    expect(res.statusCode).toBe(200)
    expect(res.body.user).toMatchObject({ email: 'ana@pulsari.com.br', role: 'manager' })
    expect(sql.__db.sessions).toHaveLength(1)

    const setCookie = res.headers['set-cookie']
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain('Path=/')
    expect(cookieFrom(res)).toBeTruthy()
  })

  it('nunca devolve o hash da senha na resposta', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    expect(JSON.stringify(res.body)).not.toContain('scrypt$')
    expect(res.body.user.password_hash).toBeUndefined()
  })

  it('o cookie carrega o token, mas o banco guarda só o hash dele', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    const token = cookieFrom(res)
    const armazenado = sql.__db.sessions[0].token_hash
    expect(armazenado).not.toBe(token)
    expect(armazenado).toMatch(/^[0-9a-f]{64}$/)
  })

  it('atualiza last_login_at', async () => {
    await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    expect(sql.__db.users[0].last_login_at).toBeTruthy()
  })

  it('login errado devolve 401 sem criar sessão', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'senha-errada' })
    expect(res.statusCode).toBe(401)
    expect(res.headers['set-cookie']).toBeUndefined()
    expect(sql.__db.sessions).toHaveLength(0)
  })

  it('e-mail inexistente responde igual a senha errada (não enumera contas)', async () => {
    const inexistente = await postLogin({ email: 'ninguem@pulsari.com.br', password: 'x'.repeat(20) })
    const senhaErrada = await postLogin({ email: 'ana@pulsari.com.br', password: 'x'.repeat(20) })

    expect(inexistente.statusCode).toBe(senhaErrada.statusCode)
    expect(inexistente.body.error).toBe(senhaErrada.body.error)
  })

  it('usuário inativo não entra, mesmo com a senha certa', async () => {
    sql.__db.users[0].status = 'inactive'
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })

    expect(res.statusCode).toBe(403)
    expect(res.headers['set-cookie']).toBeUndefined()
    expect(sql.__db.sessions).toHaveLength(0)
  })

  it('usuário suspenso também não entra', async () => {
    sql.__db.users[0].status = 'suspended'
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    expect(res.statusCode).toBe(403)
    expect(sql.__db.sessions).toHaveLength(0)
  })

  it('só revela que a conta está desativada a quem acertou a senha', async () => {
    sql.__db.users[0].status = 'inactive'
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'senha-errada' })
    expect(res.statusCode).toBe(401)
    expect(res.body.error).not.toMatch(/desativada/i)
  })

  it('e-mail é case-insensitive', async () => {
    const res = await postLogin({ email: 'ANA@Pulsari.com.BR', password: 'SenhaCorreta#2026' })
    expect(res.statusCode).toBe(200)
  })

  it('exige e-mail e senha', async () => {
    expect((await postLogin({ email: 'ana@pulsari.com.br' })).statusCode).toBe(400)
    expect((await postLogin({ password: 'x' })).statusCode).toBe(400)
    expect((await postLogin({})).statusCode).toBe(400)
    expect((await postLogin(null)).statusCode).toBe(400)
  })

  it('ignora campos extras — sem mass assignment de role ou status', async () => {
    const res = await postLogin({
      email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026',
      role: 'admin', status: 'active', id: 'u-999',
    })
    expect(res.statusCode).toBe(200)
    expect(res.body.user.role).toBe('manager')
    expect(res.body.user.id).toBe('u-1')
  })

  it('recusa métodos que não sejam POST', async () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      const res = mockRes()
      await login(mockReq({ method }), res)
      expect(res.statusCode, method + ' deveria ser recusado').toBe(405)
      expect(res.headers.allow).toBe('POST')
    }
  })

  it('não emite Access-Control-Allow-Origin (API é same-origin)', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('respostas de autenticação nunca são cacheadas', async () => {
    const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
    expect(res.headers['cache-control']).toContain('no-store')
  })

  describe('força bruta', () => {
    it('bloqueia com 429 após 5 falhas e informa Retry-After', async () => {
      for (let i = 0; i < 5; i++) {
        const r = await postLogin({ email: 'ana@pulsari.com.br', password: 'errada' })
        expect(r.statusCode).toBe(401)
      }

      const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'errada' })
      expect(res.statusCode).toBe(429)
      expect(Number(res.headers['retry-after'])).toBeGreaterThan(0)
    })

    it('bloqueia mesmo quando a senha passa a estar correta', async () => {
      for (let i = 0; i < 5; i++) {
        await postLogin({ email: 'ana@pulsari.com.br', password: 'errada' })
      }
      const res = await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })
      expect(res.statusCode).toBe(429)
      expect(sql.__db.sessions).toHaveLength(0)
    })

    it('bloqueia varredura de contas diferentes vinda do mesmo IP', async () => {
      for (let i = 0; i < 5; i++) {
        await postLogin({ email: 'alvo' + i + '@pulsari.com.br', password: 'errada' })
      }
      const res = await postLogin({ email: 'outro@pulsari.com.br', password: 'errada' })
      expect(res.statusCode).toBe(429)
    })

    it('login bem-sucedido limpa o histórico de falhas', async () => {
      for (let i = 0; i < 3; i++) {
        await postLogin({ email: 'ana@pulsari.com.br', password: 'errada' })
      }
      await postLogin({ email: 'ana@pulsari.com.br', password: 'SenhaCorreta#2026' })

      const falhasRestantes = sql.__db.loginAttempts.filter((a) => !a.successful)
      expect(falhasRestantes).toHaveLength(0)
    })
  })
})
