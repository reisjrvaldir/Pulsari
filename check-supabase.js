// ══════════════════════════════════════════════
// Script de verificação do Supabase — Pulsari
// Execute: node check-supabase.js
// ══════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wtqutjrjbrpetcxkstge.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || ''

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida.')
  console.error('   Execute: $env:SUPABASE_SERVICE_KEY="sua_chave" (PowerShell)')
  console.error('   ou: set SUPABASE_SERVICE_KEY=sua_chave (CMD)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
  console.log('\n🔍 Verificando Supabase — Pulsari\n')
  let allOk = true

  // ── 1. Tabela portfolio_projects ──
  process.stdout.write('  📋 Tabela portfolio_projects ... ')
  const { data: rows, error: tErr } = await supabase
    .from('portfolio_projects')
    .select('id, category, nome, descricao, imagem')
    .limit(5)

  if (tErr) {
    console.log(`❌ ERRO: ${tErr.message}`)
    allOk = false
  } else {
    console.log(`✅ OK — ${rows.length} projeto(s) encontrado(s)`)
    if (rows.length > 0) {
      rows.forEach(p => console.log(`       • [${p.category}] ${p.nome}${p.imagem ? ' 🖼️' : ''}`))
    }
  }

  // ── 2. Bucket portfolio-images ──
  process.stdout.write('  🪣 Bucket portfolio-images   ... ')
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets()

  if (bErr) {
    console.log(`❌ ERRO: ${bErr.message}`)
    allOk = false
  } else {
    const bucket = buckets.find(b => b.id === 'portfolio-images')
    if (bucket) {
      console.log(`✅ OK — público: ${bucket.public ? 'sim' : 'não'}`)
    } else {
      console.log('❌ Bucket não encontrado')
      allOk = false
    }
  }

  // ── 3. API pública /api/portfolio ──
  process.stdout.write('  🌐 API GET /api/portfolio    ... ')
  try {
    const res = await fetch('https://pulsari.com.br/api/portfolio')
    const json = await res.json()
    if (res.ok) {
      const total = Object.values(json).reduce((s, arr) => s + (arr?.length || 0), 0)
      console.log(`✅ OK — ${total} projeto(s) retornado(s)`)
    } else {
      console.log(`❌ Status ${res.status}: ${json.error || 'erro desconhecido'}`)
      allOk = false
    }
  } catch (e) {
    console.log(`❌ ERRO: ${e.message}`)
    allOk = false
  }

  // ── Resultado final ──
  console.log('\n' + '─'.repeat(45))
  if (allOk) {
    console.log('✅ Tudo OK! O portfólio está pronto para uso.\n')
  } else {
    console.log('⚠️  Alguns itens precisam de atenção.')
    console.log('   Execute supabase-portfolio-setup.sql no SQL Editor.\n')
  }
}

check().catch(console.error)
