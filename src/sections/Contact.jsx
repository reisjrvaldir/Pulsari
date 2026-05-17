import { useState } from 'react'
import { sendMessage } from '../admin/messagesService'

/* ── Ícones ── */
const IconMsg = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconDoc = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IconEmail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)
const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconCheck = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const perguntas = [
  'Qual é o seu nome e empresa?',
  'Qual produto ou serviço deseja divulgar?',
  'Quem é o seu público-alvo?',
  'Qual o principal objetivo da página? (gerar leads, vender, apresentar serviços)',
  'Já tem logo e identidade visual definida?',
  'Tem fotos ou imagens para usar?',
  'Tem algum site ou LP de referência que goste?',
  'Deseja integração com WhatsApp?',
  'Já tem domínio próprio? Se sim, qual?',
  'Tem alguma observação ou dúvida adicional?',
]

const contactItems = [
  { icon: <IconEmail />, label: 'E-mail',      value: 'oi@pulsari.com.br' },
  { icon: <IconPhone />, label: 'WhatsApp',    value: '+55 (81) 99999-0000' },
  { icon: <IconPin />,   label: 'Localização', value: 'Recife, PE — Brasil' },
]

const tipoOptions = ['Site Institucional','Landing Page','E-commerce','Sistema Web','UI/UX Design','Outro']

const inputStyle = {
  width: '100%', background: 'rgba(124,58,237,.04)',
  border: '1px solid var(--border)', borderRadius: 3,
  padding: '0.7rem 0.9rem', color: 'var(--w)',
  fontFamily: 'var(--font2)', fontSize: '0.9rem',
  outline: 'none', transition: 'border-color .3s',
}
const labelStyle = {
  display: 'block', fontFamily: 'var(--font2)', fontSize: '0.68rem',
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--w)', marginBottom: '0.35rem',
}

