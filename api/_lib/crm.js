import { getSql } from './db.js'
import { OPEN_LEAD_STATUSES, normalizeEmail, normalizePhone } from './validate.js'

/**
 * Camada de dados do CRM.
 *
 * O driver HTTP da Neon não abre transação interativa (read-then-write dentro
 * de uma mesma transação). Onde isso importaria — criação de cliente na
 * conversão — a integridade é garantida pelo índice único em `email_norm` mais
 * `ON CONFLICT`, e não por um bloqueio otimista na aplicação. Duas conversões
 * simultâneas do mesmo e-mail convergem para o mesmo cliente.
 */

// --- Leads ------------------------------------------------------------------

export async function listLeads({ status, ownerId, search, overdueOnly } = {}) {
  const sql = getSql()
  const termo = search ? `%${String(search).trim().toLowerCase()}%` : null

  return sql`
    SELECT l.id, l.name, l.company_name, l.email, l.phone, l.whatsapp,
           l.source, l.source_detail, l.service_interest, l.estimated_value,
           l.score, l.status, l.owner_id, l.notes,
           l.last_contact_at, l.next_contact_at, l.board_position,
           l.converted_client_id, l.converted_at,
           l.created_at, l.updated_at,
           u.name AS owner_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.owner_id
     WHERE (${status ?? null}::text IS NULL OR l.status = ${status ?? null})
       AND (${ownerId ?? null}::uuid IS NULL OR l.owner_id = ${ownerId ?? null})
       AND (${termo}::text IS NULL OR
            lower(l.name) LIKE ${termo} OR
            lower(coalesce(l.company_name,'')) LIKE ${termo} OR
            lower(coalesce(l.email,'')) LIKE ${termo} OR
            coalesce(l.phone_norm,'') LIKE ${termo})
       AND (${Boolean(overdueOnly)} = false OR
            (l.next_contact_at IS NOT NULL AND l.next_contact_at < now()))
     ORDER BY l.board_position ASC, l.created_at DESC
  `
}

export async function getLead(id) {
  const sql = getSql()
  const rows = await sql`
    SELECT l.id, l.name, l.company_name, l.email, l.phone, l.whatsapp,
           l.source, l.source_detail, l.service_interest, l.estimated_value,
           l.score, l.status, l.owner_id, l.notes,
           l.last_contact_at, l.next_contact_at, l.board_position,
           l.converted_client_id, l.converted_at,
           l.created_at, l.updated_at, u.name AS owner_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.owner_id
     WHERE l.id = ${id}
     LIMIT 1
  `
  return rows[0] ?? null
}

/**
 * Procura um lead ainda em disputa com o mesmo contato.
 * É o coração da deduplicação: o visitante que preenche o formulário duas
 * vezes não vira dois cards no quadro.
 */
export async function findOpenLeadByContact({ email, phone, whatsapp }) {
  const emailNorm = normalizeEmail(email)
  const phoneNorm = normalizePhone(phone) ?? normalizePhone(whatsapp)
  if (!emailNorm && !phoneNorm) return null

  const sql = getSql()
  const rows = await sql`
    SELECT l.id, l.name, l.company_name, l.email, l.phone, l.whatsapp,
           l.source, l.source_detail, l.service_interest, l.estimated_value,
           l.score, l.status, l.owner_id, l.notes,
           l.last_contact_at, l.next_contact_at, l.board_position,
           l.converted_client_id, l.converted_at,
           l.created_at, l.updated_at
      FROM leads l
     WHERE l.status = ANY(${OPEN_LEAD_STATUSES})
       AND (
         (${emailNorm}::text IS NOT NULL AND l.email_norm = ${emailNorm}) OR
         (${phoneNorm}::text IS NOT NULL AND l.phone_norm = ${phoneNorm})
       )
     ORDER BY l.created_at DESC
     LIMIT 1
  `
  return rows[0] ?? null
}

