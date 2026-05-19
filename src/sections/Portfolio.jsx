import { useState, useRef, useEffect } from 'react'
import { getPortfolio } from '../admin/portfolioService'

/* ── Dados de fallback (usados só se o admin nunca salvou nada) ── */
const FALLBACK = {
  sites: [
    {
      id: 'f1', nome: 'Studio Arquitetura Belém',
      desc: 'Presença institucional que posicionou o escritório como referência premium no Pará.',
      tags: ['React', 'GSAP', 'Contentful'],
      context: 'O cliente precisava sair de um site genérico e ocupar um posicionamento de mercado premium. Desenvolvemos uma identidade visual forte, carregamento ultra-rápido e integração com CMS para gestão autônoma do portfólio de projetos.',
      link: '#',
    },
    {
      id: 'f2', nome: 'Clínica Derma Norte',
      desc: 'Site que reduziu o tempo de agendamento e aumentou a taxa de conversão em 3x.',
      tags: ['Next.js', 'Calendly', 'SEO'],
      context: 'A clínica perdia pacientes por dificuldade no agendamento online. Integramos um sistema de booking em tempo real, otimizamos o SEO local e criamos páginas de serviço que guiam o paciente até a marcação de consulta.',
      link: '#',
    },
    {
      id: 'f3', nome: 'Construtora Horizonte',
      desc: 'Plataforma imersiva com mapa interativo e visualização 3D dos empreendimentos.',
      tags: ['React', 'Three.js', 'Mapbox'],
      context: 'Construtoras competem com grandes portais de imóveis. Criamos um diferencial competitivo com tour virtual 3D dos empreendimentos e mapa interativo com filtros avançados — diretamente no site próprio da empresa.',
      link: '#',
    },
  ],
  landing: [
    {
      id: 'f4', nome: 'Lançamento Orion',
      desc: 'Landing de produto com funil otimizado e taxa de conversão de 8.4%.',
      tags: ['React', 'GSAP', 'RD Station'],
      context: 'Criado para um lançamento com janela de 7 dias, o projeto exigiu velocidade de desenvolvimento sem abrir mão da performance. Integração completa com RD Station para nutrição automática dos leads captados.',
      link: '#',
    },
    {
      id: 'f5', nome: 'Curso Marketing Digital',
      desc: 'Copy + design alinhados: 1.200 inscrições na primeira semana de tráfego pago.',
      tags: ['HTML', 'CSS', 'JS', 'Hotmart'],
      context: 'Trabalhamos junto ao copywriter do cliente para garantir que design e texto se potencializassem mutuamente. Integração com Hotmart e pixel de conversão configurado para rastrear cada etapa do funil.',
      link: '#',
    },
    {
      id: 'f6', nome: 'Clínica Estética Premium',
      desc: 'Página de captura com formulário inteligente e automação de resposta em 5 min.',
      tags: ['React', 'EmailJS'],
      context: 'O maior problema era o tempo de resposta ao lead. Implementamos automação que envia uma mensagem personalizada em menos de 5 minutos após o preenchimento do formulário, reduzindo drasticamente a desistência.',
      link: '#',
    },
    {
      id: 'f12', nome: 'ALPHA LED',
      desc: 'Construção de site institucional para empresa do setor de iluminação LED.',
      tags: ['WordPress', 'HTML', 'CSS', 'SQL'],
      context: 'Site institucional completo para a Alpha LED, com catálogo de produtos, páginas de serviço e integração com formulário de orçamento.',
      imagem: 'https://lh3.googleusercontent.com/d/1mcXV3BBDJKm3_UYZQTi4v6te0jB',
      link: '#',
    },
  ],
  ecommerce: [
    {
      id: 'f7', nome: 'Moda Pernambucana',
      desc: 'E-commerce que faturou R$ 180k no primeiro mês com foco em UX e checkout rápido.',
      tags: ['Next.js', 'Stripe', 'PostgreSQL'],
      context: 'Desenvolvemos um fluxo de compra com o menor número possível de cliques do carrinho ao pagamento. Checkout otimizado, relatórios em tempo real e painel administrativo completo para gestão do estoque.',
      link: '#',
    },
    {
      id: 'f8', nome: 'Suplementos Power',
      desc: 'Plataforma de assinaturas com recorrência automatizada e área do cliente.',
      tags: ['React', 'Node.js', 'MongoDB'],
      context: 'O modelo de negócio exigia um sistema de assinatura robusto. Implementamos cobranças recorrentes, área do assinante com histórico de pedidos, e sistema de indicação com cupons dinâmicos.',
      link: '#',
    },
  ],
  sistemas: [
    {
      id: 'f9', nome: 'SaaS Gestão Imobiliária',
      desc: 'Plataforma B2B com 40+ imobiliárias ativas, contratos digitais e BI integrado.',
      tags: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      context: 'Sistema completo para gestão de imóveis, contratos e comissões. Desenvolvemos módulos de assinatura digital, relatórios de desempenho por corretor e dashboard executivo com métricas em tempo real.',
      link: '#',
    },
    {
      id: 'f10', nome: 'Plataforma EAD',
      desc: 'LMS com videoaulas em streaming, certificação automática e integração Stripe.',
      tags: ['Next.js', 'AWS S3', 'Stripe'],
      context: 'Criamos do zero uma plataforma de ensino completa: upload de vídeo com transcodificação automática, progresso de aluno por módulo, emissão de certificado em PDF e gestão financeira integrada.',
      link: '#',
    },
    {
      id: 'f11', nome: 'App de Logística',
      desc: 'Rastreamento em tempo real com Socket.io para frota de 200+ veículos.',
      tags: ['React', 'Socket.io', 'Maps API'],
      context: 'O cliente gerencia uma frota distribuída e precisava de visibilidade em tempo real. Desenvolvemos um painel com atualização por WebSocket, histórico de rotas, alertas automáticos e API para integração com ERPs.',
      link: '#',
    },
  ],
}

