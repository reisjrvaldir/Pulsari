import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import { getProposal, updateProposal } from '../_lib/proposals.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'PATCH'])) return

  const acao = req.method === 'GET' ? 'read' : 'write'
  const user = await requireRole(req, res, 'proposals', acao)
  if (!user) return

  const id = String(req.query?.id ?? '')
  const proposal = await getProposal(id)
  if (!proposal) return json(res, 404, { error: 'Proposta não encontrada' })

  if (req.method === 'GET') return json(res, 200, { proposal })

  // Depois de enviada, o conteúdo da proposta é o que o cliente está lendo.
  // Editar exige devolvê-la a rascunho de forma explícita — mesma regra que o
  // gatilho do banco aplica aos itens.
  if (proposal.status !== 'draft') {
    return json(res, 409, {
      error: `Só é possível editar uma proposta em rascunho (atual: ${proposal.status}).`,
    })
  }

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      client_id: { type: 'uuid' },
      lead_id: { type: 'uuid' },
      title: { type: 'string', min: 3, max: 200 },
      presentation: { type: 'string', max: 20000 },
      scope: { type: 'string', max: 20000 },
      deliverables: { type: 'string', max: 20000 },
      timeline: { type: 'string', max: 5000 },
      internal_notes: { type: 'string', max: 20000 },
      discount: { type: 'decimal' },
      valid_until: { type: 'datetime' },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  return json(res, 200, { proposal: await updateProposal(id, dados) })
}

export default withErrorHandling(handler)
