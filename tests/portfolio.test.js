import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { gerarSlug } from '../api/_lib/portfolio.js'

const lib = readFileSync('api/_lib/portfolio.js', 'utf8')
const rotaPublica = readFileSync('api/public/portfolio.js', 'utf8')
const rotaCriar = readFileSync('api/portfolio/index.js', 'utf8')
const rotaPublicar = readFileSync('api/portfolio/[id]/publish.js', 'utf8')
const rotaRascunho = readFileSync('api/projects/[id]/portfolio-draft.js', 'utf8')
const migration = readFileSync('migrations/010_portfolio.sql', 'utf8')

describe('slug', () => {
  it('remove acento, caixa e pontuação', () => {
    expect(gerarSlug('Hospital Veterinário Dr. Drummond')).toBe('hospital-veterinario-dr-drummond')
    expect(gerarSlug('ÁGUA e Café')).toBe('agua-e-cafe')
  })

  it('colapsa separadores e não deixa traço nas pontas', () => {
    expect(gerarSlug('  Alpha   LED — Mídia  ')).toBe('alpha-led-midia')
    expect(gerarSlug('---teste---')).toBe('teste')
  })

  it('tem fallback quando não sobra nada', () => {
    expect(gerarSlug('!!!')).toBe('case')
    expect(gerarSlug('')).toBe('case')
    expect(gerarSlug(null)).toBe('case')
  })

  it('respeita o formato exigido pelo banco', () => {
    const formato = /^[a-z0-9]+(-[a-z0-9]+)*$/
    for (const t of ['Cardassi & Saad', 'ONG Star 2026', '  --  ', 'Ação!']) {
      expect(gerarSlug(t), t).toMatch(formato)
    }
  })
})

describe('vazamento de dados internos — auditoria da Fase 06', () => {
  it('a tabela não tem coluna para valor, nota interna, card ou anexo', () => {
    // A defesa mais forte contra vazar é não ter onde guardar.
    for (const proibido of ['value', 'payment', 'internal', 'notes', 'card', 'sprint', 'attachment']) {
      expect(migration, `coluna suspeita no portfólio: ${proibido}`)
        .not.toMatch(new RegExp(`^\\s+${proibido}\\w*\\s+`, 'im'))
    }
  })

  it('a projeção pública não usa asterisco', () => {
    const trecho = lib.slice(lib.indexOf('export async function listPublished'))
    expect(trecho).not.toMatch(/SELECT\s+\*/i)
  })

  it('a projeção pública não devolve project_id nem ids internos', () => {
    const trecho = lib.slice(
      lib.indexOf('export async function listPublished'),
      lib.indexOf('export async function createItem'),
    )
    const listas = [...trecho.matchAll(/SELECT([\s\S]*?)FROM/gi)].map((m) => m[1])
    expect(listas.length).toBeGreaterThan(0)
    for (const lista of listas) {
      for (const campo of ['project_id', 'created_by', 'id,', 'published_at']) {
        expect(lista, `campo interno na projeção pública: ${campo}`).not.toContain(campo)
      }
    }
  })

  it('a rota pública não faz join com projects', () => {
    const trecho = lib.slice(
      lib.indexOf('export async function listPublished'),
      lib.indexOf('export async function createItem'),
    )
    expect(trecho).not.toMatch(/JOIN\s+projects/i)

    // Comentários fora: o docstring da rota cita `projects` justamente para
    // explicar que nada vem de lá, e casaria com a busca.
    const semComentarios = rotaPublica
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
    expect(semComentarios).not.toMatch(/projects/i)
  })

  it('o pré-preenchimento copia apenas nome e descrição do projeto', () => {
    const lista = /CAMPOS_SEGUROS_DO_PROJETO = \[([^\]]*)\]/.exec(lib)?.[1] ?? ''
    expect(lista).toMatch(/'name'/)
    expect(lista).toMatch(/'description'/)
    for (const proibido of ['value', 'payment_status', 'internal', 'notes']) {
      expect(lista, `campo do projeto copiado indevidamente: ${proibido}`).not.toContain(proibido)
    }
  })

  it('o rascunho não lê cards, sprints nem atividades do projeto', () => {
    const trecho = lib.slice(lib.indexOf('export async function rascunhoDoProjeto'))
    for (const tabela of ['project_cards', 'sprints', 'project_activity', 'financial_transactions']) {
      expect(trecho, `rascunho consulta ${tabela}`).not.toContain(tabela)
    }
  })
})

describe('publicação deliberada', () => {
  it('nada nasce publicado', () => {
    expect(migration).toMatch(/published\s+boolean NOT NULL DEFAULT false/)
  })

  it('criar e salvar não aceitam published nem featured', () => {
    // Publicar nunca pode ser efeito colateral de salvar um campo.
    const esquema = rotaCriar.slice(rotaCriar.indexOf('pick('), rotaCriar.indexOf('})'))
    expect(esquema).not.toMatch(/\bpublished\b/)
    expect(esquema).not.toMatch(/\bfeatured\b/)

    const editavel = /const EDITAVEL = \[([^\]]*)\]/.exec(lib)?.[1] ?? ''
    expect(editavel).not.toMatch(/published/)
    expect(editavel).not.toMatch(/featured/)
  })

  it('publicar exige imagem principal', () => {
    expect(lib).toMatch(/sem_imagem/)
    expect(rotaPublicar).toMatch(/Adicione a imagem principal/)
    expect(migration).toMatch(/main_image IS NOT NULL AND published_at IS NOT NULL/)
  })

  it('destaque exige estar publicado, no banco e na rota', () => {
    expect(migration).toMatch(/featured = false OR published = true/)
    expect(rotaPublicar).toMatch(/nao_publicado/)
  })

  it('despublicar remove o destaque junto', () => {
    const trecho = lib.slice(lib.indexOf('export async function setPublished'))
    expect(trecho).toMatch(/published = false, featured = false/)
  })
})

describe('vínculo com o projeto', () => {
  it('um projeto gera no máximo um case', () => {
    expect(migration).toMatch(/portfolio_items_project_key/)
    expect(migration).toMatch(/WHERE project_id IS NOT NULL/)
  })

  it('apagar o projeto não apaga o case publicado', () => {
    expect(migration).toMatch(/project_id\s+uuid REFERENCES projects\(id\) ON DELETE SET NULL/)
  })

  it('o rascunho avisa quando o projeto já tem case', () => {
    expect(rotaRascunho).toMatch(/já tem um case/)
  })
})
