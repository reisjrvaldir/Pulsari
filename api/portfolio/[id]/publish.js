import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../../_lib/http.js'
import { setFeatured, setPublished } from '../../_lib/portfolio.js'

/**
 * Publicação e destaque.
 *
 * Operações próprias, separadas da edição: a especificação da Sprint 08 é
 * explícita em que nada vai ao ar automaticamente. Salvar um campo nunca
 * publica; publicar é sempre um clique deliberado.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const user = await requireRole(req, res, 'portfolio', 'write')
  if (!user) return

  const id = String(req.query?.id ?? '')
  const body = await readJsonBody(req)

  if (typeof body?.featured === 'boolean') {
    const r = await setFeatured(id, body.featured)
    if (!r) return json(res, 404, { error: 'Case não encontrado' })
    if (r.erro === 'nao_publicado') {
      return json(res, 409, { error: 'Só é possível destacar um case já publicado.' })
    }
    return json(res, 200, { item: r.item })
  }

  if (typeof body?.published !== 'boolean') {
    return json(res, 400, { error: 'Informe `published` ou `featured`.' })
  }

  const r = await setPublished(id, body.published)
  if (!r) return json(res, 404, { error: 'Case não encontrado' })
  if (r.erro === 'sem_imagem') {
    return json(res, 422, {
      error: 'Adicione a imagem principal antes de publicar — sem ela o case fica quebrado na vitrine.',
    })
  }

  return json(res, 200, { item: r.item })
}

export default withErrorHandling(handler)
