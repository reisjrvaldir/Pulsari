import { describe, expect, it } from 'vitest'
import { DUMMY_HASH, hashPassword, verifyPassword } from '../api/_lib/password.js'

describe('senhas', () => {
  it('aceita a senha correta e recusa a errada', async () => {
    const hash = await hashPassword('senha-correta-123')
    expect(await verifyPassword('senha-correta-123', hash)).toBe(true)
    expect(await verifyPassword('senha-errada-123', hash)).toBe(false)
  })

  it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
    const a = await hashPassword('mesma-senha')
    const b = await hashPassword('mesma-senha')
    expect(a).not.toBe(b)
    expect(await verifyPassword('mesma-senha', a)).toBe(true)
    expect(await verifyPassword('mesma-senha', b)).toBe(true)
  })

  it('grava os parâmetros de custo no próprio hash', async () => {
    const hash = await hashPassword('x'.repeat(16))
    expect(hash.startsWith('scrypt$65536$8$1$')).toBe(true)
    expect(hash.split('$')).toHaveLength(6)
  })

  it('nunca guarda a senha em claro dentro do hash', async () => {
    const senha = 'MinhaSenhaSuperSecreta'
    const hash = await hashPassword(senha)
    expect(hash).not.toContain(senha)
  })

  it('recusa hash corrompido, truncado ou de formato estranho', async () => {
    for (const ruim of ['', 'nao-e-hash', 'scrypt$1$2$3', 'bcrypt$65536$8$1$a$b', 'scrypt$x$8$1$YQ==$YQ==']) {
      expect(await verifyPassword('qualquer', ruim), `deveria recusar: ${ruim}`).toBe(false)
    }
  })

  it('recusa entradas que não são string', async () => {
    const hash = await hashPassword('senha-valida-1')
    expect(await verifyPassword(null, hash)).toBe(false)
    expect(await verifyPassword(undefined, hash)).toBe(false)
    expect(await verifyPassword({}, hash)).toBe(false)
    expect(await verifyPassword('senha-valida-1', null)).toBe(false)
  })

  it('DUMMY_HASH é um hash válido — e nenhuma senha comum o abre', async () => {
    expect(DUMMY_HASH.startsWith('scrypt$')).toBe(true)
    for (const tentativa of ['', 'admin', '123456', 'senha', 'password']) {
      expect(await verifyPassword(tentativa, DUMMY_HASH)).toBe(false)
    }
  })

  it('não aceita hashear senha vazia', async () => {
    await expect(hashPassword('')).rejects.toThrow()
    await expect(hashPassword(null)).rejects.toThrow()
  })
})
