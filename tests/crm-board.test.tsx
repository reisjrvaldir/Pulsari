// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CrmBoard } from '../src/admin/crm/CrmBoard'

const LEAD_BASE = {
  company_name: null, email: null, phone: null, whatsapp: null,
  source: 'website', source_detail: null, service_interest: null,
  estimated_value: null, score: 0, owner_id: null, owner_name: null,
  notes: null, last_contact_at: null, next_contact_at: null,
  board_position: 1, converted_client_id: null, created_at: '2026-09-01T10:00:00Z',
}

const ANA = { ...LEAD_BASE, id: 'l-1', name: 'Ana Souza', company_name: 'Faciles', status: 'new', estimated_value: '4500.00' }
const BRUNO = { ...LEAD_BASE, id: 'l-2', name: 'Bruno Lima', status: 'qualified' }

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
  rotas = { 'GET /api/leads': { status: 200, body: { leads: [ANA, BRUNO] } } }
  vi.stubGlobal('fetch', mockFetch())
})
afterEach(() => vi.unstubAllGlobals())

/** Localiza a coluna pelo rótulo acessível. */
const coluna = (nome: string) => screen.getByRole('region', { name: `Fase ${nome}` })

describe('quadro do CRM', () => {
  it('mostra as sete fases do funil', async () => {
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')
    for (const fase of ['Novo', 'Contatado', 'Qualificado', 'Proposta', 'Negociação', 'Ganho', 'Perdido']) {
      expect(coluna(fase), `fase ${fase}`).toBeInTheDocument()
    }
  })

  it('coloca cada lead na coluna do seu status', async () => {
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')
    expect(within(coluna('Novo')).getByText('Ana Souza')).toBeInTheDocument()
    expect(within(coluna('Qualificado')).getByText('Bruno Lima')).toBeInTheDocument()
  })

  it('soma o valor estimado por coluna', async () => {
    // Dois leads na mesma coluna: o total precisa ser a soma, não o valor de
    // um card. Com um só, o teste passaria mesmo se a soma estivesse errada.
    const CARLA = { ...LEAD_BASE, id: 'l-3', name: 'Carla Dias', status: 'new', estimated_value: '1000.00' }
    rotas['GET /api/leads'] = { status: 200, body: { leads: [ANA, CARLA, BRUNO] } }

    render(<CrmBoard />)
    await screen.findByText('Ana Souza')
    expect(within(coluna('Novo')).getByText('R$ 5.500,00')).toBeInTheDocument()
  })
})

describe('mover lead', () => {
  it('move pelo seletor, que é o caminho acessível por teclado', async () => {
    rotas['PATCH /api/leads/l-1/move'] = {
      status: 200, body: { lead: { ...ANA, status: 'contacted' } },
    }
    const user = userEvent.setup()
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')

    await user.selectOptions(
      screen.getByRole('combobox', { name: /mover ana souza/i }),
      'contacted',
    )

    await waitFor(() => {
      expect(within(coluna('Contatado')).getByText('Ana Souza')).toBeInTheDocument()
    })
    expect(chamadas).toContain('PATCH /api/leads/l-1/move')
  })

  it('move de forma otimista e desfaz se o servidor recusar', async () => {
    rotas['PATCH /api/leads/l-1/move'] = {
      status: 409, body: { error: 'Não foi possível mover este lead.' },
    }
    const user = userEvent.setup()
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')

    await user.selectOptions(
      screen.getByRole('combobox', { name: /mover ana souza/i }),
      'negotiation',
    )

    // Volta para a coluna de origem e mostra o motivo.
    await waitFor(() => {
      expect(within(coluna('Novo')).getByText('Ana Souza')).toBeInTheDocument()
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível mover/i)
  })

  it('soltar em "Ganho" converte e recarrega o quadro', async () => {
    rotas['PATCH /api/leads/l-1/move'] = {
      status: 200,
      body: {
        lead: { ...ANA, status: 'won', converted_client_id: 'c-1' },
        client: { id: 'c-1', name: 'Faciles' },
        convertido: true,
      },
    }
    const user = userEvent.setup()
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')

    rotas['GET /api/leads'] = {
      status: 200,
      body: { leads: [{ ...ANA, status: 'won', converted_client_id: 'c-1' }, BRUNO] },
    }
    await user.selectOptions(screen.getByRole('combobox', { name: /mover ana souza/i }), 'won')

    await waitFor(() => {
      expect(within(coluna('Ganho')).getByText('Ana Souza')).toBeInTheDocument()
    })
    // Duas leituras: a inicial e a recarga após converter.
    expect(chamadas.filter((c) => c === 'GET /api/leads')).toHaveLength(2)
  })

  it('arrastar e soltar move para a coluna de destino', async () => {
    rotas['PATCH /api/leads/l-2/move'] = {
      status: 200, body: { lead: { ...BRUNO, status: 'proposal' } },
    }
    render(<CrmBoard />)
    await screen.findByText('Bruno Lima')

    const card = screen.getByText('Bruno Lima').closest('article')!
    const destino = coluna('Proposta')

    // O jsdom não implementa DragEvent; `fireEvent` monta os eventos sintéticos
    // que o React escuta, o que dispatchEvent com Event cru não faz.
    const dados = new Map<string, string>()
    const dataTransfer = {
      effectAllowed: '',
      setData: (k: string, v: string) => dados.set(k, v),
      getData: (k: string) => dados.get(k) ?? '',
    }

    fireEvent.dragStart(card, { dataTransfer })
    fireEvent.dragOver(destino, { dataTransfer })
    fireEvent.drop(destino, { dataTransfer })

    await waitFor(() => {
      expect(within(coluna('Proposta')).getByText('Bruno Lima')).toBeInTheDocument()
    })
  })
})

describe('filtros', () => {
  it('busca é feita pela API, não na tela', async () => {
    rotas['GET /api/leads?q=faciles'] = { status: 200, body: { leads: [ANA] } }
    const user = userEvent.setup()
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')

    await user.type(screen.getByRole('textbox', { name: /buscar lead/i }), 'faciles')

    await waitFor(() => {
      expect(chamadas.some((c) => c.includes('q=faciles'))).toBe(true)
    })
  })

  it('filtro de follow-up atrasado vai como parâmetro', async () => {
    rotas['GET /api/leads?atrasados=1'] = { status: 200, body: { leads: [] } }
    const user = userEvent.setup()
    render(<CrmBoard />)
    await screen.findByText('Ana Souza')

    await user.click(screen.getByRole('button', { name: /follow-up atrasado/i }))

    await waitFor(() => {
      expect(chamadas).toContain('GET /api/leads?atrasados=1')
    })
  })
})

describe('painel do lead', () => {
  it('abre com o histórico e fecha com Esc', async () => {
    rotas['GET /api/leads/l-1/activities'] = {
      status: 200,
      body: {
        activities: [
          { id: 'a-1', type: 'created', description: 'Lead criado via website',
            from_value: null, to_value: null, created_at: '2026-09-01T10:00:00Z', user_name: null },
        ],
      },
    }
    const user = userEvent.setup()
    render(<CrmBoard />)

    await user.click(await screen.findByText('Ana Souza'))

    const painel = await screen.findByRole('dialog', { name: /lead ana souza/i })
    expect(within(painel).getByText('Lead criado')).toBeInTheDocument()
    // Sem autor, a atividade veio do próprio site.
    expect(within(painel).getByText(/pelo site/i)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /lead ana souza/i })).not.toBeInTheDocument()
    })
  })
})
