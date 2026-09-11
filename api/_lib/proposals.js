import { randomBytes } from 'node:crypto'
import { getSql } from './db.js'

/**
 * Propostas comerciais.
 *
 * A regra que organiza este módulo: existem duas projeções dos mesmos dados,
 * e elas nunca se misturam.
 *
 *   projecaoInterna  → tudo, para a equipe autenticada
 *   projecaoPublica  → só o que pode ser servido a quem tem o link
 *
 * O caminho público NUNCA seleciona `*`. Cada campo que chega ao visitante
 * está escrito explicitamente abaixo, para que acrescentar uma coluna
 * sensível à tabela não a exponha por descuido.
 */

/** 32 bytes = 256 bits. Adivinhar ou enumerar é inviável. */
export function gerarToken() {
  return randomBytes(32).toString('base64url')
}

export const STATUS_PROPOSTA = [
  'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'paid',
]

/** Estados em que a proposta ainda pode ser aberta pelo link. */
const VISIVEIS_PUBLICAMENTE = ['sent', 'viewed', 'accepted', 'paid']

// --- Leitura interna --------------------------------------------------------

export async function listProposals({ status, clientId, search } = {}) {
  const sql = getSql()
  const termo = search ? `%${String(search).trim().toLowerCase()}%` : null
  return sql`
    SELECT p.id, p.title, p.status, p.valid_until, p.discount,
           p.sent_at, p.first_viewed_at, p.accepted_at, p.accepted_total,
           p.created_at, p.updated_at,
           c.name AS client_name, p.client_id, p.lead_id,
           coalesce((SELECT sum(line_total) FROM proposal_items i WHERE i.proposal_id = p.id), 0) AS items_total,
           (SELECT count(*) FROM proposal_views v WHERE v.proposal_id = p.id) AS view_count
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
     WHERE (${status ?? null}::text IS NULL OR p.status = ${status ?? null})
       AND (${clientId ?? null}::uuid IS NULL OR p.client_id = ${clientId ?? null})
       AND (${termo}::text IS NULL OR lower(p.title) LIKE ${termo})
     ORDER BY p.created_at DESC
  `
}

export async function getProposal(id) {
  const sql = getSql()
  const rows = await sql`
    SELECT p.*, c.name AS client_name,
           coalesce((SELECT sum(line_total) FROM proposal_items i WHERE i.proposal_id = p.id), 0) AS items_total
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
     WHERE p.id = ${id} LIMIT 1
  `
  if (!rows[0]) return null
  return { ...rows[0], items: await listItems(id) }
}

export async function listItems(proposalId) {
  const sql = getSql()
  return sql`
    SELECT id, description, quantity, unit_price, line_total, position
      FROM proposal_items WHERE proposal_id = ${proposalId}
     ORDER BY position ASC, created_at ASC
  `
}

// --- Escrita interna --------------------------------------------------------

