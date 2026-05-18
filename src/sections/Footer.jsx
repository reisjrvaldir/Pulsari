import { useState } from 'react'
import logoPulsari from '../assets/logo-pulsari.png.PNG'

const navLinks = ['Início', 'Sobre', 'Portfólio', 'Contato']
const services = ['Sites Institucionais', 'E-commerce', 'Sistemas Web', 'Landing Pages', 'UI/UX Design']
const socials = [
  { label: 'Instagram', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
  { label: 'LinkedIn',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg> },
  { label: 'GitHub',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg> },
  { label: 'Behance',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12h6a3 3 0 0 0 0-6H1v12h7a3.5 3.5 0 0 0 0-7H1"/><path d="M14 9h8m-4-4a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg> },
]

const scrollTo = href => {
  const el = document.querySelector(href)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Footer() {
  const [modal, setModal] = useState(false)

  return (
    <footer style={{
      background: 'linear-gradient(180deg, rgba(30,11,46,.97) 0%, rgba(10,8,18,.99) 100%)',
      borderTop: '2px solid var(--p)',
      padding: '4rem 5% 0',   /* mesmo padrão das seções */
    }}>
      {/* ── Container único alinhado com as seções ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Grid principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', marginBottom: '3rem' }} className="footer-grid">

          {/* Coluna 1 */}
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <img src={logoPulsari} alt="Agência Pulsari" style={{ height: 140, width: 'auto', objectFit: 'contain', maxWidth: 260, marginLeft: -24 }} />
            </div>

            <p style={{ fontFamily: 'var(--font2)', fontSize: '0.9rem', color: 'var(--w)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 260 }}>
              Transformamos ideias em produtos digitais que geram receita de verdade.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
              {socials.map(s => (
                <button key={s.label} className="btn" style={{ padding: '0.5rem 0.75rem' }} title={s.label}>{s.icon}</button>
              ))}
            </div>

            <button className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', letterSpacing: '0.15em' }}
              onClick={() => setModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              SOU PULSARI
            </button>
          </div>

          {/* Coluna 2 — 3 sub-colunas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }} className="footer-sub">
            <div>
              <h4 style={colHead}>Navegação</h4>
              {navLinks.map(l => (
                <button key={l}
                  onClick={() => scrollTo('#' + l.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace('portfolio','portfolio').replace('inicio','hero'))}
                  style={footLink}
                  onMouseEnter={e => e.target.style.color = 'var(--p3)'}
                  onMouseLeave={e => e.target.style.color = 'var(--w)'}
                >{l}</button>
              ))}
            </div>
            <div>
              <h4 style={colHead}>Serviços</h4>
              {services.map(s => <div key={s} style={{ ...footLink, cursor: 'default' }}>{s}</div>)}
            </div>
            <div>
              <h4 style={colHead}>Contato</h4>
              {['oi@pulsari.com.br', '+55 (81) 99999-0000', 'Recife, PE — Brasil'].map(v => (
                <div key={v} style={footLink}>{v}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: '1.5rem', paddingBottom: '2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <span style={{ fontFamily: 'var(--font2)', fontSize: '0.78rem', color: 'var(--w)' }}>
            © 2025 Pulsari. Todos os direitos reservados.
          </span>
          <span style={{ fontFamily: 'var(--font2)', fontSize: '0.78rem', color: 'var(--w)' }}>
            Feito com 💜 em Recife
          </span>
        </div>

      </div>

      <style>{`
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px)  { .footer-sub  { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 500px)  { .footer-sub  { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── Modal SOU PULSARI ── */}
      {modal && (
        <div onClick={() => setModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 9800,
          background: 'rgba(10,8,18,.88)', backdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn .25s ease',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(145deg, #1a0b2e, #0d0820)',
            border: '1px solid rgba(90,46,166,.45)',
            borderRadius: 16, padding: '2.2rem 2rem',
            width: '100%', maxWidth: 400,
            boxShadow: '0 0 80px rgba(90,46,166,.25)',
            position: 'relative',
          }}>
            {/* Barra gradiente topo */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #FF2D8D, #5A2EA6, #2D6BFF)', borderRadius: '16px 16px 0 0' }} />

            {/* Fechar */}
            <button onClick={() => setModal(false)} style={{
              position: 'absolute', top: 14, right: 16,
              background: 'none', border: 'none', color: 'rgba(255,255,255,.35)',
              fontSize: '1.4rem', cursor: 'none', lineHeight: 1, transition: 'color .2s',
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,.35)'}
            >×</button>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
              <div style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '0.12em', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.3rem' }}>
                PULSARI
              </div>
              <p style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase' }}>
                Acesso interno
              </p>
            </div>

            {/* Opção 1 — Admin portfólio */}
            <a href="/admin/login" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(90,46,166,.12)', border: '1px solid rgba(90,46,166,.35)',
                borderRadius: 10, padding: '1.1rem 1.3rem', marginBottom: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                cursor: 'none', transition: 'all .25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(90,46,166,.25)'; e.currentTarget.style.borderColor = '#5A2EA6' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(90,46,166,.12)'; e.currentTarget.style.borderColor = 'rgba(90,46,166,.35)' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(90,46,166,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.15rem' }}>Painel do Portfólio</div>
                  <div style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', color: 'rgba(255,255,255,.45)' }}>Adicionar, editar e remover projetos</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#a855f7', fontSize: '1rem' }}>→</div>
              </div>
            </a>

            {/* Opção 2 — Intranet (três pontos) */}
            <a href="https://pulsari-hub.vercel.app/login" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setModal(false) }}>
              <div style={{
                background: 'rgba(255,45,141,.08)', border: '1px solid rgba(255,45,141,.25)',
                borderRadius: 10, padding: '1.1rem 1.3rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
                cursor: 'none', transition: 'all .25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,45,141,.18)'; e.currentTarget.style.borderColor = '#FF2D8D' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,45,141,.08)'; e.currentTarget.style.borderColor = 'rgba(255,45,141,.25)' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,45,141,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF2D8D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '0.15rem' }}>
                    <span style={{ letterSpacing: '0.3em', color: '#FF2D8D' }}>···</span>  Intranet Pulsari
                  </div>
                  <div style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', color: 'rgba(255,255,255,.45)' }}>pulsari-hub.vercel.app</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#FF2D8D', fontSize: '1rem' }}>↗</div>
              </div>
            </a>

            <p style={{ textAlign: 'center', marginTop: '1.4rem', fontFamily: 'var(--font2)', fontSize: '0.68rem', color: 'rgba(255,255,255,.2)', letterSpacing: '0.08em' }}>
              Acesso restrito — equipe Pulsari
            </p>
          </div>
        </div>
      )}
    </footer>
  )
}

const colHead = { fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--p3)', marginBottom: '1rem' }
const footLink = { display: 'block', fontFamily: 'var(--font2)', fontSize: '0.88rem', color: 'var(--w)', marginBottom: '0.5rem', background: 'none', border: 'none', textAlign: 'left', cursor: 'none', transition: 'color .3s', padding: 0 }
