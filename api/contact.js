import { getSql } from './_lib/db.js'
import { getClientIp, guardMethod, json, readJsonBody, withErrorHandling } from './_lib/http.js'
import { ValidationError, normalizeEmail, pick, requireContact } from './_lib/validate.js'
import { addActivity, createLead, findOpenLeadByContact } from './_lib/crm.js'

/**
 * Formulário público do site — única rota do Operations sem autenticação.
 *
 * Grava a mensagem e, no mesmo fluxo, cria ou atualiza o lead correspondente.
 * `source` é sempre 'website': não aceitamos essa informação do cliente, senão
 * qualquer um poderia forjar a origem e sujar o relatório de canais.
 */

const JANELA_MINUTOS = 10
const MAX_ENVIOS = 5

async function excedeuLimite(ip, emailNorm) {
  const sql = getSql()
  const desde = new Date(Date.now() - JANELA_MINUTOS * 60 * 1000).toISOString()
  const rows = await sql`
    SELECT count(*)::int AS n FROM form_submissions
     WHERE submitted_at > ${desde}
       AND (ip = ${ip ?? ''} OR (${emailNorm}::text IS NOT NULL AND email_norm = ${emailNorm}))
  `
  return Number(rows[0]?.n ?? 0) >= MAX_ENVIOS
}

async function registrarEnvio(ip, emailNorm) {
  const sql = getSql()
  await sql`INSERT INTO form_submissions (ip, email_norm) VALUES (${ip ?? null}, ${emailNorm})`
}

async function handler(req, res) {
  if (!guardMethod(req, res, ['POST'])) return

  const body = await readJsonBody(req)
  const ip = getClientIp(req)

  // Armadilha para robô: campo invisível no formulário. Humano nunca preenche.
  // Responde 200 de propósito — dizer "recusado" ensinaria o robô a contornar.
  if (body && typeof body.website === 'string' && body.website.trim() !== '') {
    return json(res, 200, { ok: true })
  }

  let dados
  try {
    dados = pick(body, {
      name: { type: 'string', required: true, max: 120, min: 2 },
      company_name: { type: 'string', max: 160 },
      email: { type: 'email' },
      phone: { type: 'string', max: 40 },
      whatsapp: { type: 'string', max: 40 },
      service_interest: { type: 'string', max: 160 },
      message: { type: 'string', max: 5000 },
      answers: { type: 'json' },
    })
    requireContact(dados)
  } catch (err) {
    if (err instanceof ValidationError) {
      return json(res, 400, { error: 'Dados inválidos', campos: err.errors })
    }
    throw err
  }

  const emailNorm = normalizeEmail(dados.email)

  if (await excedeuLimite(ip, emailNorm)) {
    return json(res, 429, {
      error: 'Recebemos vários envios seus agora há pouco. Aguarde alguns minutos.',
    })
  }

  // Deduplicação: se já existe lead em disputa com este contato, a mensagem
  // entra como nova atividade nele em vez de virar um card repetido no quadro.
  const existente = await findOpenLeadByContact(dados)
  let lead

  if (existente) {
    lead = existente
    await addActivity(lead.id, {
      type: 'message_received',
      description: dados.message
        ? `Nova mensagem pelo site: ${dados.message.slice(0, 200)}`
        : 'Novo envio do formulário do site',
    })
  } else {
    lead = await createLead(
      {
        name: dados.name,
        company_name: dados.company_name,
        email: dados.email,
        phone: dados.phone,
        whatsapp: dados.whatsapp,
        service_interest: dados.service_interest,
        source: 'website',
        source_detail: dados.answers ? 'briefing' : 'formulario',
        notes: dados.message ?? null,
      },
      { userId: null },
    )
  }

  const sql = getSql()
  await sql`
    INSERT INTO contact_messages (lead_id, name, email, phone, company_name,
                          service_interest, body, payload, source, ip, user_agent)
    VALUES (${lead.id}, ${dados.name}, ${dados.email ?? null}, ${dados.phone ?? null},
            ${dados.company_name ?? null}, ${dados.service_interest ?? null},
            ${dados.message ?? null}, ${dados.answers ? JSON.stringify(dados.answers) : null},
            'website', ${ip}, ${req.headers['user-agent'] ?? null})
  `

  await registrarEnvio(ip, emailNorm)

  // A resposta não revela se o contato já era conhecido — isso permitiria
  // descobrir quem já é lead da agência testando e-mails.
  return json(res, 201, { ok: true, recebido: true })
}

export default withErrorHandling(handler)
