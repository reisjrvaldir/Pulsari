import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('Admin error:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  clearStorage = () => {
    if (window.confirm('Isso vai limpar os dados do portfólio salvos no navegador. Continuar?')) {
      localStorage.removeItem('pulsari_portfolio')
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0A0812', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Montserrat',sans-serif", padding: '2rem',
        }}>
          <div style={{
            maxWidth: 520, width: '100%',
            background: 'rgba(30,11,46,.9)', border: '1px solid rgba(239,68,68,.4)',
            borderRadius: 12, padding: '2rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              Algo deu errado no painel
            </h2>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: '0.88rem', marginBottom: '1.5rem', fontFamily: "'Poppins',sans-serif" }}>
              Erro: {this.state.error?.message || 'desconhecido'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={this.reset} style={{
                background: 'linear-gradient(135deg,#5A2EA6,#2D6BFF)', border: 'none',
                borderRadius: 6, padding: '0.7rem 1.4rem', color: '#fff',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}>Tentar novamente</button>
              <button onClick={this.clearStorage} style={{
                background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.4)',
                borderRadius: 6, padding: '0.7rem 1.4rem', color: '#f87171',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}>Limpar dados do portfólio</button>
              <a href="/admin/login" style={{
                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.15)',
                borderRadius: 6, padding: '0.7rem 1.4rem', color: 'rgba(255,255,255,.6)',
                fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
              }}>Voltar ao login</a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
