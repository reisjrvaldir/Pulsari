import { getSql } from '../_lib/db.js'
import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { normalizeEmail } from '../_lib/validate.js'
import { ORIGENS, createProspect, mapearCabecalho, parseCsv } from '../_lib/prospects.js'

/**
 * Importação de CSV.
 *
 * Nenhuma linha inválida derruba o lote: cada uma é avaliada em separado, e a
 * resposta diz exatamente quantas entraram, quantas eram repetidas e quais
 * falharam com qual motivo. Uma importação que só responde "erro" obriga a
 * conferir 300 linhas na mão.
 */

const MAX_LINHAS = 2000

async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  const body = await readJsonBody(req)
  const csv = typeof body?.csv === 'string' ? body.csv : ''
  const origem = ORIGENS.includes(body?.source) ? body.source : 'lista'

  if (!csv.trim()) return json(res, 400, { error: 'Envie o conteúdo do CSV.' })

  const linhas = parseCsv(csv)
  if (linhas.length < 2) {
    return json(res, 400, { error: 'O arquivo precisa ter cabeçalho e ao menos uma linha.' })
  }
  if (linhas.length - 1 > MAX_LINHAS) {
    return json(res, 400, { error: `Máximo de ${MAX_LINHAS} linhas por importação.` })
  }

  const mapa = mapearCabecalho(linhas[0])
  if (mapa.company_name === undefined) {
    return json(res, 400, {
      error: 'Não encontrei a coluna do nome da empresa. Use "empresa" ou "company_name" no cabeçalho.',
      colunas_reconhecidas: Object.keys(mapa),
    })
  }

  const sql = getSql()
  const valor = (linha, campo) => {
    const i = mapa[campo]
    if (i === undefined) return null
    const v = (linha[i] ?? '').trim()
    return v === '' ? null : v
  }

  let importados = 0
  let duplicados = 0
  const erros = []

  // E-mails já usados, carregados de uma vez: consultar por linha faria uma
  // ida ao banco por registro num arquivo de centenas.
  const existentes = new Set(
    (await sql`SELECT email_norm FROM prospects WHERE email_norm IS NOT NULL`)
      .map((r) => r.email_norm),
  )
  // Também dedupe dentro do próprio arquivo: lista comprada repete contato.
  const noArquivo = new Set()

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    const numero = i + 1

    const company = valor(linha, 'company_name')
    if (!company || company.length < 2) {
      erros.push({ linha: numero, motivo: 'nome da empresa ausente' })
      continue
    }

    const email = valor(linha, 'email')
    const norm = normalizeEmail(email)
    if (norm && (existentes.has(norm) || noArquivo.has(norm))) {
      duplicados++
      continue
    }

    try {
      await createProspect(
        {
          company_name: company,
          contact_name: valor(linha, 'contact_name'),
          email,
          phone: valor(linha, 'phone'),
          website: valor(linha, 'website'),
          social: valor(linha, 'social'),
          segment: valor(linha, 'segment'),
          city: valor(linha, 'city'),
          notes: valor(linha, 'notes'),
          source: origem,
          owner_id: user.id,
        },
        { userId: user.id, tipoAtividade: 'imported' },
      )
      if (norm) { existentes.add(norm); noArquivo.add(norm) }
      importados++
    } catch (err) {
      // Índice único pode disparar mesmo com a checagem acima, se duas
      // importações rodarem ao mesmo tempo. Conta como duplicado, não erro.
      if (String(err?.message).includes('prospects_email_norm_key')) duplicados++
      else erros.push({ linha: numero, motivo: 'falha ao gravar' })
    }
  }

  const [registro] = await sql`
    INSERT INTO prospect_imports (filename, total_linhas, importados, duplicados, invalidos, erros, created_by)
    VALUES (${body?.filename ?? null}, ${linhas.length - 1}, ${importados},
            ${duplicados}, ${erros.length}, ${JSON.stringify(erros)}, ${user.id})
    RETURNING id
  `

  return json(res, 200, {
    id: registro.id,
    total: linhas.length - 1,
    importados,
    duplicados,
    invalidos: erros.length,
    // Devolvemos só as primeiras: uma lista de 300 erros não cabe na tela e
    // o padrão costuma aparecer nas primeiras linhas.
    erros: erros.slice(0, 20),
    colunas_reconhecidas: Object.keys(mapa),
  })
}

export default withErrorHandling(handler)
