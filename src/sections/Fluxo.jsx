import { useEffect, useRef, useState } from 'react'

/* ── Ícones como componentes (evita vazamento de atributos SVG como texto) ── */
const I = {
  Contato:      () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Diagnostico:  () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Proposta:     () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Planejamento: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  Execucao:     () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  Entrega:      () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  PosEntrega:   () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Suporte:      () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
}

const etapas = [
  { num: '01', nome: 'Contato',      cor: '#FF2D8D', Ico: I.Contato,      desc: 'Você nos chama e conta sobre o seu projeto ou desafio.' },
  { num: '02', nome: 'Diagnóstico',  cor: '#c026d3', Ico: I.Diagnostico,  desc: 'Analisamos o negócio e identificamos a melhor solução.' },
  { num: '03', nome: 'Proposta',     cor: '#5A2EA6', Ico: I.Proposta,     desc: 'Enviamos proposta personalizada com escopo, prazo e investimento.' },
  { num: '04', nome: 'Planejamento', cor: '#2D6BFF', Ico: I.Planejamento, desc: 'Definimos etapas, prazos e briefing detalhado do projeto.' },
  { num: '05', nome: 'Execução',     cor: '#0ea5e9', Ico: I.Execucao,     desc: 'Desenvolvemos com acompanhamento constante e transparência.' },
  { num: '06', nome: 'Entrega',      cor: '#10b981', Ico: I.Entrega,      desc: 'Revisão, testes e entrega final do projeto aprovado.' },
  { num: '07', nome: 'Pós-entrega',  cor: '#f59e0b', Ico: I.PosEntrega,   desc: 'Suporte inicial, ajustes finos e acompanhamento de resultados.' },
  { num: '08', nome: 'Suporte',      cor: '#FF2D8D', Ico: I.Suporte,      desc: 'Parceria contínua para evoluir e manter sua solução no ar.' },
]