/** Nova posição no fim da coluna, para o card não aparecer no meio do quadro. */
async function nextPosition(status) {
  const sql = getSql()
  const rows = await sql`
    SELECT coalesce(max(board_position), 0) + 1 AS pos FROM leads WHERE status = ${status}
  `
  return Number(rows[0]?.pos ?? 1)
}

export async function createLead(dados, { userId = null } = {}) {
  const sql = getSql()
  const status = dados.status ?? 'new'
  const pos = await nextPosition(status)

  const rows = await sql`
    INSERT INTO leads (
      name, company_name, email, phone, whatsapp,
      source, source_detail, service_interest, estimated_value,
      score, status, owner_id, notes, next_contact_at, board_position
    ) VALUES (
      ${dados.name}, ${dados.company_name ?? null}, ${dados.email ?? null},
      ${dados.phone ?? null}, ${dados.whatsapp ?? null},
      ${dados.source ?? 'website'}, ${dados.source_detail ?? null},
      ${dados.service_interest ?? null}, ${dados.estimated_value ?? null},
      ${dados.score ?? 0}, ${status}, ${dados.owner_id ?? null},
      ${dados.notes ?? null}, ${dados.next_contact_at ?? null}, ${pos}
    )
    RETURNING id
  `
  const id = rows[0].id
  await addActivity(id, {
    userId,
    type: 'created',
    description: `Lead criado via ${dados.source ?? 'website'}`,
  })
  return getLead(id)
}

/** Campos editáveis pela equipe. `status` não entra: move() é quem muda fase. */
const CAMPOS_EDITAVEIS = [
  'name', 'company_name', 'email', 'phone', 'whatsapp',
  'source_detail', 'service_interest', 'estimated_value', 'score',
  'owner_id', 'notes', 'last_contact_at', 'next_contact_at',
]

export async function updateLead(id, dados, { userId = null } = {}) {
  const anterior = await getLead(id)
  if (!anterior) return null

  const sql = getSql()
  const campos = Object.keys(dados).filter((k) => CAMPOS_EDITAVEIS.includes(k))
  if (campos.length === 0) return anterior

  // Uma coluna por chamada mantém a query parametrizada sem montar SQL por
  // concatenação — o driver da Neon não aceita identificadores como parâmetro.
  for (const campo of campos) {
    switch (campo) {
      case 'name': await sql`UPDATE leads SET name = ${dados.name}, updated_at = now() WHERE id = ${id}`; break
      case 'company_name': await sql`UPDATE leads SET company_name = ${dados.company_name}, updated_at = now() WHERE id = ${id}`; break
      case 'email': await sql`UPDATE leads SET email = ${dados.email}, updated_at = now() WHERE id = ${id}`; break
      case 'phone': await sql`UPDATE leads SET phone = ${dados.phone}, updated_at = now() WHERE id = ${id}`; break
      case 'whatsapp': await sql`UPDATE leads SET whatsapp = ${dados.whatsapp}, updated_at = now() WHERE id = ${id}`; break
      case 'source_detail': await sql`UPDATE leads SET source_detail = ${dados.source_detail}, updated_at = now() WHERE id = ${id}`; break
      case 'service_interest': await sql`UPDATE leads SET service_interest = ${dados.service_interest}, updated_at = now() WHERE id = ${id}`; break
      case 'estimated_value': await sql`UPDATE leads SET estimated_value = ${dados.estimated_value}, updated_at = now() WHERE id = ${id}`; break
      case 'score': await sql`UPDATE leads SET score = ${dados.score}, updated_at = now() WHERE id = ${id}`; break
      case 'owner_id': await sql`UPDATE leads SET owner_id = ${dados.owner_id}, updated_at = now() WHERE id = ${id}`; break
      case 'notes': await sql`UPDATE leads SET notes = ${dados.notes}, updated_at = now() WHERE id = ${id}`; break
      case 'last_contact_at': await sql`UPDATE leads SET last_contact_at = ${dados.last_contact_at}, updated_at = now() WHERE id = ${id}`; break
      case 'next_contact_at': await sql`UPDATE leads SET next_contact_at = ${dados.next_contact_at}, updated_at = now() WHERE id = ${id}`; break
    }
  }

  if (campos.includes('owner_id') && dados.owner_id !== anterior.owner_id) {
    await addActivity(id, {
      userId, type: 'owner_changed',
      fromValue: anterior.owner_id, toValue: dados.owner_id,
      description: 'Responsável alterado',
    })
  }
  if (campos.includes('next_contact_at') && dados.next_contact_at) {
    await addActivity(id, {
      userId, type: 'follow_up_scheduled',
      toValue: dados.next_contact_at,
      description: 'Follow-up agendado',
    })
  }

  const campoNaoRastreado = campos.some(
    (c) => !['owner_id', 'next_contact_at'].includes(c),
  )
  if (campoNaoRastreado) {
    await addActivity(id, { userId, type: 'updated', description: 'Dados atualizados' })
  }

  return getLead(id)
}

