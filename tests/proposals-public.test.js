import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { gerarToken } from '../api/_lib/proposals.js'

/**
 * Fase 06 da Sprint 05: auditar a exposição pública.
 *
 * A rota /proposta/:token é servida sem autenticação. Estes testes existem
 * para que uma coluna sensível acrescentada à tabela no futuro não vaze por
 * descuido, e para que a resposta a token inválido continue indistinguível.
 */

const libProposals = readFileSync('api/_lib/proposals.js', 'utf8')
const rotaPublica = readFileSync('api/public/proposal/[token].js', 'utf8')

describe('token público', () => {
  it('tem entropia suficiente para inviabilizar enumeração', () => {
    const t = gerarToken()
    // 32 bytes em base64url → 43 caracteres, 256 bits.
    expect(t).toHaveLength(43)
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('nunca repete', () => {
    const amostra = new Set(Array.from({ length: 500 }, () => gerarToken()))
    expect(amostra.size).toBe(500)
  })

  it('é gerado com crypto, não com Math.random', () => {
    expect(libProposals).toMatch(/randomBytes/)
    expect(libProposals).not.toMatch(/Math\.random/)
  })
})

describe('projeção pública', () => {
  /** Corpo da função que serve a proposta pelo link. */
  const trecho = libProposals.slice(
    libProposals.indexOf('export async function getPublicProposal'),
    libProposals.indexOf('export async function registerView'),
  )

  it('não seleciona colunas com asterisco', () => {
    // `SELECT *` numa rota pública faz qualquer coluna futura vazar sozinha.
    expect(trecho).not.toMatch(/SELECT\s+\*/i)
    expect(trecho).not.toMatch(/p\.\*/)
  })

  it('não expõe campos internos', () => {
    // Só a lista do SELECT interessa: `public_token` aparece no WHERE, que é
    // como a proposta é localizada, e isso não a devolve a ninguém.
    const listaSelect = trecho
      .split(/SELECT/i)[1]
      ?.split(/\bFROM\b/i)[0] ?? ''

    expect(listaSelect, 'não encontrei a lista de campos').toMatch(/p\.title/)

    for (const campo of ['internal_notes', 'created_by', 'accepted_ip', 'public_token']) {
      expect(listaSelect, `campo interno na projeção pública: ${campo}`).not.toMatch(
        new RegExp(`\\b${campo}\\b`),
      )
    }
  })

  it('a rota remove o id interno antes de responder', () => {
    expect(rotaPublica).toMatch(/const\s*\{\s*_id\s*,\s*\.\.\.publica\s*\}/)
    expect(rotaPublica).toMatch(/json\(res,\s*200,\s*\{\s*proposal:\s*publica\s*\}\)/)
  })

  it('rascunho e recusada não são visíveis pelo link', () => {
    const visiveis = /VISIVEIS_PUBLICAMENTE\s*=\s*\[([^\]]*)\]/.exec(libProposals)?.[1] ?? ''
    expect(visiveis).not.toMatch(/draft/)
    expect(visiveis).not.toMatch(/rejected/)
    expect(visiveis).not.toMatch(/expired/)
  })
})

describe('resposta indistinguível', () => {
  it('token inválido e proposta indisponível devolvem o mesmo corpo', () => {
    // Uma única constante usada em todos os caminhos de "não achei" — se
    // alguém criar uma mensagem específica, este teste quebra.
    const ocorrencias = rotaPublica.match(/NAO_ENCONTRADA/g) ?? []
    expect(ocorrencias.length).toBeGreaterThanOrEqual(3)
    expect(rotaPublica).toMatch(/const NAO_ENCONTRADA = \{/)
  })

  it('não devolve mensagem diferente por motivo de ausência', () => {
    const linhas404 = rotaPublica
      .split('\n')
      .filter((l) => /json\(res,\s*404/.test(l))
    for (const l of linhas404) {
      expect(l, `404 com corpo próprio: ${l.trim()}`).toMatch(/NAO_ENCONTRADA/)
    }
  })
})

describe('aceite', () => {
  it('é idempotente por condição na escrita, não por leitura prévia', () => {
    // `WHERE status IN ('sent','viewed')` no UPDATE é o que torna o duplo
    // clique inofensivo: a segunda escrita não encontra linha e não sobrescreve
    // quem aceitou nem o valor congelado.
    expect(libProposals).toMatch(/WHERE public_token = \$\{token\} AND status IN \('sent','viewed'\)/)
  })

  it('congela o total no aceite, calculado no banco', () => {
    expect(libProposals).toMatch(/accepted_total = greatest\(/)
    expect(libProposals).toMatch(/::numeric/)
  })

  it('a URL pública não é montada a partir do Host da requisição', () => {
    const send = readFileSync('api/proposals/[id]/send.js', 'utf8')
    expect(send).toMatch(/PUBLIC_SITE_URL/)
    expect(send).not.toMatch(/req\.headers\.host/)
  })
})
