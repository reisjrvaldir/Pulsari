import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { LEAD_STATUSES, ValidationError, pick, requireContact } from '../_lib/validate.js'
import { createLead, listLeads } from '../_lib/crm.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') {
    const user = await requireRole(req, res, 'leads', 'read')
    if (!user) return

    const { status, owner, q, atrasados } = req.query ?? {}
    if (status && !LEAD_STATUSES.includes(String(status))) {
      return json(res, 400, { error: 'Status inválido' })
    }

    const leads = await listLeads({
      status: status ? String(status) : null,
      // `owner=me` evita expor o id do usuário na URL só para filtrar os próprios.
      ownerId: owner === 'me' ? user.id : (owner ? String(owner) : null),
      search: q ? String(q) : null,
      overdueOnly: atrasados === '1' || atrasados === 'true',
    })

    return json(res, 200, { leads })
  }

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      name: { type: 'string', required: true, max: 120, min: 2 },
      company_name: { type: 'string', max: 160 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      whatsapp: { type: 'string', max: 40 },
      source: { type: 'string', max: 60 },
      source_detail: { type: 'string', max: 160 },
      service_interest: { type: 'string', max: 160 },
      estimated_value: { type: 'decimal' },
      score: { type: 'int', min: 0, max: 100 },
      owner_id: { type: 'uuid' },
      notes: { type: 'string', max: 5000 },
      next_contact_at: { type: 'datetime' },
    })
    requireContact(dados)
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // Lead criado pela equipe nasce no dono que o criou, salvo indicação
  // explícita — evita card órfão no quadro.
  const lead = await createLead(
    { ...dados, owner_id: dados.owner_id ?? user.id, source: dados.source ?? 'manual' },
    { userId: user.id },
  )

  return json(res, 201, { lead })
}

export default withErrorHandling(handler)
