import fotoShirley from '../assets/foto-shirley.png'
import fotoValdir  from '../assets/foto-valdir.png'

/* ── Ícones como componentes ── */
const IcoLampada = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)
const IcoPincel = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z"/>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
    <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
  </svg>
)
const IcoCodigo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)
const IcoServidor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
)
const IcoRocket = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
)
const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

/* ── Dados dos membros ── */
const membros = [
  {
    foto:         fotoShirley,
    nome:         'Shirley Gomes',
    cargo:        'CO-FOUNDER',
    grad:         'linear-gradient(160deg, #FF2D8D, #5A2EA6)',
    glow:         'rgba(255,45,141,.35)',
    lightSide:    'left',
    lightColor:   '#FF2D8D',
    lightOverlay: 'linear-gradient(100deg, rgba(255,45,141,.45) 0%, rgba(90,46,166,.15) 50%, transparent 100%)',
    skills: ['Direção criativa','Experiência do usuário','Desenvolvimento de soluções digitais','Estratégia de crescimento'],
    Icons:  [IcoLampada, IcoPincel, IcoCodigo],
  },
  {
    foto:         fotoValdir,
    nome:         'Valdir Reis',
    cargo:        'CO-FOUNDER',
    grad:         'linear-gradient(160deg, #2D6BFF, #5A2EA6)',
    glow:         'rgba(45,107,255,.35)',
    lightSide:    'right',
    lightColor:   '#2D6BFF',
    lightOverlay: 'linear-gradient(260deg, rgba(45,107,255,.45) 0%, rgba(90,46,166,.15) 50%, transparent 100%)',
    skills: ['Arquitetura de sistemas','Desenvolvimento full-stack','Automação e integrações','Estratégia e performance'],
    Icons:  [IcoServidor, IcoCodigo, IcoRocket],
  },
]

/* ── Card ── */
function PersonCard({ m, delay }) {
  return (
    <div className={`rev d${delay}`} style={{
      borderRadius: 16,
      padding: 2,
      backgroundImage: m.grad,
      boxShadow: `0 0 40px ${m.glow}`,
      transition: 'box-shadow .3s, transform .3s',
      height: '100%',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 64px ${m.glow}`; e.currentTarget.style.transform = 'translateY(-4px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 40px ${m.glow}`; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ borderRadius: 14, background: 'linear-gradient(180deg,#0f0a1e,#0a0812)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Foto */}
        <div style={{ height: 260, position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg,#1a0b2e,#0a0812)' }}>
          <img src={m.foto} alt={m.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }} />

          {/* Luz colorida lateral — efeito rim light */}
          <div style={{
            position: 'absolute', inset: 0,
            background: m.lightOverlay,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }} />

          {/* Partícula de brilho no canto */}
          <div style={{
            position: 'absolute',
            ...(m.lightSide === 'left' ? { left: '-20px' } : { right: '-20px' }),
            top: '30%',
            width: 120, height: 120,
            borderRadius: '50%',
            background: m.lightColor,
            filter: 'blur(40px)',
            opacity: 0.6,
            pointerEvents: 'none',
          }} />

          {/* Fade inferior */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, background: 'linear-gradient(transparent,#0a0812)', pointerEvents: 'none' }} />
        </div>

        {/* Info */}
        <div style={{ padding: '1rem 1.2rem 1.4rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Badge */}
          <div style={{ display: 'inline-block', backgroundImage: m.grad, borderRadius: 20, padding: '0.2rem 0.75rem', marginBottom: '0.6rem' }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', color: '#fff' }}>{m.cargo}</span>
          </div>
          {/* Nome */}
          <h3 style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>{m.nome}</h3>
          {/* Especialidade */}
          <p style={{ fontFamily: 'var(--font2)', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', backgroundImage: m.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.9rem' }}>
            ESTRATÉGIA • DESIGN • TECNOLOGIA
          </p>
          {/* Skills — flex: 1 empurra ícones para o fundo */}
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', flex: 1 }}>
            {m.skills.map(s => (
              <li key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--neon)', flexShrink: 0 }}><IcoCheck /></span>
                <span style={{ fontFamily: 'var(--font2)', fontSize: '0.8rem', color: '#fff' }}>{s}</span>
              </li>
            ))}
          </ul>
          {/* Ícones */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            {m.Icons.map((Ic, i) => (
              <span key={i} style={{ color: 'rgba(255,255,255,.45)', transition: 'color .2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.45)'}>
                <Ic />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Seção ── */
export default function Team() {
  return (
    <section id="quem-somos" style={{ padding: '4rem 5%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,18,.70)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '4rem', alignItems: 'center' }} className="team-grid">

        {/* Col esquerda */}
        <div className="revl">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)' }} />
            <span style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.3em', color: 'var(--w)', textTransform: 'uppercase' }}>Quem Somos</span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)' }} />
          </div>

          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.2rem' }}>
            Por trás da Pulsari,{' '}
            <span style={{ backgroundImage: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>duas mentes</span>
            {' '}que constroem{' '}
            <span style={{ color: 'var(--blue)' }}>juntas.</span>
          </h2>

          <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.1em', marginBottom: '1.2rem', lineHeight: 1.8 }}>
            <span style={{ color: 'var(--neon)' }}>ESTRATÉGIA.</span>{' '}
            <span style={{ color: 'var(--p3)' }}>DESIGN.</span>{' '}
            <span style={{ color: 'var(--blue)' }}>TECNOLOGIA.</span>
            <br />
            <span style={{ color: 'var(--w)' }}>SEM DIVISÃO. SEM LIMITES.</span>
          </p>

          <div style={{ width: 48, height: 2, backgroundImage: 'var(--grad)', borderRadius: 1, marginBottom: '1.5rem' }} />

          <p style={{ fontFamily: 'var(--font2)', fontSize: '0.95rem', color: '#fff', lineHeight: 1.8, marginBottom: '1rem' }}>
            Na Pulsari, não existem barreiras entre áreas.
          </p>
          <p style={{ fontFamily: 'var(--font2)', fontSize: '0.95rem', color: '#fff', lineHeight: 1.8, marginBottom: '1rem' }}>
            Somos uma dupla que une visão estratégica, criatividade e desenvolvimento para entregar{' '}
            <strong>soluções completas</strong> — do conceito à execução.
          </p>
          <p style={{ fontFamily: 'var(--font2)', fontSize: '0.95rem', color: '#fff', lineHeight: 1.8 }}>
            Cada projeto passa por mãos que entendem tanto de estética quanto de performance.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="team-cards">
          {membros.map((m, i) => <PersonCard key={m.nome} m={m} delay={i + 1} />)}
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .team-grid  { grid-template-columns: 1fr !important; gap: 2.5rem !important; } }
        @media (max-width: 600px)  { .team-cards { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