const catIcons = {
  sites: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  landing: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  ecommerce: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  sistemas: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  ),
}

const catLabels = { sites: 'Sites', landing: 'Landpages', ecommerce: 'E-commerce', sistemas: 'Sistemas' }

const gradients = [
  'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)',
  'linear-gradient(135deg, #6d28d9 0%, #0f172a 100%)',
  'linear-gradient(135deg, #2d0d5e 0%, #1a0533 100%)',
]

/* Lê dados do localStorage (admin) com fallback nos dados internos */
function loadPortData() {
  try {
    const saved = localStorage.getItem('pulsari_portfolio')
    if (saved) {
      const parsed = JSON.parse(saved)
      /* mescla: garante que cada categoria exista */
      return {
        sites:     parsed.sites     || FALLBACK.sites,
        landing:   parsed.landing   || FALLBACK.landing,
        ecommerce: parsed.ecommerce || FALLBACK.ecommerce,
        sistemas:  parsed.sistemas  || FALLBACK.sistemas,
      }
    }
  } catch {}
  return FALLBACK
}

export default function Portfolio() {
  const [portData,    setPortData]   = useState(loadPortData)
  const [activeCat,   setActiveCat]  = useState(null)
  const [activeCard,  setActiveCard] = useState(0)
  const [expanded,    setExpanded]   = useState(null)
  const [imgOffset,   setImgOffset]  = useState({ x: 0, y: 0 })
  const [imgError,    setImgError]   = useState(false)
  const imgRef = useRef(null)

  /* Atualiza dados quando a aba volta ao foco (usuário saiu do admin e voltou) */
  useEffect(() => {
    const onFocus = () => setPortData(loadPortData())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const projects = activeCat ? (portData[activeCat] || []) : []

  const handleImgMove = e => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 40
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 40
    setImgOffset({ x, y })
  }

  const selectCat = cat => { setActiveCat(cat); setActiveCard(0); setExpanded(null); setImgError(false) }
  const goBack    = ()  => { setActiveCat(null); setActiveCard(0); setExpanded(null); setImgError(false) }

  const goPrev = () => {
    setActiveCard(i => (i - 1 + projects.length) % projects.length)
    setExpanded(null)
    setImgOffset({ x: 0, y: 0 })
    setImgError(false)
  }
  const goNext = () => {
    setActiveCard(i => (i + 1) % projects.length)
    setExpanded(null)
    setImgOffset({ x: 0, y: 0 })
    setImgError(false)
  }

  /* Navegação por teclado ← → quando portfólio está aberto */
  useEffect(() => {
    if (!activeCat) return
    const onKey = e => {
      if (e.key === 'ArrowLeft')  { goPrev(); }
      if (e.key === 'ArrowRight') { goNext(); }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat, projects.length])

  const proj = projects[activeCard]
  const total = projects.length

  return (
    <section id="portfolio" style={{ padding: '4rem 5%', position: 'relative' }}>
      {/* overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(3,2,12,.70)', zIndex: 1, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* ── Estado A: tela inicial ── */}
        {!activeCat && (
          <div className="rev" style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: 'clamp(2.5rem, 15vw, 14rem)', fontWeight: 800, lineHeight: 0.9,
              background: 'linear-gradient(135deg, var(--w), var(--p3), var(--neon))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.04em', marginBottom: '2rem',
            }}>PORTFÓLIO</h2>

            <p style={{
              fontFamily: 'var(--font2)', fontSize: '1.05rem', color: 'var(--w)',
              maxWidth: 520, margin: '0 auto 2.5rem', lineHeight: 1.7,
            }}>
              Mais de 50 projetos entregues. Escolha uma categoria e veja o que construímos juntos.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {Object.keys(portData).map(cat => (
                <button key={cat} className="btn" onClick={() => selectCat(cat)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {catIcons[cat]}{catLabels[cat]}
                  <span style={{ opacity: .55, fontSize: '0.75em' }}>({(portData[cat] || []).length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Estado B: expandido ── */}
        {activeCat && (
          <div style={{
            display: 'grid', gridTemplateColumns: '35% 65%',
            gap: 0, maxWidth: 1300, margin: '0 auto',
          }} className="port-grid">

            {/* Coluna esquerda sticky */}
            <div style={{
              padding: 'clamp(1.5rem, 3vw, 3rem) clamp(1rem, 3%, 50px) clamp(1.5rem, 3vw, 3rem) 0',
              borderRight: '1px solid var(--border)',
              position: 'sticky', top: 80,
              height: 'calc(100vh - 80px)',
              display: 'flex', flexDirection: 'column',
            }}>
              <button onClick={goBack} style={{
                background: 'none', border: 'none', color: 'rgba(237,233,255,0.72)',
                fontFamily: 'var(--font2)', fontSize: '0.8rem',
                letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none',
                marginBottom: '1.5rem', textAlign: 'left', transition: 'color .3s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--w)'}
              onMouseLeave={e => e.target.style.color = 'var(--g)'}
              >← Voltar</button>

              <h2 style={{
                fontSize: 'clamp(2.5rem, 4vw, 4.5rem)', fontWeight: 800,
                lineHeight: 0.9, letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg, var(--w), var(--p3), var(--neon))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: '2rem',
              }}>PORT<br />FÓLIO</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.keys(portData).map(cat => (
                  <button key={cat} onClick={() => selectCat(cat)}
                    className="btn"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: activeCat === cat ? 'var(--p2)' : 'transparent',
                      borderColor: activeCat === cat ? 'var(--p)' : 'var(--border)',
                      color: activeCat === cat ? '#fff' : 'var(--w)',
                      justifyContent: 'space-between',
                    }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {catIcons[cat]}{catLabels[cat]}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ opacity: .5, fontSize: '0.75em' }}>({(portData[cat] || []).length})</span>
                      {activeCat === cat && (
                        <span style={{ transition: 'transform .3s', transform: 'translateX(4px)' }}>→</span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coluna direita */}
            <div style={{
              padding: 'clamp(1.5rem, 3vw, 3rem) 0 clamp(1.5rem, 3vw, 3rem) clamp(1rem, 3%, 50px)',
              overflowY: 'auto', maxHeight: 'calc(100vh - 80px)',
            }}>

              {/* ── Cabeçalho categoria ── */}
              <p style={{
                fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 600,
                letterSpacing: '0.3em', color: 'var(--p3)', textTransform: 'uppercase',
                marginBottom: '1.5rem',
              }}>// {catLabels[activeCat]}</p>

              {proj && (
                <div key={proj.id || activeCard} style={{
                  border: '1px solid var(--border)', borderRadius: 5,
                  background: 'rgba(6,5,26,.8)', backdropFilter: 'blur(10px)',
                  overflow: 'hidden',
                  animation: 'slideR .4s cubic-bezier(0.22,1,0.36,1)',
                }}>
                  {/* Área de imagem com parallax */}
                  <div ref={imgRef} onMouseMove={handleImgMove}
                    onMouseLeave={() => setImgOffset({ x: 0, y: 0 })}
                    style={{ height: 240, position: 'relative', overflow: 'hidden', cursor: proj.linkSistema ? 'pointer' : 'none' }}
                    onClick={() => proj.linkSistema && window.open(proj.linkSistema, '_blank')}
                  >
                    {/* Fundo: imagem real ou gradiente fallback */}
                    <div style={{
                      position: 'absolute', inset: '-20px',
                      background: gradients[activeCard % gradients.length],
                      transform: `translate(${imgOffset.x * 0.5}px, ${imgOffset.y * 0.5}px) scale(1.1)`,
                      transition: 'transform .1s ease',
                    }} />
                    {/* Grid decorativo sobre gradiente */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.4 }} />
                    {/* Imagem real (se existir e não der erro) */}
                    {proj.imagem && !imgError && (
                      <img src={proj.imagem} alt={proj.nome}
                        onError={() => setImgError(true)}
                        style={{
                          position: 'absolute', inset: '-20px', width: 'calc(100% + 40px)', height: 'calc(100% + 40px)',
                          objectFit: 'cover',
                          transform: `translate(${imgOffset.x * 0.5}px, ${imgOffset.y * 0.5}px) scale(1.05)`,
                          transition: 'transform .1s ease',
                        }}
                      />
                    )}


                    {/* Hover overlay */}
                    <div className="img-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                      opacity: 0, transition: 'opacity .3s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      {proj.linkSistema && (
                        <span style={{ background: 'rgba(255,45,141,.85)', border: '1px solid #FF2D8D', borderRadius: 3, padding: '0.5rem 1rem', color: '#fff', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          ↗ Acessar sistema
                        </span>
                      )}
                      <button className="btn btn-primary"
                        onClick={e => { e.stopPropagation(); setExpanded(expanded === activeCard ? null : activeCard) }}>
                        + Informações
                      </button>
                    </div>

                    {/* Tag categoria */}
                    <div style={{
                      position: 'absolute', bottom: 12, left: 16,
                      background: 'rgba(124,58,237,.25)', border: '1px solid var(--border)',
                      borderRadius: 2, padding: '0.2rem 0.6rem',
                      fontFamily: 'var(--font2)', fontSize: '0.65rem',
                      letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--p3)',
                    }}>{catLabels[activeCat]}</div>
                  </div>

                  {/* Info do card */}
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--w)' }}>
                      {proj.nome}
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font2)', fontSize: '0.95rem',
                      color: 'var(--w)', lineHeight: 1.6, marginBottom: '1rem',
                    }}>{proj.desc}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(Array.isArray(proj.tags) ? proj.tags : []).map(tag => (
                        <span key={tag} style={{
                          padding: '0.2rem 0.6rem', borderRadius: 2,
                          border: '1px solid var(--border)', color: 'var(--p3)',
                          fontFamily: 'var(--font2)', fontSize: '0.72rem', letterSpacing: '0.08em',
                        }}>{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Painel de detalhes */}
                  {expanded === activeCard && proj.context && (
                    <div style={{
                      padding: '1.25rem 1.5rem',
                      borderTop: '1px solid var(--border)',
                      animation: 'fadeIn .4s ease',
                    }}>
                      <p style={{
                        fontFamily: 'var(--font2)', fontSize: '0.9rem',
                        color: 'var(--w)', lineHeight: 1.8, marginBottom: '1rem',
                      }}>{proj.context}</p>
                      {proj.link && proj.link !== '#' && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.72rem' }}>
                          Visitar projeto ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Navegação: Anterior + dots + Próximo ── */}
              {total > 1 && (
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  marginTop: '1.2rem', gap: '1rem',
                }}>

                  {/* Botão ANTERIOR */}
                  <button onClick={goPrev} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.15)',
                    borderRadius: 8, padding: '0.6rem 1.1rem',
                    color: 'rgba(255,255,255,.7)', fontFamily: "'Poppins',sans-serif",
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'none',
                    transition: 'all .2s', letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(90,46,166,.3)'; e.currentTarget.style.borderColor='var(--p)'; e.currentTarget.style.color='#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)'; e.currentTarget.style.color='rgba(255,255,255,.7)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                    </svg>
                    Anterior
                  </button>

                  {/* Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {projects.map((_, i) => (
                      <button key={i} onClick={() => { setActiveCard(i); setExpanded(null) }} style={{
                        width: i === activeCard ? 22 : 8, height: 8,
                        borderRadius: 4, border: 'none',
                        background: i === activeCard ? 'var(--p3)' : 'rgba(255,255,255,.2)',
                        cursor: 'none', transition: 'all .3s', flexShrink: 0,
                      }} />
                    ))}
                  </div>

                  {/* Botão PRÓXIMO */}
                  <button onClick={goNext} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'linear-gradient(135deg, rgba(90,46,166,.4), rgba(45,107,255,.4))',
                    border: '1px solid rgba(90,46,166,.6)',
                    borderRadius: 8, padding: '0.6rem 1.1rem',
                    color: '#fff', fontFamily: "'Poppins',sans-serif",
                    fontWeight: 600, fontSize: '0.82rem', cursor: 'none',
                    transition: 'all .2s', letterSpacing: '0.04em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg,#5A2EA6,#2D6BFF)'; e.currentTarget.style.borderColor='#5A2EA6' }}
                  onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(90,46,166,.4), rgba(45,107,255,.4))'; e.currentTarget.style.borderColor='rgba(90,46,166,.6)' }}
                  >
                    Próximo
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>

                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideR { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        @media (max-width: 1024px) {
          .port-grid { grid-template-columns: 1fr !important; }
          .port-grid > *:first-child { position: static !important; height: auto !important; border-right: none !important; padding: 0 0 2rem !important; border-bottom: 1px solid var(--border); }
          .port-grid > *:last-child { padding: 2rem 0 0 !important; }
        }
      `}</style>
    </section>
  )
}
