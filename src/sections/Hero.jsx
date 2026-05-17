import { useEffect, useRef } from 'react'

export default function Hero() {
  const colRef = useRef(null)

  useEffect(() => {
    const items = colRef.current?.querySelectorAll('[data-anim]')
    items?.forEach((el, i) => {
      el.style.opacity    = 0
      el.style.transform  = 'translateY(30px)'
      el.style.transition = `opacity .7s ease ${i * 0.18}s, transform .7s ease ${i * 0.18}s`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity   = 1
          el.style.transform = 'translateY(0)'
        })
      })
    })
  }, [])

  const scrollTo = href => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="hero" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 5%',
      position: 'relative',
    }}>
      {/* Conteúdo centralizado */}
      <div ref={colRef} style={{
        textAlign: 'center',
        maxWidth: 900,
        width: '100%',
        paddingTop: '5rem',
      }}>

        {/* Eyebrow */}
        <div data-anim style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.8rem' }}>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--p3))' }} />
          <span style={{
            fontFamily: 'var(--font2)', fontSize: '0.7rem', fontWeight: 600,
            letterSpacing: '0.3em', color: 'var(--p3)', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            // CÓDIGO QUE GERA RECEITA DE VERDADE
          </span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--p3), transparent)' }} />
        </div>

        {/* H1 */}
        <h1 data-anim style={{
          fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: 1.0,
          marginBottom: '1.6rem',
        }}>
          <span style={{ display: 'block', color: 'var(--w)' }}>CÓDIGO</span>
          <span style={{ display: 'block', color: 'var(--w)' }}>DESIGN</span>
          <span style={{ display: 'block', color: 'var(--w)' }}>RESULTADO</span>
        </h1>

        {/* Subtítulo */}
        <p data-anim style={{
          fontFamily: 'var(--font2)', fontSize: '1.1rem', lineHeight: 1.75,
          color: 'var(--w)', maxWidth: 560, margin: '0 auto 2.4rem',
        }}>
          Seu concorrente já tem um site que converte. O seu precisa ir além —
          precisão técnica, identidade que prende e performance que vende.
          É isso que a Pulsari entrega.
        </p>

        {/* Botões */}
        <div data-anim style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => scrollTo('#portfolio')}>
            Ver Portfólio →
          </button>
          <button className="btn" onClick={() => scrollTo('#contato')}>
            Fale Conosco
          </button>
        </div>

        {/* Scroll indicator */}
        <div data-anim style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '0.5rem', marginTop: '4rem',
        }}>
          <div style={{
            width: 1, height: 48,
            background: 'linear-gradient(180deg, var(--p3), transparent)',
            animation: 'scrollLine 2s ease infinite',
          }} />
          <span style={{
            fontFamily: 'var(--font2)', fontSize: '0.65rem',
            letterSpacing: '0.25em', color: 'var(--w)', textTransform: 'uppercase',
          }}>Scroll para explorar</span>
        </div>
      </div>
    </section>
  )
}
