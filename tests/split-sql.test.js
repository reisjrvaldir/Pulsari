import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { splitStatements } from '../scripts/split-sql.js'

/**
 * Regressão: o runner mandava o arquivo .sql inteiro numa chamada só e o
 * Postgres respondia "cannot insert multiple commands into a prepared
 * statement". A migration precisa sair daqui já fatiada.
 */
describe('splitStatements', () => {
  it('separa comandos simples', () => {
    expect(splitStatements('SELECT 1; SELECT 2;')).toEqual(['SELECT 1', 'SELECT 2'])
  })

  it('aceita o último comando sem ponto e vírgula', () => {
    expect(splitStatements('SELECT 1; SELECT 2')).toEqual(['SELECT 1', 'SELECT 2'])
  })

  it('descarta comentários de linha', () => {
    const sql = '-- cria a tabela\nCREATE TABLE a (id int);\n-- fim'
    expect(splitStatements(sql)).toEqual(['CREATE TABLE a (id int)'])
  })

  it('descarta comentários de bloco', () => {
    const sql = '/* nota\n   com ; dentro */ SELECT 1;'
    expect(splitStatements(sql)).toEqual(['SELECT 1'])
  })

  it('não quebra em ponto e vírgula dentro de string', () => {
    const sql = "INSERT INTO t (msg) VALUES ('oi; tudo bem?'); SELECT 1;"
    expect(splitStatements(sql)).toEqual([
      "INSERT INTO t (msg) VALUES ('oi; tudo bem?')",
      'SELECT 1',
    ])
  })

  it('entende aspa escapada dentro de string', () => {
    const sql = "SELECT 'nao''e o fim; ainda'; SELECT 2;"
    expect(splitStatements(sql)).toEqual(["SELECT 'nao''e o fim; ainda'", 'SELECT 2'])
  })

  it('não quebra dentro de identificador com aspas duplas', () => {
    const sql = 'SELECT "coluna;estranha" FROM t; SELECT 2;'
    expect(splitStatements(sql)).toEqual(['SELECT "coluna;estranha" FROM t', 'SELECT 2'])
  })

  it('preserva bloco dollar-quoted inteiro', () => {
    const sql = "CREATE FUNCTION f() RETURNS void AS $$ BEGIN raise notice 'a;b'; END $$ LANGUAGE plpgsql; SELECT 1;"
    const out = splitStatements(sql)
    expect(out).toHaveLength(2)
    expect(out[0]).toContain('$$')
    expect(out[0]).toContain("raise notice 'a;b'")
    expect(out[1]).toBe('SELECT 1')
  })

  it('preserva bloco dollar-quoted com tag', () => {
    const sql = 'CREATE FUNCTION f() RETURNS void AS $corpo$ SELECT 1; $corpo$ LANGUAGE sql;'
    expect(splitStatements(sql)).toHaveLength(1)
  })

  it('ignora ponto e vírgula solto e linhas em branco', () => {
    expect(splitStatements(';;\n\n;  ;')).toEqual([])
    expect(splitStatements('')).toEqual([])
  })

  it('fatia a migration real em comandos executáveis', () => {
    const sql = readFileSync('migrations/001_auth_foundation.sql', 'utf8')
    const out = splitStatements(sql)

    // 5 CREATE TABLE + 6 CREATE INDEX
    expect(out).toHaveLength(11)

    for (const stmt of out) {
      expect(stmt, 'nenhum comando pode conter outro: ' + stmt.slice(0, 40)).not.toMatch(/;/)
      expect(stmt).toMatch(/^CREATE (TABLE|UNIQUE INDEX|INDEX)/)
    }

    const tabelas = out.filter((s) => s.startsWith('CREATE TABLE')).length
    expect(tabelas).toBe(5)
  })

  it('toda migration é reexecutável sem erro', () => {
    // O runner não abre transação envolvendo os comandos (o driver HTTP da
    // Neon não permite), então uma falha no meio deixa a migration parcialmente
    // aplicada. Reexecutar precisa ser seguro — daí a exigência.
    //
    // `ADD CONSTRAINT` e `CREATE TRIGGER` não aceitam IF NOT EXISTS; o padrão
    // aceito é vir logo após o DROP ... IF EXISTS correspondente.
    const migrations = readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort()
    expect(migrations.length).toBeGreaterThan(0)

    for (const arquivo of migrations) {
      const comandos = splitStatements(readFileSync(`migrations/${arquivo}`, 'utf8'))
      expect(comandos.length, `${arquivo} não produziu comandos`).toBeGreaterThan(0)

      comandos.forEach((stmt, i) => {
        // O DROP correspondente precisa vir ANTES, mas não necessariamente
        // colado: em 005 o DROP TRIGGER abre a migration e o CREATE TRIGGER
        // a fecha, com a função e a limpeza no meio.
        const anteriores = comandos.slice(0, i).join('\n')

        const seguro =
          /IF NOT EXISTS/i.test(stmt) ||
          /IF EXISTS/i.test(stmt) ||
          /OR REPLACE/i.test(stmt) ||
          /ON CONFLICT/i.test(stmt) ||
          (/^ALTER TABLE .* ADD CONSTRAINT/is.test(stmt) &&
            /DROP CONSTRAINT IF EXISTS/i.test(anteriores)) ||
          (/^CREATE TRIGGER/is.test(stmt) &&
            /DROP TRIGGER IF EXISTS/i.test(anteriores)) ||
          // DELETE com WHERE é no-op na segunda execução: o que casava já
          // sumiu. Sem WHERE seria apagar a tabela inteira toda vez — por
          // isso a exigência do filtro.
          /^DELETE\s+FROM\s+\S+\s+WHERE\s+/is.test(stmt) ||
          // UPDATE com WHERE que corrige uma invariante: na segunda execução
          // não casa linha nenhuma. Sem WHERE reescreveria a tabela inteira.
          /^UPDATE\s+[\s\S]*\bWHERE\b/is.test(stmt) ||
          // Remover um default já removido também é no-op.
          /^ALTER\s+TABLE\s+.*DROP\s+DEFAULT/is.test(stmt)

        expect(
          seguro,
          `${arquivo}, comando ${i + 1} não é reexecutável: ${stmt.replace(/\s+/g, ' ').slice(0, 70)}`,
        ).toBe(true)
      })
    }
  })

  it('nenhum comando carrega outro junto, fora de bloco $$', () => {
    const migrations = readdirSync('migrations').filter((f) => f.endsWith('.sql'))
    for (const arquivo of migrations) {
      for (const stmt of splitStatements(readFileSync(`migrations/${arquivo}`, 'utf8'))) {
        // Ponto e vírgula só é aceitável dentro de corpo de função.
        const dentroDeBloco = stmt.includes('$$')
        if (!dentroDeBloco) {
          expect(stmt, `${arquivo}: ${stmt.slice(0, 50)}`).not.toMatch(/;/)
        }
      }
    }
  })
})