/* ── Array duplicado para loop infinito ── */
const ITEMS   = [...etapas, ...etapas]   /* 16 itens: original + cópia */
const N       = etapas.length            /* 8 */
const VISIBLE = 5
const CARD_W  = 160
const GAP     = 12

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`
}

function ArrowBtn({ onClick, dir }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        border: '1px solid var(--p)',
        background: hov ? 'var(--p)' : 'rgba(90,46,166,.15)',
        color: hov ? '#fff' : 'var(--p3)',
        cursor: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .3s',
      }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>
          : <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>}
      </svg>
    </button>
  )
}

export default function Fluxo() {
  const [offset,   setOffset]   = useState(0)
  const [animated, setAnimated] = useState(true)
  const [paused,   setPaused]   = useState(false)
  const timerRef   = useRef(null)
  const resumeRef  = useRef(null)

  /* ── Auto-avanço ── */
  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      setOffset(o => o + 1)
    }, 2200)
    return () => clearInterval(timerRef.current)
  }, [paused])

  /* ── Teleporte silencioso ao atingir a cópia (posição N) ── */
  useEffect(() => {
    if (offset === N) {
      /* aguarda a transição terminar (450ms) e teleporta sem animação */
      const t = setTimeout(() => {
        setAnimated(false)
        setOffset(0)
      }, 450)
      return () => clearTimeout(t)
    }
  }, [offset])

  /* ── Reativa animação após o teleporte ── */
  useEffect(() => {
    if (!animated) {
      const t = setTimeout(() => setAnimated(true), 30)
      return () => clearTimeout(t)
    }
  }, [animated])

  /* ── Setas manuais (pausam 5s) ── */
  const pauseAndResume = () => {
    setPaused(true)
    clearTimeout(resumeRef.current)
    resumeRef.current = setTimeout(() => setPaused(false), 5000)
  }

  const prev = () => {
    pauseAndResume()
    setOffset(o => {
      if (o === 0) {
        /* teleporta para N sem animação, depois recua */
        setAnimated(false)
        setTimeout(() => {
          setAnimated(true)
          setOffset(N - 1)
        }, 30)
        return 0
      }
      return o - 1
    })
  }

  const next = () => {
    pauseAndResume()
    setOffset(o => o + 1)
  }

  const stepUnit = CARD_W + GAP  /* px por posição */

  return (
    <section style={{ padding: '4rem 5%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,18,.70)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto' }}>

        {/* Cabeçalho */}
        <div className="rev" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.3em', color: 'var(--p3)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            // Nosso processo
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: '0.4rem' }}>
            FLUXO OPERACIONAL
          </h2>
          <p style={{ fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.2em', textTransform: 'uppercase', backgroundImage: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DO LEAD À ENTREGA
          </p>
        </div>

        {/* Carrossel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ArrowBtn onClick={prev} dir="left" />

          {/* Janela (clip) */}
          <div style={{ flex: 1, overflow: 'hidden' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}>

            {/* Faixa de itens */}
            <div style={{
              display: 'flex', alignItems: 'flex-start',
              gap: GAP, paddingTop: 12, paddingBottom: 4,
              transform: `translateX(-${offset * stepUnit}px)`,
              transition: animated ? 'transform 0.45s cubic-bezier(0.22,1,0.36,1)' : 'none',
              willChange: 'transform',
            }}>
              {ITEMS.map((e, idx) => (
                <>
                  <div key={`${e.num}-${idx}`} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    textAlign: 'center', width: CARD_W, flexShrink: 0, gap: '0.75rem',
                  }}>
                    {/* Círculo */}
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      border: `2px solid ${e.cor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: `rgba(${hexToRgb(e.cor)}, 0.10)`,
                      boxShadow: `0 0 20px rgba(${hexToRgb(e.cor)}, 0.25)`,
                      color: e.cor, position: 'relative',
                      transition: 'transform .3s, box-shadow .3s', flexShrink: 0,
                    }}
                    onMouseEnter={ev => { ev.currentTarget.style.transform = 'scale(1.1)'; ev.currentTarget.style.boxShadow = `0 0 35px rgba(${hexToRgb(e.cor)}, 0.55)` }}
                    onMouseLeave={ev => { ev.currentTarget.style.transform = 'scale(1)';   ev.currentTarget.style.boxShadow = `0 0 20px rgba(${hexToRgb(e.cor)}, 0.25)` }}
                    >
                      <e.Ico />
                      <div style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: e.cor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.6rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font)',
                      }}>{(idx % N) + 1}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.78rem', color: '#fff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{e.nome}</div>
                    <div style={{ fontFamily: 'var(--font2)', fontSize: '0.7rem', color: 'rgba(255,255,255,.62)', lineHeight: 1.55, maxWidth: 118 }}>{e.desc}</div>
                  </div>

                  {/* Seta entre passos */}
                  {idx < ITEMS.length - 1 && (
                    <div key={`a${idx}`} style={{ flexShrink: 0, marginTop: 26, opacity: 0.3 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </div>
                  )}
                </>
              ))}
            </div>
          </div>

          <ArrowBtn onClick={next} dir="right" />
        </div>

        {/* Dots — baseados no passo real (mod N) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem' }}>
          {etapas.map((_, i) => (
            <button key={i} onClick={() => { pauseAndResume(); setOffset(i) }} style={{
              width: (offset % N) === i ? 24 : 8, height: 8, borderRadius: 4, border: 'none',
              background: (offset % N) === i ? 'var(--p3)' : 'rgba(255,255,255,.2)',
              cursor: 'none', transition: 'all .3s', padding: 0,
            }} />
          ))}
        </div>

        <div style={{ height: 1, marginTop: '1.5rem', background: 'linear-gradient(90deg, transparent, var(--p), var(--neon), var(--blue), transparent)', opacity: 0.3 }} />
      </div>
    </section>
  )
}
