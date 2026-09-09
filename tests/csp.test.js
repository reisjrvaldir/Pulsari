import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Regressão: a CSP definia script-src sem 'unsafe-inline', mas o index.html
 * carregava o bootstrap do GA4 num <script> inline. O navegador bloqueou em
 * produção — e a verificação manual não pegou, porque o console foi lido
 * depois de a violação já ter passado.
 *
 * Estes testes são estáticos: não dependem de timing nem de navegador.
 */

const html = readFileSync('index.html', 'utf8')
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8'))

function diretiva(nome) {
  const csp = vercel.headers
    .find((h) => h.source === '/(.*)')
    .headers.find((h) => h.key === 'Content-Security-Policy').value

  return csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(nome + ' '))
}

/** Todo <script> com corpo próprio, ignorando os que só têm src. */
function scriptsInline() {
  const blocos = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  return blocos
    .map(([, attrs, corpo]) => ({ attrs, corpo: corpo.trim() }))
    .filter(({ corpo }) => corpo.length > 0)
}

describe('CSP × index.html', () => {
  it('script-src não libera unsafe-inline', () => {
    // Se um dia isto passar a falhar, a CSP foi enfraquecida — é a diretiva
    // que impede injeção de script arbitrário na página.
    expect(diretiva('script-src')).not.toContain("'unsafe-inline'")
  })

  it('nenhum script executável inline no index.html', () => {
    const executaveis = scriptsInline().filter(({ attrs }) => {
      const tipo = /type\s*=\s*["']([^"']+)["']/.exec(attrs)?.[1]
      // Blocos de dados (JSON-LD) não executam e não são bloqueados.
      return !tipo || tipo === 'text/javascript' || tipo === 'module'
    })

    expect(
      executaveis.map((s) => s.corpo.slice(0, 60)),
      'script inline seria bloqueado pela CSP — mova para um arquivo em public/',
    ).toEqual([])
  })

  it('o bootstrap do analytics é carregado como arquivo externo', () => {
    expect(html).toMatch(/<script\s+src="\/analytics-init\.js"><\/script>/)
  })

  it('as origens externas usadas no html estão liberadas na CSP', () => {
    const scriptSrc = diretiva('script-src')
    const externos = [...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)]
      .map(([, url]) => new URL(url).origin)

    for (const origem of new Set(externos)) {
      expect(scriptSrc, 'origem não liberada na CSP: ' + origem).toContain(origem)
    }
  })

  it('style-src mantém unsafe-inline — o framer-motion depende disso', () => {
    // Dívida consciente: o site anima com estilo inline em toda seção.
    // Remover exigiria nonce por requisição. Documentado, não acidental.
    expect(diretiva('style-src')).toContain("'unsafe-inline'")
  })

  it('as diretivas de contenção continuam presentes', () => {
    for (const d of ['frame-ancestors', 'object-src', 'base-uri', 'form-action']) {
      expect(diretiva(d), 'diretiva ausente: ' + d).toBeTruthy()
    }
  })
})
