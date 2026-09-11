import { describe, expect, it } from 'vitest'
import {
  LEAD_STATUSES,
  OPEN_LEAD_STATUSES,
  ValidationError,
  normalizeEmail,
  normalizePhone,
  pick,
  requireContact,
} from '../api/_lib/validate.js'

describe('normalização de contato', () => {
  it('e-mail vira minúsculo e sem espaços', () => {
    expect(normalizeEmail('  Ana@Pulsari.COM.br ')).toBe('ana@pulsari.com.br')
  })

  it('e-mail vazio ou ausente vira null', () => {
    for (const v of ['', '   ', null, undefined]) expect(normalizeEmail(v)).toBeNull()
  })

  it('celular: perde formatação e DDI, mantendo DDD + 9 dígitos', () => {
    const esperado = '81989654487'
    for (const entrada of [
      '+55 (81) 98965-4487',
      '55 81 98965 4487',
      '(81) 98965-4487',
      '81989654487',
      ' +5581989654487 ',
    ]) {
      expect(normalizePhone(entrada), `entrada: ${entrada}`).toBe(esperado)
    }
  })

  it('fixo com DDI não carrega pedaço do código do país', () => {
    // Regressão: "últimos 11 dígitos" puro devolvia 58132234455 para o fixo
    // com DDI, e o mesmo número sem DDI virava 8132234455 — nunca casavam.
    const comDdi = normalizePhone('+55 (81) 3223-4455')
    const semDdi = normalizePhone('(81) 3223-4455')
    expect(comDdi).toBe('8132234455')
    expect(comDdi).toBe(semDdi)
    expect(comDdi.startsWith('5')).toBe(false)
  })

  it('duas grafias do mesmo número normalizam igual — é a base da deduplicação', () => {
    expect(normalizePhone('(81) 98965-4487')).toBe(normalizePhone('+55 81 989654487'))
  })

  it('telefone sem dígitos vira null', () => {
    for (const v of ['', '---', 'abc', null, undefined]) expect(normalizePhone(v)).toBeNull()
  })
})

describe('pick — lista branca de campos', () => {
  const schema = {
    name: { type: 'string', required: true, max: 10 },
    email: { type: 'email' },
    score: { type: 'int', min: 0, max: 100 },
  }

  it('devolve só o que está no esquema', () => {
    const out = pick({ name: 'Ana', email: 'a@b.com', status: 'won', owner_id: 'x' }, schema)
    expect(out).toEqual({ name: 'Ana', email: 'a@b.com' })
    expect(out.status).toBeUndefined()
    expect(out.owner_id).toBeUndefined()
  })

  it('bloqueia mass assignment de campo sensível', () => {
    // O ataque clássico: mandar status/converted_client_id num PATCH comum.
    const out = pick({ name: 'Ana', status: 'won', converted_client_id: 'abc' }, schema)
    expect(Object.keys(out)).toEqual(['name'])
  })

  it('campo ausente não entra no resultado — permite PATCH parcial', () => {
    const out = pick({ name: 'Ana' }, schema)
    expect('email' in out).toBe(false)
  })

  it('campo enviado vazio vira null explícito — permite limpar um valor', () => {
    const out = pick({ name: 'Ana', email: '' }, schema)
    expect(out.email).toBeNull()
  })

  it('exige os obrigatórios', () => {
    expect(() => pick({}, schema)).toThrow(ValidationError)
    try { pick({}, schema) } catch (e) { expect(e.errors.name).toBe('obrigatório') }
  })

  it('recusa e-mail malformado', () => {
    for (const ruim of ['sem-arroba', 'a@b', '@b.com', 'a b@c.com']) {
      expect(() => pick({ name: 'Ana', email: ruim }, schema), ruim).toThrow(ValidationError)
    }
  })

  it('respeita limites de tamanho e faixa', () => {
    expect(() => pick({ name: 'x'.repeat(11) }, schema)).toThrow(ValidationError)
    expect(() => pick({ name: 'Ana', score: 101 }, schema)).toThrow(ValidationError)
    expect(() => pick({ name: 'Ana', score: -1 }, schema)).toThrow(ValidationError)
    expect(() => pick({ name: 'Ana', score: 1.5 }, schema)).toThrow(ValidationError)
  })

  it('recusa enum fora da lista', () => {
    const s = { status: { type: 'enum', values: LEAD_STATUSES } }
    expect(() => pick({ status: 'inventado' }, s)).toThrow(ValidationError)
    expect(pick({ status: 'qualified' }, s)).toEqual({ status: 'qualified' })
  })

  it('recusa uuid malformado — evita id forjado chegando ao banco', () => {
    const s = { owner_id: { type: 'uuid' } }
    for (const ruim of ['1', 'abc', "' OR 1=1--", '../../etc/passwd']) {
      expect(() => pick({ owner_id: ruim }, s), ruim).toThrow(ValidationError)
    }
  })

  it('corpo nulo ou não-objeto não quebra', () => {
    const s = { nome: { type: 'string' } }
    expect(pick(null, s)).toEqual({})
    expect(pick('texto', s)).toEqual({})
    expect(pick(undefined, s)).toEqual({})
  })
})

describe('requireContact', () => {
  it('aceita quando há qualquer forma de contato', () => {
    expect(() => requireContact({ email: 'a@b.com' })).not.toThrow()
    expect(() => requireContact({ phone: '81999999999' })).not.toThrow()
    expect(() => requireContact({ whatsapp: '81999999999' })).not.toThrow()
  })

  it('recusa lead sem nenhuma forma de contato', () => {
    expect(() => requireContact({ name: 'Ana' })).toThrow(ValidationError)
  })
})

describe('status do funil', () => {
  it('cobre as sete fases da especificação', () => {
    expect(LEAD_STATUSES).toEqual([
      'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost',
    ])
  })

  it('ganho e perdido não contam como leads em disputa', () => {
    expect(OPEN_LEAD_STATUSES).not.toContain('won')
    expect(OPEN_LEAD_STATUSES).not.toContain('lost')
    expect(OPEN_LEAD_STATUSES).toHaveLength(5)
  })
})
