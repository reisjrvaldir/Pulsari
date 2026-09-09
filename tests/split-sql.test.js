import { readFileSync } from 'node:fs'
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

  it('todo comando da migration é idempotente', () => {
    const sql = readFileSync('migrations/001_auth_foundation.sql', 'utf8')
    for (const stmt of splitStatements(sql)) {
      expect(stmt, 'sem IF NOT EXISTS: ' + stmt.slice(0, 50)).toMatch(/IF NOT EXISTS/)
    }
  })
})
