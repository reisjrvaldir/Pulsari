import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../../_lib/http.js'
import { ValidationError, pick } from '../../_lib/validate.js'
import { addActivity, getLead, listActivities, updateLead } from '../../_lib/crm.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  const acao = req.method === 'GET' ? 'read' : 'write'
  const user = await requireRole(req, res, 'leads', acao)
  if (!user) return

  const id = String(req.query?.id ?? '')
  const lead = await getLead(id)
  if (!lead) return json(res, 404, { error: 'Lead não encontrado' })

  if (req.method === 'GET') {
    return json(res, 200, { activities: await listActivities(id) })
  }

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      type: { type: 'enum', values: ['note', 'contact'], required: true },
      description: { type: 'string', required: true, max: 5000 },
      next_contact_at: { type: 'datetime' },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  await addActivity(id, {
    userId: user.id,
    type: dados.type,
    description: dados.description,
  })

  // Registrar um contato move o relógio do follow-up: `last_contact_at` passa
  // a ser agora, e o próximo passo fica agendado se veio na requisição.
  const patch = {}
  if (dados.type === 'contact') patch.last_contact_at = new Date().toISOString()
  if (dados.next_contact_at) patch.next_contact_at = dados.next_contact_at
  if (Object.keys(patch).length > 0) await updateLead(id, patch, { userId: user.id })

  return json(res, 201, {
    activities: await listActivities(id),
    lead: await getLead(id),
  })
}

export default withErrorHandling(handler)
