import { useEffect, useState } from 'react'
import logoPulsari from '../assets/logo-pulsari.png.PNG'

const links = [
  { label: 'Início',     href: '#hero' },
  { label: 'Sobre',      href: '#sobre' },
  { label: 'Portfólio',  href: '#portfolio' },
  { label: 'Quem Somos', href: '#quem-somos' },
  { label: 'Contato',    href: '#contato' },
]

const linkStyle = {
  background: 'none', border: 'none', color: '#fff',
  fontFamily: 'var(--font2)', fontSize: '0.82rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'none',
  transition: 'color .3s', padding: 0, whiteSpace: 'nowrap',
}

export default function Navbar() {
  const [solid, setSolid] = useState(false)
  const [open,  setOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = href => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 5%',    /* mesmo padrão das seções */
      background: solid ? 'rgba(10,8,18,.90)' : 'transparent',
      backdropFilter: solid ? 'blur(20px)' : 'none',
      borderBottom: solid ? '1px solid var(--border)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', height: 72,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center', gap: '1.5rem',
      }}>

        {/* Logo — coluna 1 */}
        <div onClick={() => scrollTo('#hero')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img src={logoPulsari} alt="Agência Pulsari"
            style={{ height: 80, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Links centralizados — coluna 2 */}
        <div className="nav-links" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 'clamp(1rem, 3vw, 2.5rem)',
        }}>
          {links.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.href)} style={linkStyle}
              onMouseEnter={e => e.target.style.color = 'var(--p3)'}
              onMouseLeave={e => e.target.style.color = '#fff'}
            >{l.label}</button>
          ))}
        </div>

        {/* CTA — coluna 3 */}
        <div className="nav-cta">
          <button className="btn btn-primary" onClick={() => scrollTo('#contato')}>
            Fale Conosco
          </button>
        </div>

        {/* Hambúrguer */}
        <button className="hamburger" onClick={() => setOpen(!open)} style={{
          display: 'none', background: 'none', border: 'none',
          flexDirection: 'column', gap: 5, cursor: 'none', padding: 4,
          gridColumn: '3',
        }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block', width: 24, height: 2,
              background: 'var(--w)', borderRadius: 1, transition: 'all .3s',
              transform: open
                ? i === 0 ? 'rotate(45deg) translate(5px, 5px)'
                : i === 1 ? 'scaleX(0)'
                : 'rotate(-45deg) translate(5px, -5px)'
                : 'none',
            }} />
          ))}
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,18,.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '2.5rem', zIndex: 99,
        }}>
          <img src={logoPulsari} alt="Pulsari" style={{ height: 48, marginBottom: '1rem' }} />
          {links.map(l => (
            <button key={l.label} onClick={() => scrollTo(l.href)} style={{
              background: 'none', border: 'none', color: 'var(--w)',
              fontFamily: 'var(--font)', fontSize: '1.8rem', fontWeight: 800,
              letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'none',
            }}>{l.label}</button>
          ))}
          <button className="btn btn-primary" onClick={() => scrollTo('#contato')}>Fale Conosco</button>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .nav-links { display: none !important; }
          .nav-cta   { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}
