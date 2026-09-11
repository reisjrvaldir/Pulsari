/**
 * Validação de entrada.
 *
 * Regra da casa: nenhuma rota monta UPDATE/INSERT a partir do corpo cru da
 * requisição. Todo campo aceito passa por uma lista explícita aqui — é o que
 * impede que alguém envie `{"status":"won"}` ou `{"owner_id":"..."}` num
 * endpoint que não deveria aceitar isso (mass assignment).
 */

export const LEAD_STATUSES = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost',
]

export const CLIENT_STATUSES = ['active', 'inactive', 'archived']

/** Status a partir dos quais o lead ainda está em disputa. */
export const OPEN_LEAD_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== 'won' && s !== 'lost',
)

export class ValidationError extends Error {
  constructor(errors) {
    super('Dados inválidos')
    this.name = 'ValidationError'
    this.errors = errors
  }
}

const isBlank = (v) => v === undefined || v === null || String(v).trim() === ''

export function normalizeEmail(v) {
  if (isBlank(v)) return null
  return String(v).trim().toLowerCase()
}

/**
 * Mesma regra da função `pulsari_norm_phone` no banco.
 *
 * Só dígitos; remove o DDI 55 quando sobra número demais; depois mantém os
 * últimos 11. O descarte do 55 precisa vir antes do corte: telefone fixo com
 * DDI tem 12 dígitos (55 + DDD + 8), e cortar direto em 11 deixaria um "5"
 * grudado no começo do DDD — dois registros do mesmo fixo nunca casariam.
 *
 * Duplicar a regra aqui é intencional: a aplicação compara telefone antes de
 * escrever, sem ida ao banco. Um teste de paridade impede que as duas
 * implementações divirjam.
 */
export function normalizePhone(v) {
  if (isBlank(v)) return null
  let digits = String(v).replace(/\D/g, '')
  if (!digits) return null
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  return digits.slice(-11) || null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * Aplica um esquema simples e devolve apenas os campos declarados.
 * Campos ausentes no corpo não entram no resultado — o chamador distingue
 * "não enviado" de "enviado vazio", que é o que permite PATCH parcial.
 */
export function pick(body, schema) {
  const errors = {}
  const out = {}
  const src = body && typeof body === 'object' ? body : {}

  for (const [field, rule] of Object.entries(schema)) {
    const presente = Object.prototype.hasOwnProperty.call(src, field)
    const raw = src[field]

    if (!presente) {
      if (rule.required) errors[field] = 'obrigatório'
      continue
    }

    if (isBlank(raw)) {
      if (rule.required) errors[field] = 'obrigatório'
      else out[field] = null
      continue
    }

    switch (rule.type) {
      case 'string': {
        const v = String(raw).trim()
        if (rule.max && v.length > rule.max) {
          errors[field] = `máximo de ${rule.max} caracteres`
        } else if (rule.min && v.length < rule.min) {
          errors[field] = `mínimo de ${rule.min} caracteres`
        } else {
          out[field] = v
        }
        break
      }
      case 'email': {
        const v = String(raw).trim()
        if (!EMAIL_RE.test(v)) errors[field] = 'e-mail inválido'
        else if (v.length > 320) errors[field] = 'e-mail muito longo'
        else out[field] = v
        break
      }
      case 'enum': {
        const v = String(raw)
        if (!rule.values.includes(v)) {
          errors[field] = `valor inválido (aceitos: ${rule.values.join(', ')})`
        } else {
          out[field] = v
        }
        break
      }
      case 'int': {
        const v = Number(raw)
        if (!Number.isInteger(v)) errors[field] = 'número inteiro esperado'
        else if (rule.min !== undefined && v < rule.min) errors[field] = `mínimo ${rule.min}`
        else if (rule.max !== undefined && v > rule.max) errors[field] = `máximo ${rule.max}`
        else out[field] = v
        break
      }
      case 'decimal': {
        const v = Number(raw)
        if (!Number.isFinite(v)) errors[field] = 'número esperado'
        else if (v < 0) errors[field] = 'não pode ser negativo'
        else out[field] = v
        break
      }
      case 'uuid': {
        const v = String(raw).trim()
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) {
          errors[field] = 'identificador inválido'
        } else {
          out[field] = v
        }
        break
      }
      case 'datetime': {
        const d = new Date(raw)
        if (Number.isNaN(d.getTime())) errors[field] = 'data inválida'
        else out[field] = d.toISOString()
        break
      }
      case 'json': {
        if (typeof raw !== 'object') errors[field] = 'objeto esperado'
        else out[field] = raw
        break
      }
      default:
        errors[field] = 'tipo desconhecido'
    }
  }

  if (Object.keys(errors).length > 0) throw new ValidationError(errors)
  return out
}

/** Ao menos uma forma de contato — sem isso o lead é inalcançável. */
export function requireContact(dados) {
  if (!dados.email && !dados.phone && !dados.whatsapp) {
    throw new ValidationError({
      email: 'informe ao menos e-mail, telefone ou WhatsApp',
    })
  }
}
