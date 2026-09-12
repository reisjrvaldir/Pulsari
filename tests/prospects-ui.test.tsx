// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProspectsList } from '../src/admin/prospects/ProspectsList'

function comScore(p: Record<string, unknown>) {
  const fatores = [
    { codigo: 'email', rotulo: 'Tem e-mail', pontos: 20, atendido: Boolean(p.email) },
    { codigo: 'phone', rotulo: 'Tem telefone', pontos: 20, atendido: Boolean(p.phone) },
    { codigo: 'segment', rotulo: 'Segmento identificado', pontos: 10, atendido: Boolean(p.segment) },
    { codigo: 'source', rotulo: 'Veio por indicação', pontos: 20, atendido: p.source === 'indicacao' },
  ]
  const total = fatores.reduce((s, f) => s + (f.atendido ? f.pontos : 0), 0)
  return {
    contact_name: null, email: null, phone: null, website: null, social: null,
    segment: null, city: null, owner_id: null, notes: null,
    next_contact_at: null, last_contact_at: null, converted_lead_id: null,
    created_at: '2026-09-01T10:00:00Z', status: 'new', source: 'pesquisa',
    ...p,
    score: total,
    score_detalhe: { total, fatores, faltando: fatores.filter((f) => !f.atendido) },
  }
}

const QUENTE = comScore({ id: 'p-1', company_name: 'Alpha Saúde', email: 'a@alpha.test', phone: '8199', segment: 'Saúde', source: 'indicacao' })
const FRIO = comScore({ id: 'p-2', company_name: 'Beta Serviços' })

let rotas: Record<string, { status: number; body: unknown }>
let chamadas: string[]

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const chave = `${init?.method ?? 'GET'} ${url}`
    chamadas.push(chave)
    const r = rotas[chave] ?? { status: 404, body: { error: 'rota não dublada: ' + chave } }
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body } as Response
  })
}

beforeEach(() => {
  chamadas = []
  rotas = { 'GET /api/prospects': { status: 200, body: { prospects: [QUENTE, FRIO] } } }
  vi.stubGlobal('fetch', mockFetch())
})
afterEach(() => vi.unstubAllGlobals())

describe('lista de prospects', () => {
  it('mostra score e classifica em quente ou frio', async () => {
    render(<ProspectsList />)
    const linhaQuente = (await screen.findByText('Alpha Saúde')).closest('tr')!
    const linhaFria = screen.getByText('Beta Serviços').closest('tr')!

    // 20 + 20 + 10 + 20 = 70
    expect(within(linhaQuente).getByText('70')).toBeInTheDocument()
    // só 'pesquisa' não pontua neste dublê
    expect(within(linhaFria).getByText('0')).toBeInTheDocument()
  })

  it('ordena pelo que o servidor devolve, sem reordenar na tela', async () => {
    render(<ProspectsList />)
    await screen.findByText('Alpha Saúde')
    const linhas = screen.getAllByRole('row').slice(1)
    expect(within(linhas[0]).getByText('Alpha Saúde')).toBeInTheDocument()
  })

  it('filtro de quentes vira parâmetro de score na API', async () => {
    rotas['GET /api/prospects?score=70'] = { status: 200, body: { prospects: [QUENTE] } }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await screen.findByText('Alpha Saúde')

    await user.click(screen.getByRole('button', { name: /só quentes/i }))

    await waitFor(() => expect(chamadas).toContain('GET /api/prospects?score=70'))
  })

  it('busca é feita pela API', async () => {
    rotas['GET /api/prospects?q=alpha'] = { status: 200, body: { prospects: [QUENTE] } }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await screen.findByText('Alpha Saúde')

    await user.type(screen.getByRole('textbox', { name: /buscar prospect/i }), 'alpha')

    await waitFor(() => expect(chamadas.some((c) => c.includes('q=alpha'))).toBe(true))
  })
})

