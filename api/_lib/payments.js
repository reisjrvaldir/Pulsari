import { timingSafeEqual } from 'node:crypto'
import { getSql } from './db.js'

/**
 * Pagamentos e confirmação por webhook.
 *
 * Três regras que não se negociam:
 *
 * 1. Só o webhook confirma. Nada vindo do navegador do cliente marca uma
 *    cobrança como paga — nem um retorno de sucesso, nem um parâmetro na URL.
 * 2. O valor recebido é conferido contra o valor esperado. Aceitar o número
 *    que o provedor manda sem comparar deixaria uma cobrança de R$ 1 quitar
 *    um projeto de R$ 10.000 se o payload fosse forjado ou trocado.
 * 3. Replay é inofensivo. O índice único em (provider, event_id) para o
 *    evento repetido antes de ele tocar no financeiro.
 */

/** Eventos do Asaas que representam dinheiro efetivamente recebido. */
const EVENTOS_PAGAMENTO = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'])
const EVENTOS_ATRASO = new Set(['PAYMENT_OVERDUE'])
const EVENTOS_ESTORNO = new Set(['PAYMENT_REFUNDED', 'PAYMENT_DELETED', 'PAYMENT_CHARGEBACK_REQUESTED'])

/**
 * Compara o token do webhook sem vazar tempo.
 * Uma comparação com === encurta na primeira diferença, e medir isso permite
 * descobrir o token caractere a caractere.
 */
