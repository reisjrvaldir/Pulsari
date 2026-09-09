import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __setSql, getSql } from '../api/_lib/db.js'
import { withErrorHandling } from '../api/_lib/http.js'
import login from '../api/auth/login.js'
import sessionRoute from '../api/auth/session.js'
import { createFakeSql } from './helpers/fakeSql.js'
import { mockReq, mockRes } from './helpers/http.js'

/**
 * Regressões da Sprint 01. Cada teste aqui existe porque o bug correspondente
 * chegou a acontecer durante o desenvolvimento.
 */

describe('regressão: getSql() precisa respeitar o cliente injetado', () => {
  const original = process.env.DATABASE_URL

  beforeEach(() => {
    delete process.env.DATABASE_URL
  })

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = original
  })

  it('devolve o dublê mesmo sem DATABASE_URL no ambiente', () => {
    // O bug: getSql() exigia DATABASE_URL antes de olhar o cache, então a
    // injeção de teste nunca era usada e toda rota estourava.
    const fake = createFakeSql()
    __setSql(fake)
    expect(getSql()).toBe(fake)
  })

  it('sem dublê e sem DATABASE_URL, falha com mensagem clara', () => {
    __setSql(null)
    expect(() => getSql()).toThrow(/DATABASE_URL/)
  })
})

describe('regressão: falhas internas não podem vazar para o cliente', () => {
  let errorSpy

  beforeEach(() => {
    // O envelope registra a falha no log do servidor; silenciamos no teste.
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it('erro do banco vira 500 genérico, sem stack trace na resposta', async () => {
    const quebrado = () => { throw new Error('conexão recusada em db-exemplo.interno') }
    quebrado.query = () => Promise.reject(new Error('x'))
    __setSql(quebrado)

    const res = mockRes()
    await login(mockReq({ method: 'POST', body: { email: 'a@b.com', password: 'x'.repeat(12) } }), res)

    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('Erro interno. Tente novamente em instantes.')

    const serialized = JSON.stringify(res.body)
    // O host que apareceu na exceção não pode chegar ao cliente.
    expect(serialized).not.toMatch(/db-exemplo/)
    expect(serialized).not.toMatch(/at\s+\w+/)
    expect(res.body.stack).toBeUndefined()
  })

  it('a falha é registrada no log do servidor', async () => {
    const quebrado = () => { throw new Error('falha simulada') }
    __setSql(quebrado)

    const res = mockRes()
    await sessionRoute(mockReq({ method: 'GET', cookie: 'pulsari_session=qualquer' }), res)

    expect(errorSpy).toHaveBeenCalled()
    expect(res.statusCode).toBe(500)
  })

  it('o envelope não interfere quando o handler responde normalmente', async () => {
    const handler = withErrorHandling(async (_req, res) => {
      res.setHeader('X-Teste', '1')
      return res.status(200).json({ ok: true })
    })

    const res = mockRes()
    await handler(mockReq({}), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(res.headers['x-teste']).toBe('1')
  })

  it('não sobrescreve uma resposta que o handler já enviou antes de falhar', async () => {
    const handler = withErrorHandling(async (_req, res) => {
      res.status(401).json({ error: 'Não autenticado' })
      throw new Error('falha depois de responder')
    })

    const res = mockRes()
    await handler(mockReq({}), res)

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual({ error: 'Não autenticado' })
  })
})
