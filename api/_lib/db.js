import { neon } from '@neondatabase/serverless'

let cached = null

/**
 * Cliente Neon único por invocação (reaproveitado entre chamadas quentes).
 * O cache é conferido antes da variável de ambiente de propósito: é o que
 * permite injetar um dublê nos testes sem precisar de DATABASE_URL.
 */
export function getSql() {
  if (cached) return cached

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL não configurada no ambiente.')

  cached = neon(url)
  return cached
}

/** Usado só nos testes, para injetar um SQL falso. */
export function __setSql(fake) {
  cached = fake
}
