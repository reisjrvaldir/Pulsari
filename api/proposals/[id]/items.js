import { getSql } from '../../_lib/db.js'
import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../../_lib/http.js'
import { ValidationError, pick } from '../../_lib/validate.js'
import { getProposal, listItems } from '../../_lib/proposals.js'

/**
 * Itens da proposta.
 *
 * PUT substitui a lista inteira, em vez de expor CRUD por item. O builder é
 * um formulário com linhas: o usuário adiciona, remove e reordena, e salva o
 * conjunto. Sincronizar isso com chamadas por item geraria estado parcial na
 * tela a cada falha de rede.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'PUT'])) return

  const acao = req.method === 'GET' ? 'read' : 'write'
  const user = await requireRole(req, res, 'proposals', acao)
  if (!user) return

  const id = String(req.query?.id ?? '')
  const proposal = await getProposal(id)
  if (!proposal) return json(res, 404, { error: 'Proposta não encontrada' })

  if (req.method === 'GET') return json(res, 200, { items: proposal.items })

  // O gatilho do banco recusaria de qualquer forma; responder aqui dá uma
  // mensagem útil em vez de um erro de constraint.
  if (proposal.status !== 'draft') {
    return json(res, 409, {
      error: `Itens só podem ser alterados em rascunho (atual: ${proposal.status}).`,
    })
  }

  const body = await readJsonBody(req)
  if (!Array.isArray(body?.items)) {
    return json(res, 400, { error: 'Envie a lista completa de itens.' })
  }
  if (body.items.length > 100) {
    return json(res, 400, { error: 'Máximo de 100 itens por proposta.' })
  }

  const itens = []
  for (const [i, bruto] of body.items.entries()) {
    let item
    try {
      item = pick(bruto, {
        description: { type: 'string', required: true, min: 1, max: 500 },
        quantity: { type: 'decimal' },
        unit_price: { type: 'decimal' },
      })
    } catch (err) {
      if (err instanceof ValidationError) {
        // A linha do erro importa: num formulário de 20 itens, "descrição
        // obrigatória" sem o índice não diz onde corrigir.
        return json(res, 400, { error: `Item ${i + 1} inválido`, linha: i + 1, campos: err.errors })
      }
      throw err
    }

    if (item.quantity != null && item.quantity <= 0) {
      return json(res, 400, {
        error: `Quantidade do item ${i + 1} deve ser maior que zero.`,
        linha: i + 1,
      })
    }
    itens.push(item)
  }

  const sql = getSql()

  // Substituição completa. Sem transação interativa no driver HTTP da Neon,
  // então há uma janela entre apagar e reinserir — aceitável porque só o
  // rascunho é afetado e ninguém mais o está lendo.
  await sql`DELETE FROM proposal_items WHERE proposal_id = ${id}`
  for (const [i, item] of itens.entries()) {
    await sql`
      INSERT INTO proposal_items (proposal_id, description, quantity, unit_price, position)
      VALUES (${id}, ${item.description}, ${item.quantity ?? 1}, ${item.unit_price ?? 0}, ${i + 1})
    `
  }

  return json(res, 200, { items: await listItems(id) })
}

export default withErrorHandling(handler)