export function tokenWebhookValido(recebido) {
  const esperado = process.env.ASAAS_WEBHOOK_TOKEN
  // Sem token configurado a rota recusa tudo. O contrário — liberar quando
  // falta configuração — transformaria um esquecimento em porta aberta.
  if (!esperado || typeof recebido !== 'string' || recebido.length === 0) return false

  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Identidade estável do evento, para o índice de idempotência. */
export function idDoEvento(payload) {
  if (payload?.id) return String(payload.id)
  const pagamento = payload?.payment?.id ?? 'sem-pagamento'
  const evento = payload?.event ?? 'sem-evento'
  const data = payload?.dateCreated ?? payload?.payment?.dateCreated ?? ''
  return `${evento}:${pagamento}:${data}`
}

/**
 * Registra o evento. Devolve `duplicado: true` quando já havia sido recebido —
 * e nesse caso nada mais deve acontecer.
 */
export async function registrarEvento({ eventId, eventType, payload }) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO webhook_events (provider, event_id, event_type, payload)
    VALUES ('asaas', ${eventId}, ${eventType ?? null}, ${JSON.stringify(payload)})
    ON CONFLICT (provider, event_id) DO NOTHING
    RETURNING id
  `
  if (rows.length === 0) return { duplicado: true, id: null }
  return { duplicado: false, id: rows[0].id }
}

async function marcarEvento(id, status, erro = null) {
  const sql = getSql()
  await sql`
    UPDATE webhook_events
       SET status = ${status}, processed_at = now(), error = ${erro}
     WHERE id = ${id}
  `
}

/**
 * Processa um evento já registrado.
 *
 * Devolve o desfecho em vez de lançar: o webhook precisa responder 200 mesmo
 * quando o evento não se aplica, senão o provedor reenvia indefinidamente um
 * evento que nunca vai ser aceito.
 */
export async function processarEvento(eventoId, payload) {
  const sql = getSql()
  const tipo = payload?.event
  const cobranca = payload?.payment

  if (!cobranca?.id) {
    await marcarEvento(eventoId, 'ignored', 'payload sem payment.id')
    return { desfecho: 'ignorado', motivo: 'sem_cobranca' }
  }

  const rows = await sql`
    SELECT id, proposal_id, client_id, amount, status
      FROM proposal_payments
     WHERE provider = 'asaas' AND provider_charge_id = ${String(cobranca.id)}
     LIMIT 1
  `
  const pagamento = rows[0]

  // Cobrança desconhecida: registramos e seguimos. Pode ser de outro sistema
  // usando a mesma conta Asaas — não é erro nosso e não deve virar retry.
  if (!pagamento) {
    await marcarEvento(eventoId, 'ignored', 'cobrança não pertence a este sistema')
    return { desfecho: 'ignorado', motivo: 'cobranca_desconhecida' }
  }

  if (EVENTOS_ATRASO.has(tipo)) {
    await sql`UPDATE proposal_payments SET status='overdue', updated_at=now() WHERE id=${pagamento.id}`
    await marcarEvento(eventoId, 'processed')
    return { desfecho: 'atraso' }
  }

  if (EVENTOS_ESTORNO.has(tipo)) {
    await sql`
      UPDATE proposal_payments SET status='refunded', paid_at=null, updated_at=now()
       WHERE id=${pagamento.id}
    `
    // O lançamento não é apagado: cancelar preserva o histórico contábil.
    await sql`
      UPDATE financial_transactions SET status='cancelled', updated_at=now()
       WHERE origin_type='proposal_payment' AND origin_id=${pagamento.id}
    `
    await marcarEvento(eventoId, 'processed')
    return { desfecho: 'estornado' }
  }

  if (!EVENTOS_PAGAMENTO.has(tipo)) {
    await marcarEvento(eventoId, 'ignored', `evento não tratado: ${tipo}`)
    return { desfecho: 'ignorado', motivo: 'evento_irrelevante' }
  }

  // --- Conferência de valor -------------------------------------------------
  // O provedor manda o valor pago; comparamos com o que cobramos. Divergência
  // não vira pagamento confirmado: fica marcado para conferência humana.
  const recebido = cobranca.value ?? cobranca.netValue
  const confere = await sql`
    SELECT (${String(recebido)}::numeric >= amount) AS ok, amount
      FROM proposal_payments WHERE id = ${pagamento.id}
  `
  if (!confere[0]?.ok) {
    await marcarEvento(
      eventoId, 'failed',
      `valor divergente: recebido ${recebido}, esperado ${confere[0]?.amount}`,
    )
    return { desfecho: 'divergencia', esperado: confere[0]?.amount, recebido }
  }

  // --- Confirmação ----------------------------------------------------------
  await sql`
    UPDATE proposal_payments
       SET status='confirmed', paid_at=now(), updated_at=now()
     WHERE id=${pagamento.id} AND status <> 'confirmed'
  `

  // Lançamento financeiro. O índice único da migration 004 garante que dois
  // eventos confirmando a mesma cobrança gerem um único lançamento.
  await sql`
    INSERT INTO financial_transactions
      (type, description, amount, status, transaction_date, paid_at,
       origin_type, origin_id, client_id, category_id)
    SELECT 'income',
           'Pagamento de proposta',
           pp.amount,
           'paid',
           current_date,
           now(),
           'proposal_payment',
           pp.id,
           pp.client_id,
           (SELECT id FROM financial_categories WHERE lower(name)='projetos' AND type='income' LIMIT 1)
      FROM proposal_payments pp WHERE pp.id = ${pagamento.id}
    ON CONFLICT DO NOTHING
  `

  // Pagar é a forma mais forte de aceitar. Se o cliente pagou sem passar pelo
  // botão de aceite na página, o aceite é registrado aqui — com o valor pago
  // como total congelado. Sem isto a restrição proposals_accepted_check
  // recusaria a transição, porque 'paid' exige aceite registrado.
  await sql`
    UPDATE proposals
       SET status = 'paid',
           accepted_at = coalesce(accepted_at, now()),
           accepted_by = coalesce(accepted_by, 'Confirmado por pagamento'),
           accepted_total = coalesce(
             accepted_total,
             (SELECT amount FROM proposal_payments WHERE id = ${pagamento.id})
           ),
           updated_at = now()
     WHERE id = ${pagamento.proposal_id} AND status IN ('accepted','sent','viewed')
  `

  await marcarEvento(eventoId, 'processed')
  return { desfecho: 'confirmado', pagamentoId: pagamento.id, propostaId: pagamento.proposal_id }
}

// --- Linha do tempo do cliente ---------------------------------------------

/**
 * Marcos visíveis ao cliente.
 *
 * Projeção deliberadamente pobre: sem sprint, sem card, sem responsável, sem
 * id interno. O cliente vê o que foi publicado para ele, não um reflexo do
 * kanban da equipe.
 */
export async function getClientTimeline(clientId, { projectId = null } = {}) {
  const sql = getSql()
  return sql`
    SELECT title, description, status, position, published_at
      FROM client_timeline_events
     WHERE client_id = ${clientId}
       AND (${projectId}::uuid IS NULL OR project_id = ${projectId})
     ORDER BY position ASC, published_at ASC
  `
}

export async function publicarMarco({ clientId, projectId = null, proposalId = null, sprintId = null, title, description = null, status = 'pending', position = 0, userId = null }) {
  const sql = getSql()
  const rows = await sql`
    INSERT INTO client_timeline_events
      (client_id, project_id, proposal_id, sprint_id, title, description, status, position, created_by)
    VALUES (${clientId}, ${projectId}, ${proposalId}, ${sprintId}, ${title},
            ${description}, ${status}, ${position}, ${userId})
    ON CONFLICT (sprint_id) WHERE sprint_id IS NOT NULL DO NOTHING
    RETURNING id
  `
  return rows[0] ?? null
}
