const cards = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Performance Obsessiva',
    desc: 'Cada milissegundo conta. Sites lentos custam conversões — os nossos entram no verde do PageSpeed e ficam lá.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Foco em Resultado',
    desc: 'Não fazemos sites bonitos por vaidade. Cada decisão de design é orientada a uma meta de negócio mensurável.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Confiabilidade Total',
    desc: 'Prazos cumpridos, código limpo, suporte pós-entrega. Sem sumiços, sem surpresas. Só entrega.',
  },
]

export default function About() {
  return (
    <section id="sobre" style={{ padding: '4rem 5%', position: 'relative' }}>
      {/* overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3,2,12,.70)', zIndex: 1, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '6rem', maxWidth: 1200, margin: '0 auto',
      }} className="about-grid">

        {/* Coluna esquerda */}
        <div className="revl">
          <p style={{
            fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 600,
            letterSpacing: '0.3em', color: 'var(--p3)', textTransform: 'uppercase',
            marginBottom: '1.2rem',
          }}>// Sobre nós</p>

          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800,
            lineHeight: 1.1, marginBottom: '1.8rem',
          }}>
            Construímos digital<br />
            <em style={{
              fontStyle: 'italic',
              background: 'linear-gradient(90deg, var(--p), var(--neon))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>com propósito</em>
          </h2>

          <p style={{
            fontFamily: 'var(--font2)', fontSize: '1rem', lineHeight: 1.85,
            color: 'var(--w)', marginBottom: '1.2rem',
          }}>
            Somos uma agência digital especializada em transformar estratégia em produto. Cada projeto começa com uma pergunta simples: <strong style={{ color: 'var(--p3)' }}>qual resultado concreto esse site precisa gerar?</strong> A resposta guia cada linha de código e cada escolha visual.
          </p>

          <p style={{
            fontFamily: 'var(--font2)', fontSize: '1rem', lineHeight: 1.85,
            color: 'var(--w)',
          }}>
            Do briefing ao deploy, trabalhamos com autonomia e transparência — entregando soluções que performam no mundo real, não só no Figma. Se o seu negócio precisa crescer online, estamos prontos para ser o parceiro técnico que faltava.
          </p>
        </div>

        {/* Coluna direita */}
        <div className="revr" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Cards */}
          {cards.map((c, i) => (
            <div key={c.title} className={`d${i + 1}`} style={{
              padding: '1.25rem 1.5rem',
              border: '1px solid var(--border)',
              borderRadius: 4,
              background: 'rgba(124,58,237,.03)',
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              position: 'relative', overflow: 'hidden',
              transition: 'background .3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,.08)'
              const bar = e.currentTarget.querySelector('.card-bar')
              if (bar) bar.style.transform = 'scaleY(1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(124,58,237,.03)'
              const bar = e.currentTarget.querySelector('.card-bar')
              if (bar) bar.style.transform = 'scaleY(0)'
            }}
            >
              <div className="card-bar" style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
                background: 'linear-gradient(180deg, var(--p), var(--neon))',
                transform: 'scaleY(0)', transformOrigin: 'top',
                transition: 'transform .35s cubic-bezier(0.22,1,0.36,1)',
              }} />
              <div style={{ flexShrink: 0, marginTop: 2 }}>{c.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--w)' }}>
                  {c.title}
                </div>
                <div style={{ fontFamily: 'var(--font2)', fontSize: '0.9rem', color: 'var(--w)', lineHeight: 1.6 }}>
                  {c.desc}
                </div>
              </div>
            </div>
          ))}

          {/* Terminal fake */}
          <div style={{
            background: '#010009', border: '1px solid var(--border)',
            borderRadius: 4, overflow: 'hidden', marginTop: '0.5rem',
          }}>
            <div style={{
              padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              {['#ef4444','#eab308','#22c55e'].map(c => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
              ))}
              <span style={{
                fontFamily: 'var(--font2)', fontSize: '0.72rem',
                color: 'var(--g)', letterSpacing: '0.1em', marginLeft: '0.5rem',
              }}>pulsari.config.js</span>
            </div>
            <div style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 2 }}>
              <div>
                <span style={{ color: 'var(--p3)' }}>const</span>
                <span style={{ color: 'var(--w)' }}> pulsari </span>
                <span style={{ color: 'var(--g)' }}>= {'{'}</span>
              </div>
              <div style={{ paddingLeft: '1.5rem' }}>
                <span style={{ color: 'var(--neon)' }}>mission</span>
                <span style={{ color: 'var(--g)' }}>: </span>
                <span style={{ color: '#86efac' }}>'crescimento digital'</span>
                <span style={{ color: 'var(--g)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '1.5rem' }}>
                <span style={{ color: 'var(--neon)' }}>stack</span>
                <span style={{ color: 'var(--g)' }}>: </span>
                <span style={{ color: '#86efac' }}>'React · Node · Three.js'</span>
                <span style={{ color: 'var(--g)' }}>,</span>
              </div>
              <div style={{ paddingLeft: '1.5rem' }}>
                <span style={{ color: 'var(--neon)' }}>delivery</span>
                <span style={{ color: 'var(--g)' }}>: </span>
                <span style={{ color: '#86efac' }}>'no prazo, sempre'</span>
              </div>
              <div>
                <span style={{ color: 'var(--g)' }}>{'}'}</span>
                <span style={{
                  display: 'inline-block', width: 8, height: 14,
                  background: 'var(--p3)', marginLeft: 2, verticalAlign: 'middle',
                  animation: 'gradientShift 1s step-start infinite',
                  opacity: 0.9,
                }}>▋</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .about-grid { grid-template-columns: 1fr !important; gap: 3rem !important; } }
      `}</style>
    </section>
  )
}
