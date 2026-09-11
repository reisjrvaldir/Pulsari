import { guardMethod, json, requireRole, withErrorHandling } from '../../_lib/http.js'
import { getProposal, sendProposal } from '../../_lib/proposals.js'

/**
 * Marca a proposta como enviada e devolve a URL pública.
 *
 * A partir daqui os itens travam no banco: o cliente pode estar com o link
 * aberto, e alterar preço por baixo seria indefensável. Para corrigir, volte
 * a proposta para rascunho de forma explícita.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const user = await requireRole(req, res, 'proposals', 'write')
  if (!user) return

  const id = String(req.query?.id ?? '')
  const atual = await getProposal(id)
  if (!atual) return json(res, 404, { error: 'Proposta não encontrada' })

  if (atual.items.length === 0) {
    return json(res, 422, { error: 'Adicione ao menos um item antes de enviar.' })
  }

  const enviada = await sendProposal(id)
  if (!enviada) {
    return json(res, 409, {
      error: `Só é possível enviar uma proposta em rascunho (atual: ${atual.status}).`,
    })
  }

  // A URL é montada a partir do domínio configurado, não do Host da
  // requisição — confiar no Host permitiria gerar links apontando para
  // outro domínio a partir de uma requisição forjada.
  const base = process.env.PUBLIC_SITE_URL ?? 'https://www.pulsari.com.br'

  return json(res, 200, {
    proposal: enviada,
    url: `${base.replace(/\/+$/, '')}/proposta/${enviada.public_token}`,
  })
}

export default withErrorHandling(handler)
