// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminApp } from '../src/admin/AdminApp'

/**
 * Fluxo de login pela interface. O fetch é dublado para responder como a API
 * real responde — inclusive nos casos de recusa.
 */
const USER = {
  id: 'u-1', name: 'Ana Souza', email: 'ana@pulsari.com.br',
  role: 'manager', status: 'active', lastLoginAt: null,
}

let respostas: Record<string, { status: number; body: unknown }>

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const chave = `${init?.method ?? 'GET'} ${url}`
    const r = respostas[chave] ?? { status: 401, body: { error: 'Não autenticado' } }
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      json: async () => r.body,
    } as Response
  })
}

function renderAdmin(rota = '/admin/login') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  respostas = {
    'GET /api/auth/session': { status: 401, body: { error: 'Não autenticado' } },
  }
  vi.stubGlobal('fetch', mockFetch())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('tela de login do Operations', () => {
  it('mostra o formulário quando não há sessão', async () => {
    renderAdmin()
    expect(await screen.findByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('entra e mostra o painel com nome e papel do usuário', async () => {
    respostas['POST /api/auth/login'] = { status: 200, body: { user: USER } }
    const user = userEvent.setup()
    renderAdmin()

    await user.type(await screen.findByLabelText(/e-mail/i), 'ana@pulsari.com.br')
    await user.type(screen.getByLabelText(/senha/i), 'SenhaCorreta#2026')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Ana Souza')).toBeInTheDocument()
    expect(screen.getByText('manager')).toBeInTheDocument()
  })

  it('mostra a mensagem de erro devolvida pela API e limpa a senha', async () => {
    respostas['POST /api/auth/login'] = {
      status: 401, body: { error: 'E-mail ou senha incorretos.' },
    }
    const user = userEvent.setup()
    renderAdmin()

    await user.type(await screen.findByLabelText(/e-mail/i), 'ana@pulsari.com.br')
    const campoSenha = screen.getByLabelText(/senha/i)
    await user.type(campoSenha, 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorretos/i)
    expect(campoSenha).toHaveValue('')
  })

  it('traduz o bloqueio por força bruta em tempo de espera', async () => {
    respostas['POST /api/auth/login'] = {
      status: 429,
      body: { error: 'Muitas tentativas. Tente novamente em instantes.', retryAfter: 120 },
    }
    const user = userEvent.setup()
    renderAdmin()

    await user.type(await screen.findByLabelText(/e-mail/i), 'ana@pulsari.com.br')
    await user.type(screen.getByLabelText(/senha/i), 'errada')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/2 min/i)
  })

  it('conta desativada recebe a mensagem correta', async () => {
    respostas['POST /api/auth/login'] = {
      status: 403, body: { error: 'Esta conta está desativada. Fale com um administrador.' },
    }
    const user = userEvent.setup()
    renderAdmin()

    await user.type(await screen.findByLabelText(/e-mail/i), 'ana@pulsari.com.br')
    await user.type(screen.getByLabelText(/senha/i), 'SenhaCorreta#2026')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/desativada/i)
  })

  it('acessar /admin sem sessão leva para o login', async () => {
    renderAdmin('/admin')
    expect(await screen.findByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('com sessão válida, /admin abre o painel direto', async () => {
    respostas['GET /api/auth/session'] = { status: 200, body: { user: USER } }
    renderAdmin('/admin')
    expect(await screen.findByText('Pulsari Operations')).toBeInTheDocument()
  })

  it('nenhum token é guardado no navegador', async () => {
    respostas['POST /api/auth/login'] = { status: 200, body: { user: USER } }
    const user = userEvent.setup()
    renderAdmin()

    await user.type(await screen.findByLabelText(/e-mail/i), 'ana@pulsari.com.br')
    await user.type(screen.getByLabelText(/senha/i), 'SenhaCorreta#2026')
    await user.click(screen.getByRole('button', { name: /entrar/i }))
    await screen.findByText('Ana Souza')

    expect(window.sessionStorage.length).toBe(0)
    expect(window.localStorage.length).toBe(0)
  })

  it('sair chama a API de logout e volta para o login', async () => {
    respostas['GET /api/auth/session'] = { status: 200, body: { user: USER } }
    respostas['POST /api/auth/logout'] = { status: 200, body: { ok: true } }
    const user = userEvent.setup()
    renderAdmin('/admin')

    await user.click(await screen.findByRole('button', { name: /sair/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    })
  })

  it('módulos sem permissão aparecem marcados para o papel', async () => {
    respostas['GET /api/auth/session'] = {
      status: 200, body: { user: { ...USER, role: 'commercial' } },
    }
    renderAdmin('/admin')

    await screen.findByText('Pulsari Operations')
    // commercial não tem financeiro nem usuários.
    expect(screen.getAllByText('Sem permissão').length).toBeGreaterThan(0)
  })
})
