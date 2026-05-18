const stats = [
  { num: '+10',    label: 'Projetos entregues' },
  { num: '+2 anos', label: 'De expertise digital' },
  { num: '100%',   label: 'Clientes satisfeitos' },
]

export default function Stats() {
  return (
    <section style={{
      padding: '4rem 5%', position: 'relative',
      borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
    }}>
      {/* overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3,2,12,.70)', zIndex: 1, pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', justifyContent: 'center',
        gap: 'clamp(2rem, 5vw, 5rem)', flexWrap: 'wrap',
      }}>
        {stats.map((s, i) => (
          <div key={s.num} className={`rev d${i + 1}`} style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 'clamp(2rem, 6vw, 2.8rem)', fontWeight: 800, lineHeight: 1,
              background: 'linear-gradient(135deg, var(--w), var(--p3))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              marginBottom: '0.5rem',
            }}>{s.num}</div>
            <div style={{
              fontFamily: 'var(--font2)', fontSize: '0.72rem',
              letterSpacing: '0.18em', color: 'var(--w)', textTransform: 'uppercase',
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
