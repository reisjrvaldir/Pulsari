import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import { STATUS_PROPOSTA, createProposal, listProposals } from '../_lib/proposals.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') {
    const user = await requireRole(req, res, 'proposals', 'read')
    if (!user) return

    const { status, cliente, q } = req.query ?? {}
    if (status && !STATUS_PROPOSTA.includes(String(status))) {
      return json(res, 400, { error: 'Status inválido' })
    }
    return json(res, 200, {
      proposals: await listProposals({
        status: status ? String(status) : null,
        clientId: cliente ? String(cliente) : null,
        search: q ? String(q) : null,
      }),
    })
  }

  const user = await requireRole(req, res, 'proposals', 'write')
  if (!user) return

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      client_id: { type: 'uuid' },
      lead_id: { type: 'uuid' },
      title: { type: 'string', required: true, min: 3, max: 200 },
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

  // `status` e `public_token` não estão no esquema: nascem no banco. Aceitar
  // um token do cliente deixaria alguém escolher a própria URL pública.
  const proposal = await createProposal(dados, { userId: user.id })
  return json(res, 201, { proposal })
}

export default withErrorHandling(handler)
