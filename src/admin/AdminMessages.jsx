import { useState, useEffect } from 'react'
import { getMessages, markRead, deleteMessage } from './messagesService'

const fmt = iso => new Date(iso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })

export default function AdminMessages() {
  const [msgs,     setMsgs]     = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')  /* all | contato | orcamento | unread */

  const load = async () => {
    setLoading(true)
    try { setMsgs(await getMessages()) } catch { setMsgs([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSelect = async msg => {
    setSelected(msg)
    if (!msg.read) {
      await markRead(msg.id)
      setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m))
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Apagar esta mensagem?')) return
    await deleteMessage(id)
    setMsgs(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = msgs.filter(m => {
    if (filter === 'unread') return !m.read
    if (filter === 'read')   return m.read
    return true
  })

  const unread = msgs.filter(m => !m.read).length

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── Lista lateral ── */}
      <div style={{ borderRight: '1px solid rgba(90,46,166,.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Filtros */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(90,46,166,.15)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all',    label: `Todos (${msgs.length})` },
            { key: 'unread', label: `Não lidas (${unread})` },
            { key: 'read',   label: `Lidas (${msgs.length - unread})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '0.3rem 0.7rem', borderRadius: 4, border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 600,
              background: filter === f.key ? '#5A2EA6' : 'rgba(255,255,255,.06)',
              color: filter === f.key ? '#fff' : 'rgba(255,255,255,.5)',
            }}>{f.label}</button>
          ))}
        </div>

        {/* Lista de mensagens */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading && <p style={{ color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '2rem', fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem' }}>Carregando...</p>}
          {!loading && filtered.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,.25)', textAlign: 'center', padding: '2rem', fontFamily: "'Poppins',sans-serif", fontSize: '0.82rem' }}>Nenhuma mensagem</p>
          )}
          {filtered.map(m => (
            <div key={m.id} onClick={() => handleSelect(m)} style={{
              padding: '0.9rem 1rem', borderBottom: '1px solid rgba(90,46,166,.1)',
              cursor: 'pointer', transition: 'background .2s',
              background: selected?.id === m.id ? 'rgba(90,46,166,.2)' : m.read ? 'transparent' : 'rgba(90,46,166,.06)',
              borderLeft: `3px solid ${m.tipo === 'orcamento' ? '#FF2D8D' : '#5A2EA6'}`,
            }}
            onMouseEnter={e => { if (selected?.id !== m.id) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
            onMouseLeave={e => { if (selected?.id !== m.id) e.currentTarget.style.background = m.read ? 'transparent' : 'rgba(90,46,166,.06)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: m.read ? 500 : 700, fontSize: '0.85rem', color: m.read ? 'rgba(255,255,255,.7)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {!m.read && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#FF2D8D', marginRight: 6, verticalAlign: 'middle' }} />}
                  {m.nome || 'Anônimo'}
                </span>
                <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,.3)', flexShrink: 0 }}>{fmt(m.created_at)}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{
                  background: m.tipo === 'orcamento' ? 'rgba(255,45,141,.2)' : 'rgba(90,46,166,.2)',
                  color: m.tipo === 'orcamento' ? '#FF2D8D' : '#a855f7',
                  border: `1px solid ${m.tipo === 'orcamento' ? 'rgba(255,45,141,.3)' : 'rgba(90,46,166,.3)'}`,
                  borderRadius: 3, padding: '0.1rem 0.4rem', fontSize: '0.62rem', fontFamily: "'Poppins',sans-serif", fontWeight: 600,
                }}>{m.tipo === 'orcamento' ? '📋 Briefing' : '💬 Contato'}</span>
                <span style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.72rem', fontFamily: "'Poppins',sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.email}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detalhe da mensagem ── */}
      <div style={{ overflowY: 'auto', background: 'rgba(255,255,255,.02)' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.2)', gap: '0.5rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem' }}>Selecione uma mensagem</p>
          </div>
        ) : (
          <div style={{ padding: '2rem', maxWidth: 700 }}>
            {/* Cabeçalho */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    background: selected.tipo === 'orcamento' ? 'rgba(255,45,141,.2)' : 'rgba(90,46,166,.2)',
                    color: selected.tipo === 'orcamento' ? '#FF2D8D' : '#a855f7',
                    border: `1px solid ${selected.tipo === 'orcamento' ? 'rgba(255,45,141,.3)' : 'rgba(90,46,166,.3)'}`,
                    borderRadius: 4, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontFamily: "'Poppins',sans-serif", fontWeight: 600,
                  }}>{selected.tipo === 'orcamento' ? '📋 Briefing de Orçamento' : '💬 Formulário de Contato'}</span>
                </div>
                <h2 style={{ fontFamily: "'Montserrat',sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '0.2rem' }}>
                  {selected.nome || 'Sem nome'}
                </h2>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.8rem', color: 'rgba(255,255,255,.5)' }}>
                  {selected.email} · {fmt(selected.created_at)}
                </div>
              </div>
              <button onClick={() => handleDelete(selected.id)} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 6, padding: '0.4rem 0.9rem', color: '#f87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                🗑 Apagar
              </button>
            </div>

            {/* Separador */}
            <div style={{ height: 1, background: 'rgba(90,46,166,.2)', marginBottom: '1.5rem' }} />

            {/* Conteúdo — Contato */}
            {selected.tipo === 'contato' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'E-mail',           value: selected.email },
                  { label: 'Tipo de projeto',  value: selected.tipo_projeto },
                  { label: 'Mensagem',         value: selected.mensagem, big: true },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: '0.3rem' }}>{f.label}</div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: f.big ? '0.95rem' : '0.88rem', color: '#fff', lineHeight: 1.7, background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: '0.7rem 0.9rem', border: '1px solid rgba(90,46,166,.15)', whiteSpace: 'pre-wrap' }}>
                      {f.value}
                    </div>
                  </div>
                ))}
                {selected.email && (
                  <a href={`mailto:${selected.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', background: 'linear-gradient(135deg,#5A2EA6,#2D6BFF)', border: 'none', borderRadius: 6, padding: '0.6rem 1.2rem', color: '#fff', fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', width: 'fit-content' }}>
                    ✉ Responder por e-mail
                  </a>
                )}
              </div>
            )}

            {/* Conteúdo — Orçamento/Briefing */}
            {selected.tipo === 'orcamento' && selected.respostas && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  {selected.email && <InfoChip label="E-mail" value={selected.email} />}
                </div>
                {selected.respostas.map((r, i) => (
                  <div key={i}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(168,85,247,.7)', marginBottom: '0.3rem' }}>
                      {i + 1}. {r.pergunta}
                    </div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.9rem', color: '#fff', lineHeight: 1.7, background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: '0.7rem 0.9rem', border: '1px solid rgba(90,46,166,.15)', whiteSpace: 'pre-wrap' }}>
                      {r.resposta}
                    </div>
                  </div>
                ))}
                {selected.email && (
                  <a href={`mailto:${selected.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6)', border: 'none', borderRadius: 6, padding: '0.6rem 1.2rem', color: '#fff', fontFamily: "'Montserrat',sans-serif", fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', width: 'fit-content' }}>
                    ✉ Enviar proposta
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoChip({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(90,46,166,.15)', borderRadius: 6, padding: '0.6rem 0.9rem' }}>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,.35)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem', color: '#fff' }}>{value}</div>
    </div>
  )
}
