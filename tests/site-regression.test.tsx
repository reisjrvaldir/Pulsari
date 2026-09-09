// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'

/**
 * Regressão da Sprint 01: introduzir react-router e a rota /admin não pode
 * alterar nada do site institucional. Estes testes falham se o site parar de
 * renderizar ou se /admin vazar para dentro da home.
 */
function renderEm(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
}

describe('site institucional continua intacto', () => {
  it('a home renderiza a chamada principal', () => {
    renderEm('/')
    expect(screen.getByText(/pulsarem no digital/i)).toBeInTheDocument()
  })

  it('as oito seções seguem presentes na home', () => {
    const { container } = renderEm('/')
    const ids = [...container.querySelectorAll('section[id]')].map((s) => s.id)

    for (const esperado of [
      'inicio', 'manifesto', 'servicos', 'stack',
      'portfolio', 'processo', 'sobre', 'contato',
    ]) {
      expect(ids, `seção #${esperado} sumiu da home`).toContain(esperado)
    }
  })

  it('os seis cases do portfólio continuam listados', () => {
    renderEm('/')
    for (const cliente of [
      'Cardassi & Saad',
      'Hospital Veterinário Dr. Drummond',
      'Atenxo',
      'ONG Star',
      'Alpha LED',
      'Gestescolar',
    ]) {
      expect(screen.getAllByText(cliente).length, `case ${cliente} sumiu`).toBeGreaterThan(0)
    }
  })

  it('o WhatsApp segue apontando para o número real', () => {
    const { container } = renderEm('/')
    const links = [...container.querySelectorAll('a[href*="wa.me"]')]
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      expect(a.getAttribute('href')).toContain('558189654487')
    }
  })

  it('a home não renderiza nada do Operations', () => {
    renderEm('/')
    expect(screen.queryByText(/Pulsari Operations/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument()
  })

  it('uma URL desconhecida cai no site institucional, não em erro', () => {
    renderEm('/pagina-que-nao-existe')
    expect(screen.getByText(/pulsarem no digital/i)).toBeInTheDocument()
  })
})