export async function createProposal(dados, { userId }) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO proposals (client_id, lead_id, title, presentation, scope,
                           deliverables, timeline, internal_notes,
                           discount, valid_until, public_token, created_by)
    VALUES (${dados.client_id ?? null}, ${dados.lead_id ?? null}, ${dados.title},
            ${dados.presentation ?? null}, ${dados.scope ?? null},
            ${dados.deliverables ?? null}, ${dados.timeline ?? null},
            ${dados.internal_notes ?? null}, ${dados.discount ?? 0},
            ${dados.valid_until ?? null}, ${gerarToken()}, ${userId})
    RETURNING id
  `
  return getProposal(rows[0].id)
}

const EDITAVEL = [
  'client_id', 'lead_id', 'title', 'presentation', 'scope',
  'deliverables', 'timeline', 'internal_notes', 'discount', 'valid_until',
]

export async function updateProposal(id, dados) {
  const atual = await getProposal(id)
  if (!atual) return null
  const sql = getSql()

  for (const campo of Object.keys(dados).filter((k) => EDITAVEL.includes(k))) {
    switch (campo) {
      case 'client_id': await sql`UPDATE proposals SET client_id = ${dados.client_id}, updated_at = now() WHERE id = ${id}`; break
      case 'lead_id': await sql`UPDATE proposals SET lead_id = ${dados.lead_id}, updated_at = now() WHERE id = ${id}`; break
      case 'title': await sql`UPDATE proposals SET title = ${dados.title}, updated_at = now() WHERE id = ${id}`; break
      case 'presentation': await sql`UPDATE proposals SET presentation = ${dados.presentation}, updated_at = now() WHERE id = ${id}`; break
      case 'scope': await sql`UPDATE proposals SET scope = ${dados.scope}, updated_at = now() WHERE id = ${id}`; break
      case 'deliverables': await sql`UPDATE proposals SET deliverables = ${dados.deliverables}, updated_at = now() WHERE id = ${id}`; break
      case 'timeline': await sql`UPDATE proposals SET timeline = ${dados.timeline}, updated_at = now() WHERE id = ${id}`; break
      case 'internal_notes': await sql`UPDATE proposals SET internal_notes = ${dados.internal_notes}, updated_at = now() WHERE id = ${id}`; break
      case 'discount': await sql`UPDATE proposals SET discount = ${dados.discount}, updated_at = now() WHERE id = ${id}`; break
      case 'valid_until': await sql`UPDATE proposals SET valid_until = ${dados.valid_until}, updated_at = now() WHERE id = ${id}`; break
    }
  }
  return getProposal(id)
}

/** Enviar é irreversível pela API: a partir daqui os itens travam no banco. */
export async function sendProposal(id) {
  const sql = getSql()
  const rows = await sql`
    UPDATE proposals SET status = 'sent', sent_at = now(), updated_at = now()
     WHERE id = ${id} AND status = 'draft'
     RETURNING id
  `
  if (rows.length === 0) return null
  return getProposal(id)
}

// --- Caminho público --------------------------------------------------------

/**
 * Busca pela URL pública. Devolve null para token inexistente, proposta ainda
 * em rascunho, recusada ou vencida — todos os casos respondem igual na rota,
 * para que ninguém descubra tokens válidos pela diferença de resposta.
 */
export async function getPublicProposal(token) {
  if (typeof token !== 'string' || token.length < 32) return null
  const sql = getSql()

  // Seleção explícita, campo a campo. `internal_notes`, `created_by`,
  // `accepted_ip` e os ids internos ficam de fora deliberadamente.
  const rows = await sql`
    SELECT p.id, p.title, p.presentation, p.scope, p.deliverables, p.timeline,
           p.discount, p.valid_until, p.status,
           p.accepted_at, p.accepted_by, p.accepted_total,
           c.name AS client_name,
           coalesce((SELECT sum(line_total) FROM proposal_items i WHERE i.proposal_id = p.id), 0) AS items_total
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
     WHERE p.public_token = ${token}
     LIMIT 1
  `
  const p = rows[0]
  if (!p) return null
  if (!VISIVEIS_PUBLICAMENTE.includes(p.status)) return null

  const vencida = p.valid_until && new Date(p.valid_until) < new Date(new Date().toDateString())
  // Vencida ainda é mostrada, mas marcada: o cliente precisa entender por que
  // não consegue aceitar, em vez de receber um 404 sem explicação.
  const items = await sql`
    SELECT description, quantity, unit_price, line_total
      FROM proposal_items WHERE proposal_id = ${p.id}
     ORDER BY position ASC, created_at ASC
  `

  const { id, ...semId } = p
  return { ...semId, items, vencida: Boolean(vencida), _id: id }
}

export async function registerView(proposalId, { ip, userAgent, referer }) {
  const sql = getSql()
  await sql`
    INSERT INTO proposal_views (proposal_id, ip, user_agent, referer)
    VALUES (${proposalId}, ${ip ?? null}, ${userAgent ?? null}, ${referer ?? null})
  `
  // Primeira visualização move o status e carimba a data, uma única vez.
  await sql`
    UPDATE proposals
       SET first_viewed_at = coalesce(first_viewed_at, now()),
           status = CASE WHEN status = 'sent' THEN 'viewed' ELSE status END,
           updated_at = now()
     WHERE id = ${proposalId}
  `
}

/**
 * Aceite pelo cliente. Idempotente: a segunda chamada devolve o mesmo
 * resultado sem sobrescrever quem aceitou nem o valor congelado.
 */
export async function acceptProposal(token, { nome, ip }) {
  const sql = getSql()
  const rows = await sql`
    SELECT id, status, valid_until,
           coalesce((SELECT sum(line_total) FROM proposal_items i WHERE i.proposal_id = proposals.id), 0) AS items_total,
           discount
      FROM proposals WHERE public_token = ${token} LIMIT 1
  `
  const p = rows[0]
  if (!p) return { erro: 'nao_encontrada' }
  if (p.status === 'accepted' || p.status === 'paid') return { erro: null, jaAceita: true }
  if (!['sent', 'viewed'].includes(p.status)) return { erro: 'indisponivel' }
  if (p.valid_until && new Date(p.valid_until) < new Date(new Date().toDateString())) {
    return { erro: 'vencida' }
  }

  // O total é calculado no banco e congelado aqui. `WHERE status IN (...)`
  // faz a escrita falhar em silêncio se outra requisição aceitou primeiro —
  // é o que torna o duplo clique inofensivo.
  const upd = await sql`
    UPDATE proposals
       SET status = 'accepted', accepted_at = now(), accepted_by = ${nome},
           accepted_ip = ${ip ?? null},
           accepted_total = greatest(${p.items_total}::numeric - ${p.discount}::numeric, 0),
           updated_at = now()
     WHERE public_token = ${token} AND status IN ('sent','viewed')
     RETURNING accepted_total, accepted_at
  `
  if (upd.length === 0) return { erro: null, jaAceita: true }
  return { erro: null, jaAceita: false, total: upd[0].accepted_total }
}
