import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { CLIENT_STATUSES, ValidationError, pick, requireContact } from '../_lib/validate.js'
import { createClient, findClientByContact, listClients } from '../_lib/crm.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') {
    const user = await requireRole(req, res, 'clients', 'read')
    if (!user) return

    const { status, q } = req.query ?? {}
    if (status && !CLIENT_STATUSES.includes(String(status))) {
      return json(res, 400, { error: 'Status inválido' })
    }

    return json(res, 200, {
      clients: await listClients({
        status: status ? String(status) : null,
        search: q ? String(q) : null,
      }),
    })
  }

  const user = await requireRole(req, res, 'clients', 'write')
  if (!user) return

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      name: { type: 'string', required: true, max: 120, min: 2 },
      company_name: { type: 'string', max: 160 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      whatsapp: { type: 'string', max: 40 },
      document: { type: 'string', max: 40 },
      notes: { type: 'string', max: 5000 },
      status: { type: 'enum', values: CLIENT_STATUSES },
    })
    requireContact(dados)
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // Cadastro duplicado é recusado com o registro existente na resposta, para
  // a interface poder abrir o cliente em vez de só mostrar um erro seco.
  const existente = await findClientByContact(dados)
  if (existente) {
    return json(res, 409, {
      error: 'Já existe um cliente com este contato.',
      client: existente,
    })
  }

  const client = await createClient(dados)
  if (!client) return json(res, 409, { error: 'Já existe um cliente com este contato.' })

  return json(res, 201, { client })
}

export default withErrorHandling(handler)
