import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import { getLead, updateLead } from '../_lib/crm.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'PATCH'])) return

  const id = String(req.query?.id ?? '')
  const acao = req.method === 'GET' ? 'read' : 'write'

  const user = await requireRole(req, res, 'leads', acao)
  if (!user) return

  const lead = await getLead(id)
  // 404 e não 403: quem tem permissão sobre leads pode saber que este não
  // existe. A distinção só importaria se o acesso fosse por dono.
  if (!lead) return json(res, 404, { error: 'Lead não encontrado' })

  if (req.method === 'GET') return json(res, 200, { lead })

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      name: { type: 'string', max: 120, min: 2 },
      company_name: { type: 'string', max: 160 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      whatsapp: { type: 'string', max: 40 },
      source_detail: { type: 'string', max: 160 },
      service_interest: { type: 'string', max: 160 },
      estimated_value: { type: 'decimal' },
      score: { type: 'int', min: 0, max: 100 },
      owner_id: { type: 'uuid' },
      notes: { type: 'string', max: 5000 },
      last_contact_at: { type: 'datetime' },
      next_contact_at: { type: 'datetime' },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // `status` e `converted_client_id` não estão no esquema acima de propósito:
  // mudança de fase passa por /move e conversão por /convert, que registram
  // histórico. Aceitá-los aqui abriria caminho para marcar um lead como ganho
  // sem criar o cliente correspondente.
  const atualizado = await updateLead(id, dados, { userId: user.id })
  return json(res, 200, { lead: atualizado })
}

export default withErrorHandling(handler)
