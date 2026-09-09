#!/usr/bin/env node
/**
 * Cria (ou promove) o primeiro administrador.
 *
 *   node scripts/seed-admin.js --email ana@pulsari.com.br --name "Ana" --password '...'
 *
 * Sem --password, gera uma senha forte aleatória e imprime UMA vez.
 * Nenhuma credencial fica em arquivo: o ADMIN_PASS do .env não é lido aqui de
 * propósito — senha de ambiente foi justamente o modelo que esta sprint remove.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from '../api/_lib/password.js'

const HERE = dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  if (process.env.DATABASE_URL) return
  try {
    const raw = readFileSync(join(HERE, '..', '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* espera-se DATABASE_URL no ambiente */ }
}

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : undefined
}

async function main() {
  loadEnv()

  const email = arg('--email')
  const name = arg('--name') ?? 'Administrador'
  let password = arg('--password')
  let generated = false

  if (!email) {
    console.error('uso: node scripts/seed-admin.js --email <email> [--name <nome>] [--password <senha>]')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('ERRO: DATABASE_URL não definida.')
    process.exit(1)
  }
  if (!password) {
    password = randomBytes(18).toString('base64url')
    generated = true
  }
  if (password.length < 12) {
    console.error('ERRO: a senha precisa ter ao menos 12 caracteres.')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)
  const hash = await hashPassword(password)

  const rows = await sql`
    INSERT INTO users (name, email, password_hash, role, status)
    VALUES (${name}, ${email}, ${hash}, 'admin', 'active')
    RETURNING id, email, role
  `

  if (rows.length === 0) {
    // Alcançável só se o INSERT não retornar linha; duplicidade cai no catch.
    console.error(`ERRO: já existe usuário com o e-mail ${email}.`)
    process.exit(1)
  }

  console.log(`admin criado: ${rows[0].email} (${rows[0].role})`)
  if (generated) {
    console.log(`\n  SENHA GERADA: ${password}`)
    console.log('  Anote agora — ela não será exibida novamente.\n')
  }
}

main().catch((err) => {
  if (String(err.message).includes('users_email_lower_key')) {
    console.error('ERRO: já existe um usuário com esse e-mail.')
  } else {
    console.error('FALHA:', err.message)
  }
  process.exit(1)
})
