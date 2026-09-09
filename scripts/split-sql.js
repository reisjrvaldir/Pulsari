/**
 * Quebra um arquivo .sql em comandos individuais.
 *
 * O driver HTTP da Neon manda cada chamada como um prepared statement, e o
 * Postgres recusa mais de um comando por statement. Por isso a migration
 * precisa ser enviada comando a comando.
 *
 * O split não pode ser um `split(';')` ingênuo: ponto e vírgula dentro de
 * string, de identificador com aspas, de comentário ou de bloco $$...$$ não
 * separa comando nenhum.
 */
export function splitStatements(sql) {
  const statements = []
  let atual = ''
  let i = 0

  while (i < sql.length) {
    const c = sql[i]
    const prox = sql[i + 1]

    // Comentário de linha: descarta até o fim da linha.
    if (c === '-' && prox === '-') {
      const fim = sql.indexOf('\n', i)
      i = fim === -1 ? sql.length : fim + 1
      continue
    }

    // Comentário de bloco.
    if (c === '/' && prox === '*') {
      const fim = sql.indexOf('*/', i + 2)
      i = fim === -1 ? sql.length : fim + 2
      continue
    }

    // String literal: '' dentro dela é aspa escapada, não fim da string.
    if (c === "'") {
      atual += c
      i++
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") { atual += "''"; i += 2; continue }
        if (sql[i] === "'") { atual += "'"; i++; break }
        atual += sql[i]
        i++
      }
      continue
    }

    // Identificador entre aspas duplas.
    if (c === '"') {
      atual += c
      i++
      while (i < sql.length) {
        atual += sql[i]
        if (sql[i] === '"') { i++; break }
        i++
      }
      continue
    }

    // Bloco dollar-quoted: $$ ... $$ ou $tag$ ... $tag$ (corpo de função).
    if (c === '$') {
      const abre = /^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/.exec(sql.slice(i))
      if (abre) {
        const tag = abre[0]
        const fim = sql.indexOf(tag, i + tag.length)
        const ate = fim === -1 ? sql.length : fim + tag.length
        atual += sql.slice(i, ate)
        i = ate
        continue
      }
    }

    // Fim de comando.
    if (c === ';') {
      const limpo = atual.trim()
      if (limpo) statements.push(limpo)
      atual = ''
      i++
      continue
    }

    atual += c
    i++
  }

  // Último comando pode vir sem ponto e vírgula final.
  const resto = atual.trim()
  if (resto) statements.push(resto)

  return statements
}
