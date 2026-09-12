import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Fase 06 da Sprint 04: "auditar dinheiro com NUMERIC/centavos, não usar float
 * inadequadamente".
 *
 * Auditoria feita uma vez envelhece. Estes testes são a forma de a regra
 * continuar valendo depois — falham se alguém introduzir uma coluna monetária
 * em ponto flutuante ou fizer aritmética de dinheiro em JavaScript.
 */

/**
 * Comentários precisam sair antes da varredura: "real" é palavra comum em
 * português ("banco real", "dados reais") e casaria com o tipo SQL `real`,
 * reprovando migrations corretas.
 */
function semComentarios(sql) {
  return sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

const migrations = readdirSync('migrations')
  .filter((f) => f.endsWith('.sql'))
  .map((f) => [f, semComentarios(readFileSync(`migrations/${f}`, 'utf8'))])

/** Nomes que denotam dinheiro em qualquer das migrations. */
const PALAVRAS_MONETARIAS = /(amount|value|price|total|rate|saldo|valor|balance|fee|cost)/i

describe('colunas monetárias', () => {
  it('nenhuma migration usa tipo de ponto flutuante', () => {
    for (const [arquivo, sql] of migrations) {
      const achados = sql.match(/\b(real|double\s+precision|float\s*\(?\d*\)?|money)\b/gi) ?? []
      expect(achados, `${arquivo} usa tipo impróprio para dinheiro: ${achados.join(', ')}`).toEqual([])
    }
  })

  it('toda coluna com nome de dinheiro é NUMERIC com 2 casas', () => {
    const problemas = []

    for (const [arquivo, sql] of migrations) {
      // Linhas de definição de coluna dentro de CREATE TABLE.
      for (const linha of sql.split('\n')) {
        const m = /^\s{2,}([a-z_]+)\s+([a-z]+(?:\s*\([^)]*\))?)/i.exec(linha)
        if (!m) continue
        const [, coluna, tipo] = m
        if (!PALAVRAS_MONETARIAS.test(coluna)) continue

        // Nem tudo que casa com a palavra é dinheiro:
        //  - from_value / to_value: histórico textual de mudança de campo
        //  - total_linhas e afins: contagem, não valor
        //  - *_dias / *_horas / *_meses: duração
        if (/^(from|to)_value$/.test(coluna)) continue
        if (/_(linhas|count|qtd|dias|horas|meses)$/.test(coluna)) continue
        if (!/^numeric\s*\(\s*\d+\s*,\s*2\s*\)$/i.test(tipo.trim())) {
          problemas.push(`${arquivo}: ${coluna} é ${tipo.trim()}`)
        }
      }
    }

    expect(problemas, 'coluna monetária fora de NUMERIC(x,2)').toEqual([])
  })

  it('valores monetários têm restrição de não-negativo onde faz sentido', () => {
    const financeiro = migrations.find(([f]) => f.includes('financial'))?.[1] ?? ''
    expect(financeiro).toMatch(/amount\s*>\s*0/)
  })
})

describe('aritmética de dinheiro na aplicação', () => {
  const arquivosApi = []
  const varrer = (dir) => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      const caminho = `${dir}/${entrada.name}`
      if (entrada.isDirectory()) varrer(caminho)
      else if (entrada.name.endsWith('.js')) arquivosApi.push([caminho, readFileSync(caminho, 'utf8')])
    }
  }
  varrer('api')

  it('nenhum parseFloat sobre campo monetário', () => {
    // O driver devolve NUMERIC como string para preservar precisão. Converter
    // para Number reintroduz exatamente o erro que o tipo existe para evitar —
    // somas devem acontecer em SQL.
    const problemas = []
    for (const [arquivo, src] of arquivosApi) {
      for (const linha of src.split('\n')) {
        if (/parseFloat\s*\(/.test(linha) && PALAVRAS_MONETARIAS.test(linha)) {
          problemas.push(`${arquivo}: ${linha.trim().slice(0, 70)}`)
        }
      }
    }
    expect(problemas).toEqual([])
  })

  it('nenhuma soma de dinheiro feita em JavaScript', () => {
    const problemas = []
    for (const [arquivo, src] of arquivosApi) {
      for (const linha of src.split('\n')) {
        if (/\breduce\s*\(/.test(linha) && PALAVRAS_MONETARIAS.test(linha)) {
          problemas.push(`${arquivo}: ${linha.trim().slice(0, 70)}`)
        }
      }
    }
    expect(problemas, 'agregação de dinheiro deve ser SUM() em SQL').toEqual([])
  })
})
