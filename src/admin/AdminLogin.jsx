import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from './auth'

export default function AdminLogin() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [erro,  setErro]  = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    await new Promise(r => setTimeout(r, 600)) // simula latência
    if (login(email, pass)) {
      nav('/admin')
    } else {
      setErro('E-mail ou senha incorretos.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0A0812',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', sans-serif", padding: '1rem',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(30,11,46,.6)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(90,46,166,.35)', borderRadius: 12,
        padding: '2.5rem 2rem',
        boxShadow: '0 0 60px rgba(90,46,166,.2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
            fontSize: '1.8rem', letterSpacing: '0.12em',
            background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6,#2D6BFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: '0.3rem',
          }}>PULSARI</div>
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Painel Administrativo
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelSt}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" required style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Senha</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" required style={inputSt} />
          </div>

          {erro && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, padding: '0.6rem 0.9rem', color: '#f87171', fontSize: '0.82rem' }}>
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: '0.5rem',
            background: loading ? 'rgba(90,46,166,.5)' : 'linear-gradient(135deg,#FF2D8D,#5A2EA6)',
            border: 'none', borderRadius: 6, padding: '0.85rem',
            color: '#fff', fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.08em',
            cursor: loading ? 'default' : 'pointer',
            transition: 'all .3s',
          }}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,.3)', fontSize: '0.72rem' }}>
          Acesso restrito à equipe Pulsari
        </p>
      </div>
    </div>
  )
}

const labelSt = { display: 'block', fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: '0.4rem' }
const inputSt  = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 6, padding: '0.7rem 0.9rem', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: '0.92rem', outline: 'none' }
