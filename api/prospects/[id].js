import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import {
  ORIGENS, STATUS_PROSPECT, getProspect, moveProspect, updateProspect,
} from '../_lib/prospects.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'PATCH'])) return

  const acao = req.method === 'GET' ? 'read' : 'write'
  const user = await requireRole(req, res, 'leads', acao)
  if (!user) return

  const id = String(req.query?.id ?? '')
  const prospect = await getProspect(id)
  if (!prospect) return json(res, 404, { error: 'Prospect não encontrado' })

  if (req.method === 'GET') return json(res, 200, { prospect })

  const body = await readJsonBody(req)

  // Mudança de status vem separada porque registra histórico com origem e
  // destino. 'converted' não é alcançável por aqui: exige criar o lead.
  if (body && typeof body.status === 'string') {
    if (!STATUS_PROSPECT.includes(body.status)) {
      return json(res, 400, { error: 'Status inválido' })
    }
    const r = await moveProspect(id, body.status, { userId: user.id })
    if (r?.erro === 'use_conversao') {
      return json(res, 409, {
        error: 'Para marcar como convertido, use a conversão em lead.',
      })
    }
    return json(res, 200, { prospect: r.prospect })
  }

  let dados
  try {
    dados = pick(body, {
      company_name: { type: 'string', min: 2, max: 200 },
      contact_name: { type: 'string', max: 120 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      website: { type: 'string', max: 300 },
      social: { type: 'string', max: 300 },
      source: { type: 'enum', values: ORIGENS },
      segment: { type: 'string', max: 120 },
      city: { type: 'string', max: 120 },
      notes: { type: 'string', max: 5000 },
      owner_id: { type: 'uuid' },
      next_contact_at: { type: 'datetime' },
      last_contact_at: { type: 'datetime' },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // `score` não está no esquema: é coluna gerada pelo banco a partir dos
  // demais campos. Aceitá-lo aqui permitiria inflar a pontuação à mão e
  // destruiria o sentido do ranking.
  return json(res, 200, { prospect: await updateProspect(id, dados, { userId: user.id }) })
}

export default withErrorHandling(handler)
