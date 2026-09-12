import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { explicarScore, mapearCabecalho, parseCsv } from '../api/_lib/prospects.js'

const libProspects = readFileSync('api/_lib/prospects.js', 'utf8')
const rotaPatch = readFileSync('api/prospects/[id].js', 'utf8')
const rotaImport = readFileSync('api/prospects/import.js', 'utf8')

describe('score explicável', () => {
  it('prospect vazio de pesquisa vale só os pontos da origem', () => {
    const r = explicarScore({ source: 'pesquisa' })
    expect(r.total).toBe(10)
    expect(r.fatores.find((f) => f.codigo === 'source')?.atendido).toBe(true)
  })

  it('e-mail e telefone pesam mais que presença digital', () => {
    const contato = explicarScore({ source: 'pesquisa', email: 'a@b.com', phone: '81999999999' })
    const digital = explicarScore({ source: 'pesquisa', website: 'site.com', social: '@perfil' })
    expect(contato.total).toBeGreaterThan(digital.total)
  })

  it('indicação completa chega a 100', () => {
    const r = explicarScore({
      source: 'indicacao', email: 'a@b.com', phone: '81999999999',
      website: 'site.com', social: '@perfil', segment: 'Saúde', city: 'Recife',
      notes: 'Pesquisei o site e vi oportunidade clara',
    })
    expect(r.total).toBe(100)
    expect(r.faltando).toHaveLength(0)
  })

  it('diz o que está faltando, não só o número', () => {
    const r = explicarScore({ source: 'lista', email: 'a@b.com' })
    const codigosFaltando = r.faltando.map((f) => f.codigo)
    expect(codigosFaltando).toContain('phone')
    expect(codigosFaltando).toContain('segment')
    expect(codigosFaltando).not.toContain('email')
  })

  it('nota curta não conta como pesquisa registrada', () => {
    const curta = explicarScore({ source: 'lista', notes: 'ok' })
    const longa = explicarScore({ source: 'lista', notes: 'Conversei com o sócio na feira' })
    expect(curta.total).toBeLessThan(longa.total)
  })

  it('origem desconhecida não pontua, mas não quebra', () => {
    const r = explicarScore({ source: 'inventada' })
    expect(r.total).toBe(0)
    expect(r.fatores.find((f) => f.codigo === 'source')?.rotulo).toMatch(/não classificada/i)
  })

  it('nunca passa de 100', () => {
    const r = explicarScore({
      source: 'indicacao', email: 'a@b.com', phone: '1', website: 'x',
      social: 'x', segment: 'x', city: 'x', notes: 'x'.repeat(50),
    })
    expect(r.total).toBeLessThanOrEqual(100)
  })
})

describe('leitura de CSV', () => {
  it('separa por vírgula e por ponto e vírgula', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']])
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('respeita vírgula dentro de aspas', () => {
    // O caso que quebra um split(',') ingênuo, e que aparece em toda lista
    // comprada: "Empresa, Filial SP".
    const linhas = parseCsv('empresa,cidade\n"Alpha, Filial SP",Recife')
    expect(linhas[1]).toEqual(['Alpha, Filial SP', 'Recife'])
  })

  it('entende aspas escapadas', () => {
    const linhas = parseCsv('nome\n"Loja ""Bom Preço"""')
    expect(linhas[1][0]).toBe('Loja "Bom Preço"')
  })

  it('ignora linhas em branco e CR do Windows', () => {
    expect(parseCsv('a,b\r\n1,2\r\n\r\n')).toEqual([['a', 'b'], ['1', '2']])
  })

  it('não quebra com arquivo vazio', () => {
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('\n\n')).toEqual([])
  })
})

describe('mapeamento de cabeçalho', () => {
  it('reconhece cabeçalho em português', () => {
    const m = mapearCabecalho(['Empresa', 'Contato', 'E-mail', 'Telefone', 'Cidade'])
    expect(m.company_name).toBe(0)
    expect(m.contact_name).toBe(1)
    expect(m.email).toBe(2)
    expect(m.phone).toBe(3)
    expect(m.city).toBe(4)
  })

  it('reconhece cabeçalho em inglês', () => {
    const m = mapearCabecalho(['company_name', 'email', 'segment'])
    expect(m.company_name).toBe(0)
    expect(m.email).toBe(1)
    expect(m.segment).toBe(2)
  })

  it('ignora caixa e espaços em volta', () => {
    const m = mapearCabecalho(['  EMPRESA  ', ' Razão Social '])
    expect(m.company_name).toBeDefined()
  })

  it('ignora coluna desconhecida em vez de falhar', () => {
    const m = mapearCabecalho(['empresa', 'coluna esquisita', 'email'])
    expect(m.company_name).toBe(0)
    expect(m.email).toBe(2)
    expect(Object.keys(m)).toHaveLength(2)
  })
})

describe('proteções da importação', () => {
  it('carrega os e-mails existentes de uma vez, não por linha', () => {
    expect(rotaImport).toMatch(/SELECT email_norm FROM prospects/)
    expect(rotaImport).toMatch(/new Set\(/)
  })

  it('deduplica também dentro do próprio arquivo', () => {
    expect(rotaImport).toMatch(/noArquivo/)
  })

  it('linha inválida não derruba o lote', () => {
    expect(rotaImport).toMatch(/continue/)
    expect(rotaImport).toMatch(/erros\.push/)
  })

  it('tem teto de linhas por importação', () => {
    expect(rotaImport).toMatch(/MAX_LINHAS/)
  })
})

describe('integridade do score', () => {
  it('score não é aceito como campo editável na API', () => {
    // É coluna gerada pelo banco. Aceitá-lo permitiria inflar a pontuação à
    // mão e destruiria o sentido do ranking.
    const esquema = rotaPatch.slice(rotaPatch.indexOf('pick(body, {'), rotaPatch.indexOf('})'))
    expect(esquema).not.toMatch(/\bscore\b/)
  })

  it('status convertido não é alcançável por PATCH comum', () => {
    expect(libProspects).toMatch(/use_conversao/)
    expect(rotaPatch).toMatch(/use_conversao/)
  })
})

describe('conversão em lead', () => {
  it('é idempotente pelo vínculo já registrado', () => {
    expect(libProspects).toMatch(/if \(prospect\.converted_lead_id\)/)
    expect(libProspects).toMatch(/jaConvertido: true/)
  })

  it('reaproveita lead aberto com o mesmo contato', () => {
    expect(libProspects).toMatch(/findOpenLeadByContact/)
  })
})
