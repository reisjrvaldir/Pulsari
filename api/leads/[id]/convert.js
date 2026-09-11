import { guardMethod, json, requireRole, withErrorHandling } from '../../_lib/http.js'
import { convertLeadToClient } from '../../_lib/crm.js'

/**
 * Converte o lead em cliente (fase "ganho").
 *
 * Idempotente: chamar duas vezes devolve o mesmo cliente e não cria duplicata.
 * Isso importa porque a conversão pode ser disparada por clique duplo, por
 * arrastar o card para "Ganho" e pelo botão da tela — três caminhos para a
 * mesma operação.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  const id = String(req.query?.id ?? '')
  const resultado = await convertLeadToClient(id, { userId: user.id })

  if (!resultado) return json(res, 404, { error: 'Lead não encontrado' })

  return json(res, resultado.jaConvertido ? 200 : 201, {
    lead: resultado.lead,
    client: resultado.client,
    jaConvertido: resultado.jaConvertido,
    clienteCriado: resultado.clienteCriado ?? false,
  })
}

export default withErrorHandling(handler)
