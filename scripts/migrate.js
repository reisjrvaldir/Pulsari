#!/usr/bin/env node
/**
 * Runner de migrations idempotente.
 *
 *   node scripts/migrate.js            → aplica o que falta
 *   node scripts/migrate.js --status   → só mostra o estado, não escreve nada
 *   node scripts/migrate.js --dry-run  → imprime o SQL que seria executado
 *
 * Cada arquivo em migrations/ roda uma única vez e fica registrado em
 * schema_migrations. Rodar duas vezes não faz nada na segunda.
 */
import { readdir, readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import { splitStatements } from './split-sql.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(HERE, '..', 'migrations')

const args = new Set(process.argv.slice(2))
const statusOnly = args.has('--status')
const dryRun = args.has('--dry-run')

function loadEnv() {
  if (process.env.DATABASE_URL) return
  // .env simples, sem dependência: só o suficiente para uso local.
  try {
    const raw = readFileSync(join(HERE, '..', '.env'), 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch { /* sem .env: espera-se DATABASE_URL já no ambiente */ }
}

async function main() {
  loadEnv()

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERRO: DATABASE_URL não definida (nem no ambiente, nem no .env).')
    process.exit(1)
  }

  const parsed = new URL(url)
  console.log(`banco: ${parsed.pathname.slice(1)} @ ${parsed.hostname}`)
  if (dryRun) console.log('modo: DRY-RUN (nada será escrito)\n')

  const sql = neon(url)

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort()
  if (files.length === 0) {
    console.log('nenhuma migration encontrada.')
    return
  }

  let applied = new Set()
  try {
    const rows = await sql`SELECT version FROM schema_migrations`
    applied = new Set(rows.map((r) => r.version))
  } catch {
    console.log('schema_migrations ainda não existe — primeira execução.')
  }

  const pending = files.filter((f) => !applied.has(f))

  console.log(`\naplicadas: ${files.length - pending.length}/${files.length}`)
  for (const f of files) console.log(`  ${applied.has(f) ? '[x]' : '[ ]'} ${f}`)

  if (statusOnly) return
  if (pending.length === 0) {
    console.log('\nnada a fazer — banco já está atualizado.')
    return
  }

  console.log(`\npendentes: ${pending.length}`)
  for (const file of pending) {
    const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8')

    if (dryRun) {
      console.log(`\n----- ${file} -----\n${content}`)
      continue
    }

    const comandos = splitStatements(content)
    console.log(`  aplicando ${file} (${comandos.length} comandos)`)

    // Um comando por chamada: o driver HTTP da Neon envia cada uma como
    // prepared statement, e o Postgres recusa múltiplos comandos nesse
    // formato. Também não há transação envolvendo todos — por isso cada
    // comando da migration precisa ser idempotente (IF NOT EXISTS), de modo
    // que reexecutar depois de uma falha no meio seja seguro.
    for (let n = 0; n < comandos.length; n++) {
      const resumo = comandos[n].replace(/\s+/g, ' ').slice(0, 58)
      process.stdout.write(`    ${String(n + 1).padStart(2)}/${comandos.length}  ${resumo}… `)
      try {
        await sql.query(comandos[n])
        console.log('ok')
      } catch (err) {
        console.log('FALHOU')
        throw new Error(`${file}, comando ${n + 1}: ${err.message}`)
      }
    }

    // Só registra como aplicada depois que todos os comandos passaram.
    await sql`INSERT INTO schema_migrations (version) VALUES (${file}) ON CONFLICT DO NOTHING`
    console.log(`  ${file} concluída.`)
  }

  console.log('\nmigrations concluídas.')
}

main().catch((err) => {
  console.error('\nFALHA:', err.message)
  process.exit(1)
})
