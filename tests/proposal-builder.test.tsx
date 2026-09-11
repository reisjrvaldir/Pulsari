// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProposalsList } from '../src/admin/proposals/ProposalsList'
import { ProposalEditor } from '../src/admin/proposals/ProposalEditor'

const RASCUNHO = {
  id: 'p-1',
  title: 'Site institucional',
  presentation: null, scope: null, deliverables: null, timeline: null,
  internal_notes: 'Margem apertada, negociar prazo.',
  discount: '0', valid_until: null,
  status: 'draft', public_token: 'z'.repeat(43),
  client_id: null, client_name: null,
  items_total: '4500.00',
  items: [{ id: 'i-1', description: 'Landing page', quantity: '1', unit_price: '4500.00', line_total: '4500.00' }],
  sent_at: null, first_viewed_at: null,
  accepted_at: null, accepted_by: null, accepted_total: null,
}

let rotas: Record<string, { status: number; body: unknown }>

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const chave = `${init?.method ?? 'GET'} ${url}`
    const r = rotas[chave] ?? { status: 404, body: { error: 'rota não dublada: ' + chave } }
    return { ok: r.status >= 200 && r.status < 300, status: r.status, json: async () => r.body } as Response
  })
}

beforeEach(() => {
  rotas = { 'GET /api/clients': { status: 200, body: { clients: [] } } }
  vi.stubGlobal('fetch', mockFetch())
})
afterEach(() => vi.unstubAllGlobals())

describe('lista de propostas', () => {
  function renderLista() {
    return render(
      <MemoryRouter initialEntries={['/admin/proposals']}>
        <Routes><Route path="/admin/proposals" element={<ProposalsList />} /></Routes>
      </MemoryRouter>,
    )
  }

  it('mostra as propostas com status e valor', async () => {
    rotas['GET /api/proposals'] = {
      status: 200,
      body: {
        proposals: [
          { id: 'p-1', title: 'Site institucional', status: 'sent', client_name: 'Cardassi',
            items_total: '4500.00', accepted_total: null, valid_until: null, view_count: '3', created_at: '' },
        ],
      },
    }
    renderLista()
    // "Enviada" também é o rótulo de um botão de filtro; delimitar à tabela
    // evita casar com ele.
    const linha = (await screen.findByText('Site institucional')).closest('tr')!
    expect(within(linha).getByText('Enviada')).toBeInTheDocument()
    expect(within(linha).getByText('R$ 4.500,00')).toBeInTheDocument()
    expect(within(linha).getByText('3')).toBeInTheDocument()
  })

  it('proposta aceita mostra o valor congelado, não o recalculado', async () => {
    rotas['GET /api/proposals'] = {
      status: 200,
      body: {
        proposals: [
          { id: 'p-2', title: 'Aceita', status: 'accepted', client_name: null,
            items_total: '9999.00', accepted_total: '4000.00', valid_until: null, view_count: '1', created_at: '' },
        ],
      },
    }
    renderLista()
    await screen.findByText('Aceita')
    expect(screen.getByText('R$ 4.000,00')).toBeInTheDocument()
    expect(screen.queryByText('R$ 9.999,00')).not.toBeInTheDocument()
  })

  it('estado vazio orienta em vez de mostrar tabela vazia', async () => {
    rotas['GET /api/proposals'] = { status: 200, body: { proposals: [] } }
    renderLista()
    expect(await screen.findByText(/nenhuma proposta ainda/i)).toBeInTheDocument()
  })

  it('filtra por status pela API, não na tela', async () => {
    rotas['GET /api/proposals'] = { status: 200, body: { proposals: [] } }
    rotas['GET /api/proposals?status=accepted'] = { status: 200, body: { proposals: [] } }
    const user = userEvent.setup()
    renderLista()
    await screen.findByText(/nenhuma proposta ainda/i)

    await user.click(screen.getByRole('button', { name: 'Aceita' }))

    const chamadas = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0])
    expect(chamadas).toContain('/api/proposals?status=accepted')
  })
})

describe('editor de proposta', () => {
  function renderEditor(rota: string) {
    return render(
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/admin/proposals/new" element={<ProposalEditor />} />
          <Route path="/admin/proposals/:id" element={<ProposalEditor />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('nova proposta abre em branco com uma linha de item', async () => {
    renderEditor('/admin/proposals/new')
    expect(await screen.findByText('Nova proposta')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Descrição')).toHaveValue('')
    expect(screen.getByRole('button', { name: /criar rascunho/i })).toBeInTheDocument()
  })

  it('adiciona e remove linhas de item', async () => {
    const user = userEvent.setup()
    renderEditor('/admin/proposals/new')
    await screen.findByText('Nova proposta')

    await user.click(screen.getByRole('button', { name: /adicionar item/i }))
    expect(screen.getAllByPlaceholderText('Descrição')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /remover item 2/i }))
    expect(screen.getAllByPlaceholderText('Descrição')).toHaveLength(1)
  })

  it('carrega o rascunho existente com os itens', async () => {
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: RASCUNHO } }
    renderEditor('/admin/proposals/p-1')

    expect(await screen.findByDisplayValue('Site institucional')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Landing page')).toBeInTheDocument()
    expect(screen.getByText('Rascunho')).toBeInTheDocument()
  })

  it('envia e mostra o link público para copiar', async () => {
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: RASCUNHO } }
    rotas['POST /api/proposals/p-1/send'] = {
      status: 200,
      body: {
        proposal: { ...RASCUNHO, status: 'sent' },
        url: 'https://www.pulsari.com.br/proposta/' + 'z'.repeat(43),
      },
    }
    const user = userEvent.setup()
    renderEditor('/admin/proposals/p-1')

    await screen.findByDisplayValue('Site institucional')
    // Após enviar, a recarga devolve a proposta já enviada.
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: { ...RASCUNHO, status: 'sent' } } }
    await user.click(screen.getByRole('button', { name: /enviar e gerar link/i }))

    expect(await screen.findByText(/link para enviar ao cliente/i)).toBeInTheDocument()
    expect(screen.getByText(new RegExp('/proposta/'))).toBeInTheDocument()
  })

  it('proposta enviada fica somente leitura e avisa o porquê', async () => {
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: { ...RASCUNHO, status: 'sent' } } }
    renderEditor('/admin/proposals/p-1')

    const titulo = await screen.findByDisplayValue('Site institucional')
    expect(titulo).toBeDisabled()
    expect(screen.getByText(/devolva-a a rascunho/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^salvar$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /adicionar item/i })).not.toBeInTheDocument()
  })

  it('mostra o erro da API sem inventar mensagem', async () => {
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: RASCUNHO } }
    rotas['POST /api/proposals/p-1/send'] = {
      status: 422, body: { error: 'Adicione ao menos um item antes de enviar.' },
    }
    const user = userEvent.setup()
    renderEditor('/admin/proposals/p-1')

    await screen.findByDisplayValue('Site institucional')
    await user.click(screen.getByRole('button', { name: /enviar e gerar link/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/ao menos um item/i)
  })

  it('as notas internas ficam marcadas como invisíveis ao cliente', async () => {
    rotas['GET /api/proposals/p-1'] = { status: 200, body: { proposal: RASCUNHO } }
    renderEditor('/admin/proposals/p-1')

    const campo = await screen.findByDisplayValue('Margem apertada, negociar prazo.')
    const bloco = campo.closest('label')!
    expect(within(bloco).getByText(/nunca sai na página do cliente/i)).toBeInTheDocument()
  })
})
