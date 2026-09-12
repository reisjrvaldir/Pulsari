import { getSql } from './db.js'
import { normalizeEmail } from './validate.js'

/**
 * Prospecção.
 *
 * Prospect é quem a Pulsari foi buscar; lead é quem procurou a Pulsari.
 * A conversão entre os dois é explícita e registrada.
 */

export const STATUS_PROSPECT = [
  'new', 'researching', 'contacted', 'interested', 'converted', 'discarded',
]

export const ORIGENS = ['indicacao', 'evento', 'inbound', 'pesquisa', 'lista', 'outro']

/**
 * Espelho da função `pulsari_prospect_score` do banco.
 *
 * O banco calcula o número (coluna gerada, sempre em dia com o dado); aqui
 * fica a explicação de como ele foi formado. Um score sem justificativa não
 * orienta decisão nenhuma — a equipe precisa saber que faltou telefone, não
 * só que "deu 60".
 *
 * `tests/prospect-score.test.js` compara as duas implementações contra o
 * Postgres real e falha se divergirem.
 */
const PESOS = [
  { codigo: 'email',    rotulo: 'Tem e-mail',              pontos: 20, testa: (p) => preenchido(p.email) },
  { codigo: 'phone',    rotulo: 'Tem telefone',            pontos: 20, testa: (p) => preenchido(p.phone) },
  { codigo: 'website',  rotulo: 'Tem site',                pontos: 10, testa: (p) => preenchido(p.website) },
  { codigo: 'social',   rotulo: 'Tem rede social',         pontos: 5,  testa: (p) => preenchido(p.social) },
  { codigo: 'segment',  rotulo: 'Segmento identificado',   pontos: 10, testa: (p) => preenchido(p.segment) },
  { codigo: 'city',     rotulo: 'Cidade identificada',     pontos: 5,  testa: (p) => preenchido(p.city) },
  { codigo: 'notes',    rotulo: 'Pesquisa registrada',     pontos: 10, testa: (p) => String(p.notes ?? '').trim().length >= 20 },
]

const PONTOS_ORIGEM = {
  indicacao: 20, evento: 15, inbound: 15, pesquisa: 10, lista: 5,
}

const ROTULO_ORIGEM = {
  indicacao: 'Veio por indicação',
  evento: 'Veio de evento',
  inbound: 'Procurou a Pulsari',
  pesquisa: 'Encontrado em pesquisa',
  lista: 'Veio de lista',
  outro: 'Origem não classificada',
}

const preenchido = (v) => String(v ?? '').trim() !== ''

/** Devolve o total e o porquê de cada ponto — é isto que torna o score útil. */
export function explicarScore(prospect) {
  const fatores = PESOS.map((p) => ({
    codigo: p.codigo,
    rotulo: p.rotulo,
    pontos: p.pontos,
    atendido: p.testa(prospect),
  }))

  const origem = String(prospect.source ?? '').toLowerCase()
  fatores.push({
    codigo: 'source',
    rotulo: ROTULO_ORIGEM[origem] ?? ROTULO_ORIGEM.outro,
    pontos: PONTOS_ORIGEM[origem] ?? 0,
    atendido: (PONTOS_ORIGEM[origem] ?? 0) > 0,
  })

  const total = Math.min(
    100,
    fatores.reduce((soma, f) => soma + (f.atendido ? f.pontos : 0), 0),
  )

  return {
    total,
    fatores,
    faltando: fatores.filter((f) => !f.atendido && f.pontos > 0),
  }
}

// --- Leitura ----------------------------------------------------------------

export async function listProspects({ status, ownerId, search, minScore, overdueOnly } = {}) {
  const sql = getSql()
  const termo = search ? `%${String(search).trim().toLowerCase()}%` : null

  const rows = await sql`
    SELECT id, company_name, contact_name, email, phone, website, social,
           source, segment, city, status, owner_id, notes,
           next_contact_at, last_contact_at, converted_lead_id, converted_at,
           score, created_at, updated_at
      FROM prospects
     WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
       AND (${ownerId ?? null}::uuid IS NULL OR owner_id = ${ownerId ?? null})
       AND (${minScore ?? null}::int IS NULL OR score >= ${minScore ?? null})
       AND (${termo}::text IS NULL OR
            lower(company_name) LIKE ${termo} OR
            lower(coalesce(contact_name,'')) LIKE ${termo} OR
            lower(coalesce(email,'')) LIKE ${termo} OR
            lower(coalesce(segment,'')) LIKE ${termo})
       AND (${Boolean(overdueOnly)} = false OR
            (next_contact_at IS NOT NULL AND next_contact_at < now()))
     ORDER BY score DESC, created_at DESC
  `
  return rows.map((p) => ({ ...p, score_detalhe: explicarScore(p) }))
}

