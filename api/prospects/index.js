import { guardMethod, json, readJsonBody, requireRole, withErrorHandling } from '../_lib/http.js'
import { ValidationError, pick } from '../_lib/validate.js'
import {
  ORIGENS, STATUS_PROSPECT, createProspect, encontrarDuplicata, listProspects,
} from '../_lib/prospects.js'

async function handler(req, res) {
  if (!guardMethod(req, res, ['GET', 'POST'])) return

  if (req.method === 'GET') {
    const user = await requireRole(req, res, 'leads', 'read')
    if (!user) return

    const { status, owner, q, score, atrasados } = req.query ?? {}
    if (status && !STATUS_PROSPECT.includes(String(status))) {
      return json(res, 400, { error: 'Status inválido' })
    }

    return json(res, 200, {
      prospects: await listProspects({
        status: status ? String(status) : null,
        ownerId: owner === 'me' ? user.id : (owner ? String(owner) : null),
        search: q ? String(q) : null,
        minScore: score ? Number(score) : null,
        overdueOnly: atrasados === '1' || atrasados === 'true',
      }),
    })
  }

  const user = await requireRole(req, res, 'leads', 'write')
  if (!user) return

  let dados
  try {
    dados = pick(await readJsonBody(req), {
      company_name: { type: 'string', required: true, min: 2, max: 200 },
      contact_name: { type: 'string', max: 120 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      website: { type: 'string', max: 300 },
      social: { type: 'string', max: 300 },
      source: { type: 'enum', values: ORIGENS },
      segment: { type: 'string', max: 120 },
      city: { type: 'string', max: 120 },
      notes: { type: 'string', max: 5000 },
      owner_id: { type: 'uuid' },
      next_contact_at: { type: 'datetime' },
    })
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  // Duplicata por e-mail é bloqueio (o índice único recusaria de qualquer
  // forma); por nome de empresa é aviso, porque duas filiais da mesma rede
  // são prospects legítimos. Em ambos os casos devolvemos o registro
  // existente, para a tela poder abri-lo em vez de só recusar.
  const duplicata = await encontrarDuplicata(dados)
  if (duplicata?.por_email) {
    return json(res, 409, {
      error: 'Já existe um prospect com este e-mail.',
      prospect: duplicata,
      motivo: 'email',
    })
  }

  const prospect = await createProspect(dados, { userId: user.id })
  return json(res, 201, {
    prospect,
    aviso: duplicata
      ? { motivo: 'empresa', mensagem: `Já existe "${duplicata.company_name}" cadastrado.`, prospect: duplicata }
      : undefined,
  })
}

export default withErrorHandling(handler)