/* ── Coluna de info — sempre visível ── */
function InfoCol() {
  return (
    <div className="revl" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <p style={{ fontFamily: 'var(--font2)', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.3em', color: 'var(--p3)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          // Contato
        </p>
        <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          Vamos construir<br />
          <span style={{ background: 'linear-gradient(90deg, var(--p), var(--neon))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            algo incrível
          </span>
        </h2>
        <p style={{ fontFamily: 'var(--font2)', fontSize: '0.92rem', color: 'var(--w)', lineHeight: 1.75 }}>
          Tem um projeto em mente? Uma ideia que precisa sair do papel? Conte para a gente — a primeira conversa não custa nada e pode mudar muito.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        {contactItems.map(item => (
          <div key={item.label} style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(124,58,237,.05)', flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font2)', fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--w)', marginBottom: '0.08rem' }}>{item.label}</div>
              <div style={{ fontFamily: 'var(--font2)', fontSize: '0.9rem', color: 'var(--w)', fontWeight: 600 }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════ */
export default function Contact() {
  const [view, setView]           = useState('cards') /* 'cards' | 'contato' | 'orcamento' */
  const [sentContact, setSentContact] = useState(false)
  const [form, setForm]           = useState({ nome: '', email: '', tipo: '', msg: '' })
  const [step, setStep]           = useState(0)
  const [respostas, setRespostas] = useState(Array(10).fill(''))
  const [erroStep, setErroStep]   = useState(false)
  const [showModal, setShowModal] = useState(false)

  const pct = Math.round((step / perguntas.length) * 100)

  const handleNextStep = () => {
    if (!respostas[step].trim()) { setErroStep(true); return }
    setErroStep(false)
    if (step < perguntas.length - 1) setStep(s => s + 1)
    else {
      /* Envia briefing para a API */
      const payload = {
        tipo: 'orcamento',
        nome: respostas[0] || 'Visitante',
        email: '',
        respostas: perguntas.map((p, i) => ({ pergunta: p, resposta: respostas[i] || '' })),
      }
      sendMessage(payload).catch(() => {})
      setShowModal(true)
    }
  }

  const handleModalOk = () => {
    setShowModal(false)
    setStep(0); setRespostas(Array(10).fill('')); setErroStep(false)
    setView('cards')
  }

  const backToCards = () => {
    setView('cards'); setSentContact(false)
    setForm({ nome: '', email: '', tipo: '', msg: '' })
    setStep(0); setRespostas(Array(10).fill('')); setErroStep(false)
  }

  /* ── Layout base: 3 colunas ou 2 colunas ao abrir form ── */
  const isCards = view === 'cards'

  return (
    <section id="contato" style={{ padding: '4rem 5%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,2,12,.70)', zIndex: 1, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Grid principal ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isCards ? '2fr 1fr 1fr' : '1fr 2fr',
          gap: isCards ? '2rem' : '4rem',
          alignItems: 'stretch',
          transition: 'grid-template-columns .5s ease',
        }} className="contact-outer">

          {/* COL 1 — Info (sempre visível) */}
          <InfoCol />

          {/* COL 2 — Card Contato ou Form Contato */}
          {isCards ? (
            <CardBtn
              icon={<IconMsg />}
              title="Entrar em Contato"
              desc="Tire dúvidas, envie uma mensagem ou converse com nossa equipe. Respondemos em até 5 minutos."
              cta="Abrir Chat →"
              onClick={() => setView('contato')}
              className="rev d1"
            />
          ) : view === 'contato' ? (
            <FormContato
              form={form} setForm={setForm}
              sent={sentContact} setSent={setSentContact}
              onBack={backToCards}
            />
          ) : (
            <FormOrcamento
              step={step} setStep={setStep}
              respostas={respostas} setRespostas={setRespostas}
              erroStep={erroStep} setErroStep={setErroStep}
              pct={pct} onNext={handleNextStep} onBack={backToCards}
            />
          )}

          {/* COL 3 — Card Orçamento (só nos cards) */}
          {isCards && (
            <CardBtn
              icon={<IconDoc />}
              title="Solicitar Orçamento"
              desc="Preencha nosso briefing rápido com 10 perguntas e receba uma proposta personalizada em até 2h."
              cta="Fazer Briefing →"
              onClick={() => setView('orcamento')}
              className="rev d2"
            />
          )}
        </div>
      </div>

      {/* ── Modal obrigado ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(3,2,12,.88)', backdropFilter: 'blur(12px)', animation: 'fadeIn .3s ease' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '3rem 2.5rem', maxWidth: 440, width: '90%', textAlign: 'center', position: 'relative', boxShadow: '0 0 60px rgba(124,58,237,.25)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--p), var(--neon))', borderRadius: '8px 8px 0 0' }} />
            <IconCheck />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--w)', margin: '1.2rem 0 0.75rem' }}>Briefing recebido!</h3>
            <p style={{ fontFamily: 'var(--font2)', fontSize: '0.98rem', color: 'var(--w)', lineHeight: 1.75, marginBottom: '2rem' }}>
              Vamos analisar as suas respostas e entraremos em contato em até{' '}
              <strong style={{ color: 'var(--p3)' }}>2 horas</strong>.{' '}
              Fique de olho no seu e-mail e WhatsApp!
            </p>
            <button onClick={handleModalOk} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              OK, entendido!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .contact-outer { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr !important; } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        textarea:focus, input:focus, select:focus { border-color: var(--p) !important; }
      `}</style>
    </section>
  )
}

/* ── Card clicável ── */
function CardBtn({ icon, title, desc, cta, onClick, className }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} className={className}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(124,58,237,.10)' : 'rgba(124,58,237,.04)',
        border: `1px solid ${hov ? 'var(--p)' : 'var(--border)'}`,
        boxShadow: hov ? '0 0 30px rgba(124,58,237,.15)' : 'none',
        borderRadius: 6, padding: '2.2rem 1.8rem', textAlign: 'left',
        cursor: 'none', transition: 'all .35s',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: '0.9rem', width: '100%',
      }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--p), var(--neon))' }} />
      <div style={{ color: 'var(--p3)' }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--w)', marginBottom: '0.45rem' }}>{title}</div>
        <div style={{ fontFamily: 'var(--font2)', fontSize: '0.88rem', color: 'var(--w)', lineHeight: 1.65 }}>{desc}</div>
      </div>
      <div style={{ fontFamily: 'var(--font2)', fontSize: '0.75rem', letterSpacing: '0.1em', color: 'var(--p3)', textTransform: 'uppercase', fontWeight: 600, marginTop: 'auto' }}>{cta}</div>
    </button>
  )
}

/* ── Form Contato ── */
function FormContato({ form, setForm, sent, setSent, onBack }) {
  return (
    <div style={{ animation: 'slideUp .4s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(237,233,255,0.72)', fontFamily: 'var(--font2)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', marginBottom: '1.5rem', padding: 0, transition: 'color .3s' }}
        onMouseEnter={e => e.target.style.color = 'var(--w)'} onMouseLeave={e => e.target.style.color = 'rgba(237,233,255,0.72)'}>
        ← Voltar
      </button>
      <div style={{ background: 'rgba(124,58,237,.03)', border: '1px solid var(--border)', borderRadius: 5, padding: '2rem', position: 'relative' }}>
        <span style={{ position: 'absolute', top: -11, left: 20, background: 'var(--bg)', padding: '0 0.5rem', fontFamily: 'var(--font2)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--p3)' }}>CONTACT.INIT</span>
        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2.5rem 0', textAlign: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--p3)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--w)' }}>Mensagem recebida!</h3>
            <p style={{ fontFamily: 'var(--font2)', fontSize: '0.9rem', color: 'var(--w)', lineHeight: 1.7 }}>
              Respondemos em até <strong style={{ color: 'var(--p3)' }}>5 minutos</strong> no horário comercial.
            </p>
          </div>
        ) : (
          <form onSubmit={async e => {
              e.preventDefault()
              await sendMessage({ tipo: 'contato', nome: form.nome, email: form.email, tipo_projeto: form.tipo, mensagem: form.msg }).catch(() => {})
              setSent(true)
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-row">
              {[{ k: 'nome', l: 'Nome', t: 'text', p: 'Seu nome' }, { k: 'email', l: 'E-mail', t: 'email', p: 'seu@email.com' }].map(f => (
                <div key={f.k}>
                  <label style={labelStyle}>{f.l}</label>
                  <input type={f.t} placeholder={f.p} required value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} style={inputStyle} />
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>Tipo de Projeto</label>
              <select required value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} style={{ ...inputStyle, color: form.tipo ? 'var(--w)' : 'rgba(237,233,255,0.4)' }}>
                <option value="" style={{ background: 'var(--bg)' }}>Selecione...</option>
                {tipoOptions.map(o => <option key={o} value={o} style={{ background: 'var(--bg)' }}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mensagem</label>
              <textarea rows={4} required placeholder="Conte sobre seu projeto, prazo e orçamento..." value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font2)' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Enviar Mensagem →</button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── Form Orçamento em etapas ── */
function FormOrcamento({ step, setStep, respostas, setRespostas, erroStep, setErroStep, pct, onNext, onBack }) {
  return (
    <div style={{ animation: 'slideUp .4s ease' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(237,233,255,0.72)', fontFamily: 'var(--font2)', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'none', marginBottom: '1.5rem', padding: 0, transition: 'color .3s' }}
        onMouseEnter={e => e.target.style.color = 'var(--w)'} onMouseLeave={e => e.target.style.color = 'rgba(237,233,255,0.72)'}>
        ← Voltar
      </button>

      {/* Progresso */}
      <div style={{ marginBottom: '1.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <span style={{ fontFamily: 'var(--font2)', fontSize: '0.75rem', color: 'var(--w)', letterSpacing: '0.06em' }}>
            <strong style={{ color: 'var(--p3)' }}>{step}</strong>/10 respondidas
          </span>
          <span style={{ fontFamily: 'var(--font)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--p3)' }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(124,58,237,.2)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--p), var(--neon))', borderRadius: 2, transition: 'width .5s cubic-bezier(0.22,1,0.36,1)' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.5rem' }}>
          {perguntas.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? 'var(--p3)' : i === step ? 'var(--neon)' : 'rgba(124,58,237,.18)', transition: 'background .4s' }} />
          ))}
        </div>
      </div>

      {/* Pergunta */}
      <div style={{ background: 'rgba(124,58,237,.04)', border: '1px solid var(--border)', borderRadius: 6, padding: '2rem', position: 'relative' }}>
        <span style={{ position: 'absolute', top: -11, left: 20, background: 'var(--bg)', padding: '0 0.5rem', fontFamily: 'var(--font2)', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--p3)' }}>
          BRIEFING.{String(step + 1).padStart(2, '0')}
        </span>
        <p style={{ fontFamily: 'var(--font2)', fontSize: '1rem', fontWeight: 600, color: 'var(--w)', lineHeight: 1.55, marginBottom: '1.2rem' }}>
          <span style={{ color: 'var(--p3)', marginRight: '0.4rem' }}>{step + 1}.</span>
          {perguntas[step]}
        </p>
        <textarea key={step} rows={4} required placeholder="Sua resposta..." value={respostas[step]}
          onChange={e => { const n = [...respostas]; n[step] = e.target.value; setRespostas(n); if (erroStep) setErroStep(false) }}
          style={{ ...inputStyle, resize: 'none', fontFamily: 'var(--font2)', borderColor: erroStep ? '#ef4444' : 'var(--border)' }}
          autoFocus
        />
        {erroStep && <p style={{ fontFamily: 'var(--font2)', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.35rem' }}>Esta pergunta é obrigatória.</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem' }}>
          {step > 0
            ? <button onClick={() => { setStep(s => s - 1); setErroStep(false) }} className="btn" style={{ fontSize: '0.75rem' }}>← Anterior</button>
            : <span />}
          <button onClick={onNext} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
            {step < 9 ? 'Próxima →' : 'Enviar Briefing ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}
