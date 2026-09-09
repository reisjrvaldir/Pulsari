import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCb)

// N=2^16 com r=8, p=1: memory-hard em 64MB, ~330ms nesta máquina.
// scrypt nativo em vez de bcryptjs (JS puro, ~800ms) — serverless é cobrado
// por duração, e o nativo entrega mais resistência por milissegundo.
const PARAMS = { N: 65536, r: 8, p: 1 }
const KEYLEN = 64
const MAXMEM = 256 * 1024 * 1024

/**
 * Formato: scrypt$N$r$p$saltBase64$hashBase64
 * Os parâmetros vão gravados no hash para que o custo possa ser elevado no
 * futuro sem invalidar as senhas já cadastradas.
 */
export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new TypeError('senha deve ser uma string não vazia')
  }
  const salt = randomBytes(16)
  const { N, r, p } = PARAMS
  const derived = await scrypt(plain, salt, KEYLEN, { N, r, p, maxmem: MAXMEM })
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${derived.toString('base64')}`
}

export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false

  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = parts
  const N = Number(nRaw), r = Number(rRaw), p = Number(pRaw)
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  let expected
  try {
    expected = Buffer.from(hashB64, 'base64')
  } catch {
    return false
  }
  if (expected.length === 0) return false

  try {
    const derived = await scrypt(plain, Buffer.from(saltB64, 'base64'), expected.length, {
      N, r, p, maxmem: MAXMEM,
    })
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/**
 * Hash real de uma senha aleatória que ninguém conhece.
 * Serve para gastar o mesmo tempo verificando um e-mail inexistente e um
 * e-mail válido — sem isso, o tempo de resposta denuncia quais contas existem.
 */
export const DUMMY_HASH =
  'scrypt$65536$8$1$Y8nONGnt4TQBBLCDVNF/cg==$LzysuU9MsxAXD46VUL5GIsPFVyuED8iecMmpk1cwmpnM3xeujJs3mKXSALPMdd9qCrUh8f5fp2+jfHtdTq4IgA=='