/**
 * Move o lead no quadro. Não força ordem entre as fases: voltar de
 * `negotiation` para `contacted` é legítimo quando o negócio esfria.
 */
export async function moveLead(id, { status, position }, { userId = null } = {}) {
  const anterior = await getLead(id)
  if (!anterior) return null

  const sql = getSql()
  const pos = position ?? (status !== anterior.status ? await nextPosition(status) : anterior.board_position)

  await sql`
    UPDATE leads SET status = ${status}, board_position = ${pos}, updated_at = now()
     WHERE id = ${id}
  `

  if (status !== anterior.status) {
    await addActivity(id, {
      userId, type: 'status_changed',
      fromValue: anterior.status, toValue: status,
      description: `Movido de ${anterior.status} para ${status}`,
    })
  }
  return getLead(id)
}

// --- Histórico --------------------------------------------------------------

export async function addActivity(leadId, { userId = null, type, description = null, fromValue = null, toValue = null }) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO lead_activities (lead_id, user_id, type, description, from_value, to_value)
    VALUES (${leadId}, ${userId}, ${type}, ${description}, ${fromValue}, ${toValue})
    RETURNING id, created_at
  `
  return rows[0]
}

export async function listActivities(leadId) {
  const sql = getSql()
  return sql`
    SELECT a.id, a.type, a.description, a.from_value, a.to_value, a.created_at,
           u.name AS user_name
      FROM lead_activities a
      LEFT JOIN users u ON u.id = a.user_id
     WHERE a.lead_id = ${leadId}
     ORDER BY a.created_at DESC
  `
}

// --- Clientes ---------------------------------------------------------------

export async function listClients({ status, search } = {}) {
  const sql = getSql()
  const termo = search ? `%${String(search).trim().toLowerCase()}%` : null
  return sql`
    SELECT id, name, company_name, email, phone, whatsapp, document,
           notes, status, created_at, updated_at
      FROM clients
     WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
       AND (${termo}::text IS NULL OR
            lower(name) LIKE ${termo} OR
            lower(coalesce(company_name,'')) LIKE ${termo} OR
            lower(coalesce(email,'')) LIKE ${termo})
     ORDER BY name ASC
  `
}

export async function getClient(id) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, name, company_name, email, phone, whatsapp, document,
           notes, status, created_at, updated_at
      FROM clients WHERE id = ${id} LIMIT 1
  `
  return rows[0] ?? null
}

export async function findClientByContact({ email, phone, whatsapp }) {
  const emailNorm = normalizeEmail(email)
  const phoneNorm = normalizePhone(phone) ?? normalizePhone(whatsapp)
  if (!emailNorm && !phoneNorm) return null

  const sql = getSql()
  const rows = await sql`
    SELECT id, name, email, phone, status FROM clients
     WHERE (${emailNorm}::text IS NOT NULL AND email_norm = ${emailNorm})
        OR (${phoneNorm}::text IS NOT NULL AND phone_norm = ${phoneNorm})
     ORDER BY created_at ASC
     LIMIT 1
  `
  return rows[0] ?? null
}

