import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../../_lib/http.js'
import { LEAD_STATUSES, ValidationError, pick } from '../../_lib/validate.js'
import { convertLeadToClient, getLead, moveLead } from '../../_lib/crm.js'

/**
 * Movimentação no quadro do CRM (arrastar e soltar).
 *
 * Não há ordem obrigatória entre as fases: voltar de `negotiation` para
 * `contacted` é legítimo quando o negócio esfria, e travar isso só faria a
 * equipe registrar a realidade errada para agradar o sistema.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['PATCH'])) return

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  const id = String(req.query?.id ?? '')
  const lead = await getLead(id)
  if (!lead) return json(res, 404, { error: 'Lead não encontrado' })

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      status: { type: 'enum', values: LEAD_STATUSES, required: true },
      position: { type: 'int', min: 0 },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // Soltar na coluna "Ganho" é o mesmo que converter: delega para o fluxo que
  // cria o cliente, em vez de deixar um lead ganho sem cliente correspondente.
  // A restrição leads_won_has_client no banco recusaria a escrita de qualquer
  // forma — melhor tratar aqui do que devolver erro de constraint.
  if (dados.status === 'won') {
    const r = await convertLeadToClient(id, { userId: user.id })
    if (!r) return json(res, 404, { error: 'Lead não encontrado' })
    return json(res, 200, { lead: r.lead, client: r.client, convertido: true })
  }

  const atualizado = await moveLead(id, dados, { userId: user.id })
  return json(res, 200, { lead: atualizado })
}

export default withErrorHandling(handler)
