import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { CLIENT_STATUSES, ValidationError, pick } from '../_lib/validate.js'
import { findClientByContact, getClient, updateClient } from '../_lib/crm.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'PATCH'])) return

  const acao = req.method === 'GET' ? 'read' : 'write'
  const user = await requireRole(req, res, 'clients', acao)
  if (!user) return

  const id = String(req.query?.id ?? '')
  const client = await getClient(id)
  if (!client) return json(res, 404, { error: 'Cliente não encontrado' })

  if (req.method === 'GET') return json(res, 200, { client })

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      name: { type: 'string', max: 120, min: 2 },
      company_name: { type: 'string', max: 160 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      whatsapp: { type: 'string', max: 40 },
      document: { type: 'string', max: 40 },
      notes: { type: 'string', max: 5000 },
      status: { type: 'enum', values: CLIENT_STATUSES },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // Trocar o e-mail para um já usado por outro cliente esbarraria no índice
  // único e viraria erro 500. Checar antes devolve mensagem útil.
  if (dados.email) {
    const conflito = await findClientByContact({ email: dados.email })
    if (conflito && conflito.id !== id) {
      return json(res, 409, { error: 'Outro cliente já usa este e-mail.', client: conflito })
    }
  }

  return json(res, 200, { client: await updateClient(id, dados) })
}

export default withErrorHandling(handler)
