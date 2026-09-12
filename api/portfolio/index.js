import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import { createItem, listItems } from '../_lib/portfolio.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') {
    const user = await requireRole(req, res, 'portfolio', 'read')
    if (!user) return
    const { publicados } = req.query ?? {}
    const filtro = publicados === '1' ? true : publicados === '0' ? false : null
    return json(res, 200, { items: await listItems({ published: filtro }) })
  }

  const user = await requireRole(req, res, 'portfolio', 'write')
  if (!user) return

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      project_id: { type: 'uuid' },
      title: { type: 'string', required: true, min: 2, max: 200 },
      slug: { type: 'string', max: 80 },
      description: { type: 'string', max: 2000 },
      case_description: { type: 'string', max: 20000 },
      main_image: { type: 'string', max: 500 },
      project_url: { type: 'string', max: 500 },
      position: { type: 'int', min: 0 },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  const body = await readJsonBody(req)
  const listaTexto = (v) =>
    Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim() !== '').slice(0, 30) : []

  // `published` e `featured` não estão no esquema de propósito: publicar é
  // uma operação própria, nunca efeito colateral de criar ou salvar.
  const item = await createItem(
    {
      ...dados,
      technologies: listaTexto(body?.technologies),
      gallery: listaTexto(body?.gallery),
    },
    { userId: user.id },
  )

  return json(res, 201, { item })
}

export default withErrorHandling(handler)