export async function getProspect(id) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, company_name, contact_name, email, phone, website, social,
           source, segment, city, status, owner_id, notes,
           next_contact_at, last_contact_at, converted_lead_id, converted_at,
           score, created_at, updated_at
      FROM prospects WHERE id = ${id} LIMIT 1
  `
  if (!rows[0]) return null
  return { ...rows[0], score_detalhe: explicarScore(rows[0]) }
}

/**
 * Procura duplicata pelo e-mail (trava real) ou pelo nome normalizado da
 * empresa (aviso). Nome igual não impede cadastro — duas filiais da mesma
 * rede são prospects legítimos — mas quem cadastra precisa ser avisado.
 *
 * O casamento por nome é heurístico e não pega tudo: remove acento, caixa e
 * pontuação, então "Café & Cia." e "Cafe e Cia" NÃO colidem (o & some, o "e"
 * fica). Serve para pegar o caso comum de redigitação, não para garantir
 * unicidade — quem garante é o índice de e-mail.
 */
export async function encontrarDuplicata({ email, company_name }) {
  const sql = getSql()
  const emailNorm = normalizeEmail(email)
  const rows = await sql`
    SELECT id, company_name, email, status,
           (${emailNorm}::text IS NOT NULL AND email_norm = ${emailNorm}) AS por_email
      FROM prospects
     WHERE (${emailNorm}::text IS NOT NULL AND email_norm = ${emailNorm})
        OR (${company_name ?? ''}::text <> '' AND company_norm =
            nullif(regexp_replace(lower(pulsari_sem_acento(${company_name ?? ''})), '[^a-z0-9]', '', 'g'), ''))
     ORDER BY por_email DESC
     LIMIT 1
  `
  return rows[0] ?? null
}

// --- Escrita ----------------------------------------------------------------

export async function createProspect(dados, { userId = null, tipoAtividade = 'created' } = {}) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO prospects (company_name, contact_name, email, phone, website, social,
                           source, segment, city, status, owner_id, notes,
                           next_contact_at, created_by)
    VALUES (${dados.company_name}, ${dados.contact_name ?? null}, ${dados.email ?? null},
            ${dados.phone ?? null}, ${dados.website ?? null}, ${dados.social ?? null},
            ${dados.source ?? 'pesquisa'}, ${dados.segment ?? null}, ${dados.city ?? null},
            ${dados.status ?? 'new'}, ${dados.owner_id ?? userId}, ${dados.notes ?? null},
            ${dados.next_contact_at ?? null}, ${userId})
    RETURNING id
  `
  const id = rows[0].id
  await addActivity(id, { userId, type: tipoAtividade, description: `Prospect registrado (${dados.source ?? 'pesquisa'})` })
  return getProspect(id)
}

const EDITAVEL = [
  'company_name', 'contact_name', 'email', 'phone', 'website', 'social',
  'source', 'segment', 'city', 'owner_id', 'notes',
  'next_contact_at', 'last_contact_at',
]

export async function updateProspect(id, dados, { userId = null } = {}) {
  const atual = await getProspect(id)
  if (!atual) return null
  const sql = getSql()

  for (const campo of Object.keys(dados).filter((k) => EDITAVEL.includes(k))) {
    switch (campo) {
      case 'company_name': await sql`UPDATE prospects SET company_name = ${dados.company_name}, updated_at = now() WHERE id = ${id}`; break
      case 'contact_name': await sql`UPDATE prospects SET contact_name = ${dados.contact_name}, updated_at = now() WHERE id = ${id}`; break
      case 'email': await sql`UPDATE prospects SET email = ${dados.email}, updated_at = now() WHERE id = ${id}`; break
      case 'phone': await sql`UPDATE prospects SET phone = ${dados.phone}, updated_at = now() WHERE id = ${id}`; break
      case 'website': await sql`UPDATE prospects SET website = ${dados.website}, updated_at = now() WHERE id = ${id}`; break
      case 'social': await sql`UPDATE prospects SET social = ${dados.social}, updated_at = now() WHERE id = ${id}`; break
      case 'source': await sql`UPDATE prospects SET source = ${dados.source}, updated_at = now() WHERE id = ${id}`; break
      case 'segment': await sql`UPDATE prospects SET segment = ${dados.segment}, updated_at = now() WHERE id = ${id}`; break
      case 'city': await sql`UPDATE prospects SET city = ${dados.city}, updated_at = now() WHERE id = ${id}`; break
      case 'owner_id': await sql`UPDATE prospects SET owner_id = ${dados.owner_id}, updated_at = now() WHERE id = ${id}`; break
      case 'notes': await sql`UPDATE prospects SET notes = ${dados.notes}, updated_at = now() WHERE id = ${id}`; break
      case 'next_contact_at': await sql`UPDATE prospects SET next_contact_at = ${dados.next_contact_at}, updated_at = now() WHERE id = ${id}`; break
      case 'last_contact_at': await sql`UPDATE prospects SET last_contact_at = ${dados.last_contact_at}, updated_at = now() WHERE id = ${id}`; break
    }
  }

  await addActivity(id, { userId, type: 'updated', description: 'Dados atualizados' })
  return getProspect(id)
}

