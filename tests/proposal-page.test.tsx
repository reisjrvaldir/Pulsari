// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProposalPage } from '../src/pages/ProposalPage'

/**
 * Página pública da proposta. É a única tela do sistema que um estranho abre,
 * então os testes cobrem tanto o caminho feliz quanto o que ela NÃO pode
 * mostrar.
 */

const TOKEN = 'x'.repeat(43)

const PROPOSTA_BASE = {
  title: 'Site institucional e identidade',
  presentation: 'Uma apresentação.\n\nCom dois parágrafos.',
  scope: 'O escopo combinado.',
  deliverables: 'Três entregáveis.',
  timeline: 'Seis semanas.',
  discount: '500.00',
  valid_until: '2099-12-31',
  status: 'sent',
  accepted_at: null,
  accepted_by: null,
  accepted_total: null,
  client_name: 'Cardassi & Saad',
  items_total: '7171.65',
  items: [
    { description: 'Landing page', quantity: '1.000', unit_price: '4500.00', line_total: '4500.00' },
    { description: 'Manutenção mensal', quantity: '3.000', unit_price: '890.55', line_total: '2671.65' },
  ],
  vencida: false,
}

let respostas: { get?: { status: number; body: unknown }; post?: { status: number; body: unknown } }

function mockFetch() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const r = (init?.method === 'POST' ? respostas.post : respostas.get) ?? {
      status: 404, body: { error: 'não encontrada' },
    }
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
    } as Response
  })
}

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={[`/proposta/${TOKEN}`]}>
      <Routes>
        <Route path="/proposta/:token" element={<ProposalPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  respostas = { get: { status: 200, body: { proposal: PROPOSTA_BASE } } }
  vi.stubGlobal('fetch', mockFetch())
})

afterEach(() => vi.unstubAllGlobals())

describe('proposta disponível', () => {
  it('mostra título, cliente e as seções de conteúdo', async () => {
    renderPagina()
    expect(await screen.findByText('Site institucional e identidade')).toBeInTheDocument()
    expect(screen.getByText(/Cardassi & Saad/)).toBeInTheDocument()
    for (const secao of ['Apresentação', 'Escopo', 'Entregáveis', 'Prazo', 'Investimento']) {
      expect(screen.getByText(secao), `seção ${secao}`).toBeInTheDocument()
    }
  })

  it('lista os itens com valores formatados em real', async () => {
    renderPagina()
    await screen.findByText('Landing page')
    expect(screen.getByText('Manutenção mensal')).toBeInTheDocument()
    // 2671.65 é o resultado exato de 3 × 890,55 — calculado no banco.
    expect(screen.getByText('R$ 2.671,65')).toBeInTheDocument()
  })

  it('mostra subtotal, desconto e total', async () => {
    renderPagina()
    await screen.findByText('Investimento')
    expect(screen.getByText('R$ 7.171,65')).toBeInTheDocument()
    expect(screen.getByText(/−\s*R\$\s*500,00/)).toBeInTheDocument()
    // 7171,65 − 500,00
    expect(screen.getByText('R$ 6.671,65')).toBeInTheDocument()
  })

  it('oferece o formulário de aceite', async () => {
    renderPagina()
    expect(await screen.findByLabelText(/seu nome completo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /aceitar proposta/i })).toBeInTheDocument()
  })
})

describe('aceite', () => {
  it('registra e passa a mostrar a proposta como aceita', async () => {
    respostas.post = { status: 201, body: { ok: true, jaAceita: false, total: '6671.65' } }
    const user = userEvent.setup()
    renderPagina()

    await user.type(await screen.findByLabelText(/seu nome completo/i), 'Valdir Reis')

    // Depois do aceite a página recarrega os dados do servidor.
    respostas.get = {
      status: 200,
      body: {
        proposal: {
          ...PROPOSTA_BASE,
          status: 'accepted',
          accepted_at: '2026-09-11T12:00:00Z',
          accepted_by: 'Valdir Reis',
          accepted_total: '6671.65',
        },
      },
    }
    await user.click(screen.getByRole('button', { name: /aceitar proposta/i }))

    expect(await screen.findByText(/proposta aceita/i)).toBeInTheDocument()
    expect(screen.getByText(/Valdir Reis/)).toBeInTheDocument()
  })

  it('mostra o erro devolvido pela API sem inventar mensagem', async () => {
    respostas.post = { status: 409, body: { error: 'Esta proposta não está disponível para aceite.' } }
    const user = userEvent.setup()
    renderPagina()

    await user.type(await screen.findByLabelText(/seu nome completo/i), 'Fulano')
    await user.click(screen.getByRole('button', { name: /aceitar proposta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/não está disponível/i)
  })
})

describe('estados que bloqueiam o aceite', () => {
  it('proposta já aceita não mostra o formulário', async () => {
    respostas.get = {
      status: 200,
      body: {
        proposal: {
          ...PROPOSTA_BASE, status: 'accepted',
          accepted_at: '2026-09-10T12:00:00Z', accepted_by: 'Ana', accepted_total: '6671.65',
        },
      },
    }
    renderPagina()
    expect(await screen.findByText(/proposta aceita/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aceitar proposta/i })).not.toBeInTheDocument()
  })

  it('proposta aceita exibe o total congelado, não o recalculado', async () => {
    respostas.get = {
      status: 200,
      body: {
        proposal: {
          ...PROPOSTA_BASE, status: 'accepted',
          accepted_at: '2026-09-10T12:00:00Z', accepted_by: 'Ana',
          // Valor congelado difere do cálculo atual de propósito.
          accepted_total: '5000.00',
        },
      },
    }
    renderPagina()
    await screen.findByText(/proposta aceita/i)
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument()
    expect(screen.queryByText('R$ 6.671,65')).not.toBeInTheDocument()
  })

  it('proposta vencida avisa e não deixa aceitar', async () => {
    respostas.get = {
      status: 200,
      body: { proposal: { ...PROPOSTA_BASE, vencida: true, valid_until: '2020-01-01' } },
    }
    renderPagina()
    expect(await screen.findByText(/venceu em/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aceitar proposta/i })).not.toBeInTheDocument()
  })
})

describe('token inválido', () => {
  it('mostra a mesma tela genérica, sem revelar o motivo', async () => {
    respostas.get = { status: 404, body: { error: 'Proposta não encontrada ou indisponível.' } }
    renderPagina()

    expect(await screen.findByText(/proposta não encontrada/i)).toBeInTheDocument()
    // Nada de "expirada", "rascunho" ou "recusada": a tela não distingue os
    // casos, do mesmo jeito que a API não distingue.
    expect(screen.queryByText(/rascunho/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/recusada/i)).not.toBeInTheDocument()
  })

  it('falha de rede cai na mesma tela, não em erro cru', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    renderPagina()
    expect(await screen.findByText(/proposta não encontrada/i)).toBeInTheDocument()
  })
})