export async function createClient(dados) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO clients (name, company_name, email, phone, whatsapp, document, notes, status)
    VALUES (${dados.name}, ${dados.company_name ?? null}, ${dados.email ?? null},
            ${dados.phone ?? null}, ${dados.whatsapp ?? null}, ${dados.document ?? null},
            ${dados.notes ?? null}, ${dados.status ?? 'active'})
    ON CONFLICT (email_norm) WHERE email_norm IS NOT NULL DO NOTHING
    RETURNING id
  `
  // Conflito: outro processo criou o mesmo cliente entre a checagem e o insert.
  if (rows.length === 0) {
    const existente = await findClientByContact(dados)
    return existente ? getClient(existente.id) : null
  }
  return getClient(rows[0].id)
}

const CLIENTE_EDITAVEL = [
  'name', 'company_name', 'email', 'phone', 'whatsapp', 'document', 'notes', 'status',
]

export async function updateClient(id, dados) {
  const atual = await getClient(id)
  if (!atual) return null
  const sql = getSql()

  for (const campo of Object.keys(dados).filter((k) => CLIENTE_EDITAVEL.includes(k))) {
    switch (campo) {
      case 'name': await sql`UPDATE clients SET name = ${dados.name}, updated_at = now() WHERE id = ${id}`; break
      case 'company_name': await sql`UPDATE clients SET company_name = ${dados.company_name}, updated_at = now() WHERE id = ${id}`; break
      case 'email': await sql`UPDATE clients SET email = ${dados.email}, updated_at = now() WHERE id = ${id}`; break
      case 'phone': await sql`UPDATE clients SET phone = ${dados.phone}, updated_at = now() WHERE id = ${id}`; break
      case 'whatsapp': await sql`UPDATE clients SET whatsapp = ${dados.whatsapp}, updated_at = now() WHERE id = ${id}`; break
      case 'document': await sql`UPDATE clients SET document = ${dados.document}, updated_at = now() WHERE id = ${id}`; break
      case 'notes': await sql`UPDATE clients SET notes = ${dados.notes}, updated_at = now() WHERE id = ${id}`; break
      case 'status': await sql`UPDATE clients SET status = ${dados.status}, updated_at = now() WHERE id = ${id}`; break
    }
  }
  return getClient(id)
}

// --- Conversão --------------------------------------------------------------

/**
 * Marca o lead como ganho e garante que exista um cliente correspondente.
 *
 * Idempotente em três camadas:
 *  1. lead já convertido → devolve o mesmo cliente, sem criar nada;
 *  2. já existe cliente com aquele contato → vincula em vez de duplicar;
 *  3. corrida entre dois processos → `ON CONFLICT` no índice único converge.
 */
export async function convertLeadToClient(leadId, { userId = null } = {}) {
  const lead = await getLead(leadId)
  if (!lead) return null

  if (lead.converted_client_id) {
    return { lead, client: await getClient(lead.converted_client_id), jaConvertido: true }
  }

  let client = await findClientByContact(lead)
  let criado = false

  if (!client) {
    client = await createClient({
      name: lead.name,
      company_name: lead.company_name,
      email: lead.email,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      notes: lead.notes,
      status: 'active',
    })
    criado = true
  } else {
    client = await getClient(client.id)
  }

  if (!client) return null

  const sql = getSql()
  const pos = await nextPosition('won')
  await sql`
    UPDATE leads
       SET status = 'won', converted_client_id = ${client.id},
           converted_at = now(), board_position = ${pos}, updated_at = now()
     WHERE id = ${leadId}
  `

  await addActivity(leadId, {
    userId,
    type: 'converted',
    fromValue: lead.status,
    toValue: 'won',
    description: criado
      ? `Convertido em novo cliente: ${client.name}`
      : `Vinculado a cliente existente: ${client.name}`,
  })

  return { lead: await getLead(leadId), client, jaConvertido: false, clienteCriado: criado }
}
