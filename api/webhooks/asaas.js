import { guardMethod, json, readJsonBody, withErrorHandling } from '../_lib/http.js'
import { idDoEvento, processarEvento, registrarEvento, tokenWebhookValido } from '../_lib/payments.js'

/**
 * Webhook do Asaas — terceira e última rota pública do sistema.
 *
 * Diferente das outras duas, esta ESCREVE no financeiro. Por isso a ordem
 * aqui é rígida:
 *
 *   1. autenticar o remetente pelo token do cabeçalho;
 *   2. registrar o evento cru (idempotência + auditoria);
 *   3. só então processar.
 *
 * Registrar antes de processar é o que torna o replay inofensivo: o segundo
 * envio do mesmo evento para no passo 2 e nunca alcança o dinheiro.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  // O Asaas envia o token configurado no painel neste cabeçalho.
  if (!tokenWebhookValido(req.headers['asaas-access-token'])) {
    // 401 seco, sem dizer o que faltou — a resposta não deve ajudar quem
    // está tentando adivinhar a configuração.
    return json(res, 401, { error: 'Não autorizado' })
  }

  const payload = await readJsonBody(req)
  if (!payload || typeof payload !== 'object') {
    return json(res, 400, { error: 'Payload inválido' })
  }

  const eventId = idDoEvento(payload)
  const { duplicado, id } = await registrarEvento({
    eventId,
    eventType: payload.event,
    payload,
  })

  // Replay: já recebemos este evento. Responder 200 encerra a tentativa do
  // provedor sem reprocessar nada.
  if (duplicado) {
    return json(res, 200, { ok: true, duplicado: true })
  }

  try {
    await processarEvento(id, payload)
  } catch (err) {
    // Falha nossa: registramos e devolvemos 500 de propósito, para o Asaas
    // reenviar. O evento fica gravado com status 'received', e a próxima
    // tentativa cai no caminho de duplicado — então o reprocessamento
    // precisa ser feito pela rotina de pendentes, não pelo retry.
    console.error('[webhook asaas] falha ao processar', {
      eventId, event: payload.event, message: err?.message,
    })
    return json(res, 500, { error: 'Falha ao processar evento' })
  }

  // Corpo enxuto: o provedor não precisa saber o desfecho interno, e
  // detalhar aqui exporia o modelo de dados a quem conseguisse o token.
  return json(res, 200, { ok: true })
}

export default withErrorHandling(handler)