export async function moveProspect(id, status, { userId = null } = {}) {
  const atual = await getProspect(id)
  if (!atual) return null
  // 'converted' só é alcançável pela conversão, que cria o lead. A restrição
  // prospects_converted_check recusaria de qualquer forma.
  if (status === 'converted') return { erro: 'use_conversao' }

  const sql = getSql()
  await sql`UPDATE prospects SET status = ${status}, updated_at = now() WHERE id = ${id}`
  if (status !== atual.status) {
    await addActivity(id, {
      userId, type: 'status_changed',
      fromValue: atual.status, toValue: status,
      description: `Status alterado de ${atual.status} para ${status}`,
    })
  }
  return { prospect: await getProspect(id) }
}

export async function addActivity(prospectId, { userId = null, type, description = null, fromValue = null, toValue = null }) {
  const sql = getSql()
  await sql`
    INSERT INTO prospect_activities (prospect_id, user_id, type, description, from_value, to_value)
    VALUES (${prospectId}, ${userId}, ${type}, ${description}, ${fromValue}, ${toValue})
  `
}

export async function listActivities(prospectId) {
  const sql = getSql()
  return sql`
    SELECT a.id, a.type, a.description, a.from_value, a.to_value, a.created_at,
           u.name AS user_name
      FROM prospect_activities a
      LEFT JOIN users u ON u.id = a.user_id
     WHERE a.prospect_id = ${prospectId}
     ORDER BY a.created_at DESC
  `
}

// --- Conversão --------------------------------------------------------------

/**
 * Prospect vira lead: entra no funil do CRM.
 *
 * Idempotente: chamar duas vezes devolve o mesmo lead. Se já existe um lead
 * aberto com o mesmo contato, vincula a ele em vez de criar outro — senão a
 * prospecção duplicaria o que o formulário do site já trouxe.
 */
export async function convertProspectToLead(id, { userId = null } = {}) {
  const prospect = await getProspect(id)
  if (!prospect) return null

  if (prospect.converted_lead_id) {
    return { jaConvertido: true, leadId: prospect.converted_lead_id, prospect }
  }

  const { createLead, findOpenLeadByContact } = await import('./crm.js')

  let lead = await findOpenLeadByContact({
    email: prospect.email,
    phone: prospect.phone,
  })
  let criado = false

  if (!lead) {
    lead = await createLead(
      {
        name: prospect.contact_name || prospect.company_name,
        company_name: prospect.company_name,
        email: prospect.email,
        phone: prospect.phone,
        service_interest: prospect.segment,
        source: 'prospeccao',
        source_detail: prospect.source,
        notes: prospect.notes,
        owner_id: prospect.owner_id ?? userId,
      },
      { userId },
    )
    criado = true
  }

  const sql = getSql()
  await sql`
    UPDATE prospects
       SET status = 'converted', converted_lead_id = ${lead.id},
           converted_at = now(), updated_at = now()
     WHERE id = ${id}
  `
  await addActivity(id, {
    userId, type: 'converted', toValue: lead.id,
    description: criado ? 'Convertido em novo lead' : 'Vinculado a lead existente',
  })

  return { jaConvertido: false, leadCriado: criado, leadId: lead.id, lead, prospect: await getProspect(id) }
}

// --- Importação CSV ---------------------------------------------------------

/**
 * Analisa CSV respeitando aspas e quebras de linha dentro de campo.
 * Um split(',') ingênuo quebraria em "Empresa, Filial SP" — que é exatamente
 * o formato de nome que aparece em lista comprada.
 */
export function parseCsv(texto) {
  const linhas = []
  let campo = ''
  let linha = []
  let dentroDeAspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]

    if (dentroDeAspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++ }
      else if (c === '"') dentroDeAspas = false
      else campo += c
      continue
    }

    if (c === '"') { dentroDeAspas = true; continue }
    if (c === ',' || c === ';') { linha.push(campo); campo = ''; continue }
    if (c === '\r') continue
    if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; continue }
    campo += c
  }
  if (campo !== '' || linha.length > 0) { linha.push(campo); linhas.push(linha) }

  return linhas.filter((l) => l.some((v) => v.trim() !== ''))
}

/** Aceita cabeçalhos em português ou inglês — planilha vem como vier. */
const ALIAS = {
  company_name: ['company_name', 'empresa', 'razao social', 'razão social', 'nome da empresa', 'company'],
  contact_name: ['contact_name', 'contato', 'nome', 'responsavel', 'responsável', 'name'],
  email: ['email', 'e-mail'],
  phone: ['phone', 'telefone', 'celular', 'whatsapp', 'fone'],
  website: ['website', 'site', 'url'],
  social: ['social', 'instagram', 'linkedin', 'rede social'],
  segment: ['segment', 'segmento', 'setor', 'ramo'],
  city: ['city', 'cidade', 'municipio', 'município'],
  notes: ['notes', 'observacoes', 'observações', 'notas', 'obs'],
}

export function mapearCabecalho(cabecalho) {
  const mapa = {}
  cabecalho.forEach((bruto, i) => {
    const limpo = bruto.trim().toLowerCase()
    for (const [campo, nomes] of Object.entries(ALIAS)) {
      if (nomes.includes(limpo)) { mapa[campo] = i; return }
    }
  })
  return mapa
}
