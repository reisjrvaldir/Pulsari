import { useEffect, useState } from 'react'

const links = [
  { label: 'Início',     href: '#hero' },
  { label: 'Sobre',      href: '#sobre' },
  { label: 'Portfólio',  href: '#portfolio' },
  { label: 'Quem Somos', href: '#quem-somos' },
  { label: 'Contato',    href: '#contato' },
]

export default function Navbar() {
  const [solid, setSolid] = useState(false)
  const [open,  setOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Bloqueia scroll do body quando menu mobile está aberto */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const scrollTo = href => {
    setOpen(false)
    setTimeout(() => {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 300)
  }

  return (
    <>
      {/* ── Barra de navegação ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        padding: '0 5%',
        background: solid ? 'rgba(10,8,18,.92)' : 'transparent',
        backdropFilter: solid ? 'blur(20px)' : 'none',
        borderBottom: solid ? '1px solid var(--border)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          height: 'clamp(60px, 8vh, 80px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>

          {/* Logo */}
          <div onClick={() => scrollTo('#hero')} style={{ cursor: 'pointer' }}>
            <span style={{
              fontFamily: 'var(--font)', fontWeight: 900,
              fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
              letterSpacing: '0.18em', color: '#fff',
            }}>PULSARI</span>
          </div>

          {/* Links desktop — centralizados */}
          <div className="nav-links" style={{
            display: 'flex', alignItems: 'center',
            gap: 'clamp(1rem, 2.5vw, 2.5rem)',
          }}>
            {links.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} style={{
                background: 'none', border: 'none', color: '#fff',
                fontFamily: 'var(--font2)', fontSize: '0.82rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'none',
                transition: 'color .3s', padding: 0, whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => e.target.style.color = 'var(--p3)'}
                onMouseLeave={e => e.target.style.color = '#fff'}
              >{l.label}</button>
            ))}
          </div>

          {/* CTA desktop */}
          <div className="nav-cta">
            <button className="btn btn-primary" onClick={() => scrollTo('#contato')}>
              Fale Conosco
            </button>
          </div>

          {/* Hambúrguer */}
          <button
            className="hamburger"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            style={{
              display: 'none', background: 'none', border: 'none',
              flexDirection: 'column', justifyContent: 'center',
              gap: 5, cursor: 'pointer', padding: '4px', zIndex: 201,
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: 26, height: 2,
                background: '#fff', borderRadius: 1, transition: 'all .3s',
                transform: open
                  ? i === 0 ? 'rotate(45deg) translate(5px, 5px)'
                  : i === 1 ? 'scaleX(0)'
                  : 'rotate(-45deg) translate(5px, -5px)'
                  : 'none',
              }} />
            ))}
          </button>
        </div>
      </nav>

      {/* ── Menu mobile — overlay separado com z-index maior ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 199,
        background: 'rgba(8,4,20,.98)',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity .3s ease',
      }}>

        {/* Linha gradiente no topo */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #FF2D8D, #5A2EA6, #2D6BFF)',
        }} />

        {/* Logo no topo */}
        <span style={{
          fontFamily: 'var(--font)', fontWeight: 900,
          fontSize: '1.6rem', letterSpacing: '0.22em', color: '#fff',
          marginBottom: '3rem', opacity: 0.9,
        }}>PULSARI</span>

        {/* Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          {links.map((l, i) => (
            <button key={l.label} onClick={() => scrollTo(l.href)} style={{
              background: 'none', border: 'none',
              color: '#fff', width: '100%',
              fontFamily: 'var(--font)', fontSize: 'clamp(1.4rem, 6vw, 2rem)',
              fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', padding: '0.9rem 2rem', textAlign: 'center',
              borderBottom: i < links.length - 1 ? '1px solid rgba(90,46,166,.15)' : 'none',
              transition: 'color .2s, background .2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--p3)'; e.currentTarget.style.background = 'rgba(90,46,166,.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'none' }}
            >{l.label}</button>
          ))}
        </nav>

        {/* CTA */}
        <button
          className="btn btn-primary"
          onClick={() => scrollTo('#contato')}
          style={{ marginTop: '2.5rem', padding: '0.9rem 2.5rem', fontSize: '0.9rem' }}
        >
          Fale Conosco →
        </button>

        {/* Rodapé do menu */}
        <p style={{
          position: 'absolute', bottom: '2rem',
          fontFamily: 'var(--font2)', fontSize: '0.7rem',
          color: 'rgba(255,255,255,.2)', letterSpacing: '0.15em',
        }}>
          pulsari.com.br
        </p>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          .nav-cta   { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