describe('painel com score explicado', () => {
  it('lista fator a fator o que somou e o que faltou', async () => {
    const user = userEvent.setup()
    render(<ProspectsList />)
    await user.click(await screen.findByText('Beta Serviços'))

    const painel = await screen.findByRole('dialog', { name: /prospect beta serviços/i })
    const bloco = within(painel).getByRole('region', { name: /detalhamento do score/i })

    expect(within(bloco).getByText('Tem e-mail')).toBeInTheDocument()
    expect(within(bloco).getByText('Tem telefone')).toBeInTheDocument()
    // A frase que transforma o número em ação.
    expect(within(painel).getByText(/para subir o score, falta/i)).toBeInTheDocument()
  })

  it('prospect completo não mostra lista de pendências', async () => {
    const completo = comScore({
      id: 'p-3', company_name: 'Gama', email: 'g@g.test', phone: '81', segment: 'X', source: 'indicacao',
    })
    rotas['GET /api/prospects'] = { status: 200, body: { prospects: [completo] } }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await user.click(await screen.findByText('Gama'))

    const painel = await screen.findByRole('dialog', { name: /prospect gama/i })
    expect(within(painel).queryByText(/para subir o score, falta/i)).not.toBeInTheDocument()
  })

  it('converte em lead e informa se criou ou reaproveitou', async () => {
    rotas['POST /api/prospects/p-1/convert'] = {
      status: 201,
      body: {
        jaConvertido: false, leadCriado: false, leadId: 'l-9',
        prospect: { ...QUENTE, status: 'converted', converted_lead_id: 'l-9' },
      },
    }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await user.click(await screen.findByText('Alpha Saúde'))

    const painel = await screen.findByRole('dialog', { name: /prospect alpha/i })
    await user.click(within(painel).getByRole('button', { name: /converter em lead/i }))

    // Reaproveitou um lead existente — a mensagem precisa dizer isso, senão a
    // equipe procura no CRM um card que não foi criado.
    expect(await within(painel).findByText(/lead que já existia/i)).toBeInTheDocument()
  })

  it('prospect já convertido não oferece converter de novo', async () => {
    const convertido = comScore({ id: 'p-4', company_name: 'Delta', status: 'converted', converted_lead_id: 'l-1' })
    rotas['GET /api/prospects'] = { status: 200, body: { prospects: [convertido] } }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await user.click(await screen.findByText('Delta'))

    const painel = await screen.findByRole('dialog', { name: /prospect delta/i })
    expect(within(painel).getByText(/já está no crm/i)).toBeInTheDocument()
    expect(within(painel).queryByRole('button', { name: /converter em lead/i })).not.toBeInTheDocument()
  })
})

describe('importação de CSV', () => {
  it('mostra o resumo por linha em vez de só "concluído"', async () => {
    rotas['POST /api/prospects/import'] = {
      status: 200,
      body: {
        total: 10, importados: 7, duplicados: 2, invalidos: 1,
        erros: [{ linha: 5, motivo: 'nome da empresa ausente' }],
        colunas_reconhecidas: ['company_name', 'email'],
      },
    }
    const user = userEvent.setup()
    render(<ProspectsList />)
    await screen.findByText('Alpha Saúde')

    await user.click(screen.getByRole('button', { name: /importar csv/i }))
    const modal = await screen.findByRole('dialog', { name: /importar csv/i })

    // Simula o arquivo escolhido.
    const arquivo = new File(['empresa,email\nAlpha,a@a.com'], 'lista.csv', { type: 'text/csv' })
    await user.upload(modal.querySelector('input[type=file]') as HTMLInputElement, arquivo)
    await user.click(within(modal).getByRole('button', { name: /^importar$/i }))

    expect(await within(modal).findByText('7')).toBeInTheDocument()
    expect(within(modal).getByText('2')).toBeInTheDocument()
    expect(within(modal).getByText(/linha 5/i)).toBeInTheDocument()
  })
})
