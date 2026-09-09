import { beforeEach, describe, expect, it } from 'vitest'
import { __setSql } from '../api/_lib/db.js'
import { generateToken, hashToken, SESSION_COOKIE } from '../api/_lib/session.js'
import { requireAuth, requireProjectMembership, requireRole } from '../api/_lib/http.js'
import { createFakeSql } from './helpers/fakeSql.js'
import { mockReq, mockRes } from './helpers/http.js'

let sql

/** Cria um usuário com sessão ativa e devolve o cabeçalho de cookie pronto. */
function login(role, { id = 'u-' + role, status = 'active' } = {}) {
  const token = generateToken()
  sql.__db.users.push({
    id, name: 'Usuário ' + role, email: role + '@pulsari.com.br',
    password_hash: 'scrypt$65536$8$1$YQ==$YQ==', role, status, last_login_at: null,
  })
  sql.__db.sessions.push({
    id: 'sess-' + id,
    user_id: id,
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    revoked_at: null,
  })
  return `${SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  sql = createFakeSql()
  __setSql(sql)
})

describe('requireAuth', () => {
  it('devolve o usuário com sessão válida', async () => {
    const cookie = login('admin')
    const res = mockRes()
    const user = await requireAuth(mockReq({ cookie }), res)

    expect(user).toMatchObject({ role: 'admin', status: 'active' })
    expect(res.statusCode).toBeNull()
  })

  it('responde 401 e devolve null sem sessão', async () => {
    const res = mockRes()
    const user = await requireAuth(mockReq({}), res)

    expect(user).toBeNull()
    expect(res.statusCode).toBe(401)
  })
})

describe('requireRole — RBAC na camada HTTP', () => {
  it('admin passa em qualquer recurso', async () => {
    const cookie = login('admin')
    for (const resource of ['finance', 'users', 'settings', 'crm']) {
      const res = mockRes()
      const user = await requireRole(mockReq({ cookie }), res, resource, 'write')
      expect(user, 'admin deveria passar em ' + resource).not.toBeNull()
    }
  })

  it('commercial é barrado no financeiro com 403', async () => {
    const cookie = login('commercial')
    const res = mockRes()
    const user = await requireRole(mockReq({ cookie }), res, 'finance', 'read')

    expect(user).toBeNull()
    expect(res.statusCode).toBe(403)
  })

  it('manager lê financeiro mas não escreve', async () => {
    const cookie = login('manager')

    const leitura = mockRes()
    expect(await requireRole(mockReq({ cookie }), leitura, 'finance', 'read')).not.toBeNull()

    const escrita = mockRes()
    expect(await requireRole(mockReq({ cookie }), escrita, 'finance', 'write')).toBeNull()
    expect(escrita.statusCode).toBe(403)
  })

  it('financial não gerencia usuários', async () => {
    const cookie = login('financial')
    const res = mockRes()

    expect(await requireRole(mockReq({ cookie }), res, 'users', 'write')).toBeNull()
    expect(res.statusCode).toBe(403)
  })

  it('developer é recusado em projects pela rota genérica — precisa do guard de vínculo', async () => {
    const cookie = login('developer')
    const res = mockRes()
    const user = await requireRole(mockReq({ cookie }), res, 'projects', 'read')

    expect(user).toBeNull()
    expect(res.statusCode).toBe(403)
    expect(res.body.error).toMatch(/vínculo/i)
  })

  it('sem sessão devolve 401, não 403 — a distinção importa para o front', async () => {
    const res = mockRes()
    expect(await requireRole(mockReq({}), res, 'crm', 'read')).toBeNull()
    expect(res.statusCode).toBe(401)
  })
})

describe('requireProjectMembership', () => {
  it('developer vinculado ao projeto passa', async () => {
    const cookie = login('developer')
    sql.__db.projectMembers.push({ project_id: 'p-1', user_id: 'u-developer' })

    const res = mockRes()
    const user = await requireProjectMembership(mockReq({ cookie }), res, 'p-1', 'write')

    expect(user).not.toBeNull()
    expect(res.statusCode).toBeNull()
  })

  it('developer não vinculado é barrado com 403', async () => {
    const cookie = login('developer')
    sql.__db.projectMembers.push({ project_id: 'p-outro', user_id: 'u-developer' })

    const res = mockRes()
    const user = await requireProjectMembership(mockReq({ cookie }), res, 'p-1', 'read')

    expect(user).toBeNull()
    expect(res.statusCode).toBe(403)
  })

  it('admin não precisa de vínculo', async () => {
    const cookie = login('admin')
    const res = mockRes()

    expect(await requireProjectMembership(mockReq({ cookie }), res, 'p-1', 'write')).not.toBeNull()
  })

  it('commercial não alcança projetos nem estando vinculado', async () => {
    const cookie = login('commercial')
    sql.__db.projectMembers.push({ project_id: 'p-1', user_id: 'u-commercial' })

    const res = mockRes()
    expect(await requireProjectMembership(mockReq({ cookie }), res, 'p-1', 'read')).toBeNull()
    expect(res.statusCode).toBe(403)
  })
})
