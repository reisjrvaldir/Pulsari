import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { idDoEvento, tokenWebhookValido } from '../api/_lib/payments.js'

const libPayments = readFileSync('api/_lib/payments.js', 'utf8')
const rotaWebhook = readFileSync('api/webhooks/asaas.js', 'utf8')

describe('autenticação do webhook', () => {
  const original = process.env.ASAAS_WEBHOOK_TOKEN

  beforeEach(() => { process.env.ASAAS_WEBHOOK_TOKEN = 'token-secreto-do-webhook-123456' })
  afterEach(() => {
    if (original === undefined) delete process.env.ASAAS_WEBHOOK_TOKEN
    else process.env.ASAAS_WEBHOOK_TOKEN = original
  })

  it('aceita o token correto', () => {
    expect(tokenWebhookValido('token-secreto-do-webhook-123456')).toBe(true)
  })

  it('recusa token errado, vazio, nulo ou de outro tipo', () => {
    for (const v of ['errado', '', null, undefined, 123, {}, []]) {
      expect(tokenWebhookValido(v), String(v)).toBe(false)
    }
  })

  it('recusa prefixo correto do token', () => {
    // Comparação por prefixo permitiria descobrir o token caractere a caractere.
    expect(tokenWebhookValido('token-secreto-do-webhook-12345')).toBe(false)
    expect(tokenWebhookValido('token-secreto-do-webhook-1234567')).toBe(false)
  })

  it('recusa tudo quando o token não está configurado no servidor', () => {
    // Esquecer de configurar não pode virar porta aberta.
    delete process.env.ASAAS_WEBHOOK_TOKEN
    expect(tokenWebhookValido('qualquer')).toBe(false)
    expect(tokenWebhookValido('')).toBe(false)
  })

  it('usa comparação sem vazamento de tempo', () => {
    expect(libPayments).toMatch(/timingSafeEqual/)
  })
})

describe('identidade do evento', () => {
  it('usa o id do provedor quando existe', () => {
    expect(idDoEvento({ id: 'evt_123', event: 'PAYMENT_RECEIVED' })).toBe('evt_123')
  })

  it('deriva uma chave estável quando não há id', () => {
    const payload = { event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1' }, dateCreated: '2026-09-11' }
    expect(idDoEvento(payload)).toBe(idDoEvento({ ...payload }))
    expect(idDoEvento(payload)).toContain('pay_1')
  })

  it('eventos diferentes da mesma cobrança não colidem', () => {
    const base = { payment: { id: 'pay_1' }, dateCreated: '2026-09-11' }
    expect(idDoEvento({ ...base, event: 'PAYMENT_CONFIRMED' }))
      .not.toBe(idDoEvento({ ...base, event: 'PAYMENT_REFUNDED' }))
  })

  it('não quebra com payload vazio', () => {
    expect(() => idDoEvento({})).not.toThrow()
    expect(() => idDoEvento(null)).not.toThrow()
  })
})

describe('ordem das defesas na rota', () => {
  // Medir no arquivo inteiro pegaria os nomes na linha de import, onde a
  // ordem é alfabética e não diz nada sobre a execução. Só o corpo importa.
  const corpo = rotaWebhook.slice(rotaWebhook.indexOf('async function handler'))

  const posAuth = corpo.indexOf('tokenWebhookValido')
  const posRegistro = corpo.indexOf('registrarEvento')
  const posProcesso = corpo.indexOf('processarEvento')

  it('autentica antes de ler qualquer coisa do corpo', () => {
    expect(posAuth).toBeGreaterThan(-1)
    expect(posAuth).toBeLessThan(corpo.indexOf('readJsonBody'))
  })

  it('registra o evento antes de processar — é o que torna replay inofensivo', () => {
    expect(posRegistro).toBeLessThan(posProcesso)
  })

  it('interrompe quando o evento é duplicado', () => {
    expect(rotaWebhook).toMatch(/if \(duplicado\)/)
    expect(rotaWebhook).toMatch(/duplicado: true/)
  })
})

describe('confirmação de pagamento', () => {
  it('só confirma com evento de dinheiro recebido', () => {
    const set = /EVENTOS_PAGAMENTO = new Set\(\[([^\]]*)\]/.exec(libPayments)?.[1] ?? ''
    expect(set).toMatch(/PAYMENT_CONFIRMED/)
    expect(set).toMatch(/PAYMENT_RECEIVED/)
    expect(set).not.toMatch(/PAYMENT_CREATED/)
    expect(set).not.toMatch(/PAYMENT_UPDATED/)
  })

  it('confere o valor recebido contra o cobrado', () => {
    expect(libPayments).toMatch(/valor divergente/)
    expect(libPayments).toMatch(/>= amount/)
  })

  it('divergência de valor não confirma o pagamento', () => {
    const trecho = libPayments.slice(
      libPayments.indexOf('Conferência de valor'),
      libPayments.indexOf('--- Confirmação'),
    )
    expect(trecho).toMatch(/return \{ desfecho: 'divergencia'/)
    expect(trecho).not.toMatch(/status='confirmed'/)
  })

  it('lançamento financeiro é idempotente por ON CONFLICT', () => {
    expect(libPayments).toMatch(/origin_type='proposal_payment'|'proposal_payment'/)
    expect(libPayments).toMatch(/ON CONFLICT DO NOTHING/)
  })

  it('estorno cancela o lançamento em vez de apagá-lo', () => {
    expect(libPayments).toMatch(/SET status='cancelled'/)
    expect(libPayments).not.toMatch(/DELETE FROM financial_transactions/)
  })
})

describe('linha do tempo do cliente', () => {
  const trecho = libPayments.slice(libPayments.indexOf('export async function getClientTimeline'))

  it('não expõe sprint, card, responsável nem id interno', () => {
    const listaSelect = trecho.split(/SELECT/i)[1]?.split(/\bFROM\b/i)[0] ?? ''
    expect(listaSelect).toMatch(/title/)
    for (const campo of ['sprint_id', 'card', 'assigned', 'created_by', 'id']) {
      expect(listaSelect, `campo interno na timeline: ${campo}`).not.toMatch(
        new RegExp(`\\b${campo}\\b`),
      )
    }
  })

  it('sprint não é visível ao cliente por padrão', () => {
    const migration = readFileSync('migrations/008_payments.sql', 'utf8')
    expect(migration).toMatch(/client_visible boolean NOT NULL DEFAULT false/)
  })

  it('publicar a mesma sprint duas vezes não duplica o marco', () => {
    expect(libPayments).toMatch(/ON CONFLICT \(sprint_id\)/)
  })
})
