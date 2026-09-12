import { guardMethod, json, requireRole, withErrorHandling } from '../../_lib/http.js'
import { convertProspectToLead } from '../../_lib/prospects.js'

/**
 * Prospect vira lead e entra no funil do CRM.
 *
 * Idempotente: a segunda chamada devolve o mesmo lead. E se já existe um lead
 * aberto com o mesmo contato, vincula a ele em vez de criar outro — senão a
 * prospecção duplicaria quem já tinha chegado pelo formulário do site.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  const id = String(req.query?.id ?? '')
  const r = await convertProspectToLead(id, { userId: user.id })
  if (!r) return json(res, 404, { error: 'Prospect não encontrado' })

  return json(res, r.jaConvertido ? 200 : 201, {
    jaConvertido: r.jaConvertido,
    leadCriado: r.leadCriado ?? false,
    leadId: r.leadId,
    prospect: r.prospect,
  })
}

export default withErrorHandling(handler)
