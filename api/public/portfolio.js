import { guardMethod, json, withErrorHandling } from '../_lib/http.js'
import { getPublishedBySlug, listPublished } from '../_lib/portfolio.js'

/**
 * Portfólio público — o que o site institucional consome.
 *
 * Sem autenticação, e por isso a projeção é escrita campo a campo em
 * `_lib/portfolio.js`. Nada vindo de `projects` chega aqui: um visitante não
 * consegue descobrir sequer que o case veio de um projeto cadastrado.
 */
async function handler(req, res) {
  if (!guardMethod(req, res, ['GET'])) return

  const slug = req.query?.slug ? String(req.query.slug) : null

  if (slug) {
    const item = await getPublishedBySlug(slug)
    if (!item) return json(res, 404, { error: 'Case não encontrado.' })
    return json(res, 200, { item })
  }

  return json(res, 200, { items: await listPublished() })
}

export default withErrorHandling(handler)
