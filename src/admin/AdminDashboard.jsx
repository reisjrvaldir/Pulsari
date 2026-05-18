import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from './auth'
import { getPortfolio, addProject, updateProject, deleteProject, CATS } from './portfolioService'
import { getUnreadCount } from './messagesService'
import AdminMessages from './AdminMessages'

const EMPTY_FORM = { nome: '', desc: '', context: '', tags: '', link: '', imagem: '', linkSistema: '' }

export default function AdminDashboard() {
  const nav = useNavigate()

  /* Restaura o cursor normal (globals.css esconde no site) */
  useEffect(() => {
    document.body.style.cursor = 'auto'
    return () => { document.body.style.cursor = '' }
  }, [])

  const [tab,       setTab]       = useState('portfolio')  /* 'portfolio' | 'mensagens' */
  const [unread,    setUnread]    = useState(0)
  const [darkMode,  setDarkMode]  = useState(true)
  const [data,      setData]      = useState(getPortfolio())
  const [activeCat, setActiveCat] = useState('sites')
  const [modal,     setModal]     = useState(null)   /* null | 'add' | { cat, id } */
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saved,     setSaved]     = useState(false)

  const handleLogout = () => { logout(); nav('/admin/login') }

  const openAdd = () => { setForm(EMPTY_FORM); setModal('add') }
  const openEdit = p => { setForm({ ...p, tags: p.tags.join(', ') }); setModal({ id: p.id }) }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM) }

  const handleSave = () => {
    const project = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
    let updated
    if (modal === 'add') {
      updated = addProject(activeCat, project)
    } else {
      updated = updateProject(activeCat, modal.id, project)
    }
    setData(updated)
    closeModal()
    flash()
  }

  const handleDelete = (cat, id) => {
    if (!window.confirm('Remover este projeto?')) return
    const updated = deleteProject(cat, id)
    setData(updated)
    flash()
  }

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  /* Polling de mensagens não lidas — a cada 30s */
  useEffect(() => {
    const poll = async () => { try { setUnread(await getUnreadCount()) } catch {} }
    poll()
    const t = setInterval(poll, 30000)
    return () => clearInterval(t)
  }, [])

  const projects = data[activeCat] || []

  const bg      = darkMode ? '#0A0812' : '#f4f3f8'
  const fg      = darkMode ? '#fff'    : '#1a0a2e'
  const cardBg  = darkMode ? 'rgba(30,11,46,.9)' : '#fff'
  const border  = darkMode ? 'rgba(90,46,166,.3)' : 'rgba(90,46,166,.2)'

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: "'Montserrat',sans-serif", color: fg, transition: 'background .3s, color .3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── Topbar ── */}
      <div style={{
        background: cardBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${border}`,
        padding: '0 2rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em', background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6,#2D6BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PULSARI <span style={{ fontSize: '0.65rem', WebkitTextFillColor: 'rgba(255,255,255,.4)', background: 'none', letterSpacing: '0.2em' }}>ADMIN</span>
          </div>
          {/* Abas */}
          {[
            { key: 'portfolio',  label: 'Portfólio' },
            { key: 'mensagens',  label: 'Mensagens', badge: unread },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.82rem',
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,.4)',
              borderBottom: `2px solid ${tab === t.key ? '#a855f7' : 'transparent'}`,
              paddingBottom: '0.2rem', transition: 'all .2s',
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {t.label}
              {t.badge > 0 && (
                <span style={{ background: '#FF2D8D', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.62rem', color: '#fff', fontWeight: 700 }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* 🌙 Dark/Light mode */}
          <button onClick={() => setDarkMode(v => !v)} title={darkMode ? 'Modo claro' : 'Modo escuro'} style={{
            background: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(90,46,166,.1)',
            border: `1px solid ${border}`, borderRadius: 6,
            padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '1rem',
            transition: 'all .2s', display: 'flex', alignItems: 'center',
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          {/* ← Voltar ao site */}
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(90,46,166,.15)', border: '1px solid rgba(90,46,166,.4)',
            borderRadius: 6, padding: '0.4rem 0.9rem',
            color: '#a855f7', fontSize: '0.78rem', letterSpacing: '0.08em',
            textDecoration: 'none', textTransform: 'uppercase', fontWeight: 600,
            transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(90,46,166,.35)'; e.currentTarget.style.color='#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(90,46,166,.15)'; e.currentTarget.style.color='#a855f7' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar ao site
          </a>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, padding: '0.4rem 0.9rem', color: 'rgba(255,255,255,.6)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
            onMouseEnter={e => { e.target.style.borderColor = '#FF2D8D'; e.target.style.color = '#FF2D8D' }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,.15)'; e.target.style.color = 'rgba(255,255,255,.6)' }}>
            Sair
          </button>
        </div>
      </div>

      {/* ── Aba Mensagens ── */}
      {tab === 'mensagens' && <AdminMessages />}

      {/* ── Aba Portfólio ── */}
      {tab === 'portfolio' && <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem' }}>Portfólio</h1>
          <p style={{ color: 'rgba(255,255,255,.45)', fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem' }}>
            Gerencie os projetos exibidos no site
          </p>
        </div>

        {/* ── Tabs de categoria ── */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {Object.entries(CATS).map(([key, { label, color }]) => (
            <button key={key} onClick={() => setActiveCat(key)} style={{
              padding: '0.5rem 1.2rem', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em',
              background: activeCat === key ? color : 'rgba(255,255,255,.06)',
              color: activeCat === key ? '#fff' : 'rgba(255,255,255,.5)',
              transition: 'all .2s',
            }}>
              {label} <span style={{ opacity: .7 }}>({(data[key] || []).length})</span>
            </button>
          ))}
        </div>

        {/* ── Barra de ações ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''} em <strong style={{ color: CATS[activeCat].color }}>{CATS[activeCat].label}</strong>
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {saved && <span style={{ color: '#10b981', fontSize: '0.78rem', fontFamily: "'Poppins',sans-serif" }}>✓ Salvo</span>}
            <button onClick={openAdd} style={{
              background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6)',
              border: 'none', borderRadius: 6, padding: '0.55rem 1.2rem',
              color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', letterSpacing: '0.05em',
            }}>+ Adicionar projeto</button>
          </div>
        </div>

        {/* ── Lista de projetos ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,.25)', fontFamily: "'Poppins',sans-serif" }}>
              Nenhum projeto nesta categoria. Clique em "+ Adicionar".
            </div>
          )}
          {projects.map(p => (
            <div key={p.id} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(90,46,166,.2)',
              borderRadius: 8, padding: '1.1rem 1.4rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
              transition: 'border-color .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(90,46,166,.5)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(90,46,166,.2)'}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: '#fff' }}>{p.nome}</div>
                <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif", marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {p.tags?.map(t => (
                    <span key={t} style={{ background: 'rgba(90,46,166,.2)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.68rem', color: '#a855f7', fontFamily: "'Poppins',sans-serif" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button onClick={() => openEdit(p)} style={btnEdit}>Editar</button>
                <button onClick={() => handleDelete(activeCat, p.id)} style={btnDel}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      </div>}  {/* fecha tab portfolio */}

      {/* ── Modal add/edit ── */}
      {modal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,18,.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{
            background: '#1a0b2e', border: '1px solid rgba(90,46,166,.4)',
            borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                {modal === 'add' ? '+ Novo projeto' : '✎ Editar projeto'}
                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: CATS[activeCat].color, letterSpacing: '0.1em' }}>{CATS[activeCat].label}</span>
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'nome',    label: 'Nome do projeto *',   placeholder: 'Ex: Site Empresa X',                   type: 'text' },
                { key: 'desc',    label: 'Descrição curta *',   placeholder: 'Uma linha sobre o resultado alcançado', type: 'text' },
                { key: 'context',     label: 'Contexto / Detalhes',                   placeholder: 'Desafio, solução, impacto...',    type: 'textarea' },
                { key: 'tags',        label: 'Tecnologias (vírgula)',                  placeholder: 'React, Node.js, MongoDB',        type: 'text' },
                { key: 'imagem',      label: 'URL da imagem de capa',                  placeholder: 'https://i.imgur.com/abc.jpg',    type: 'url', tip: '📐 Tamanho ideal: 800 × 450 px (proporção 16:9) · JPG ou WebP · máx. 500 KB' },
                { key: 'linkSistema', label: 'Link do sistema / projeto (clicável)',   placeholder: 'https://sistema.pulsari.com.br', type: 'url', tip: '🔗 O internauta será direcionado para este link ao clicar na imagem do portfólio' },
                { key: 'link',        label: 'Link externo (botão "Visitar projeto")', placeholder: 'https://...',                    type: 'url' },
              ].map(f => (
                <div key={f.key}>
                  <label style={mLabelSt}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} style={{ ...mInputSt, resize: 'vertical', fontFamily: "'Poppins',sans-serif" }} />
                  ) : (
                    <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} required={f.key === 'nome' || f.key === 'desc'} style={mInputSt} />
                  )}
                  {f.tip && (
                    <p style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'rgba(168,85,247,.8)', fontFamily: "'Poppins',sans-serif", lineHeight: 1.5 }}>{f.tip}</p>
                  )}
                  {/* Preview da imagem se URL preenchida */}
                  {f.key === 'imagem' && form.imagem && (
                    <img src={form.imagem} alt="preview"
                      style={{ marginTop: '0.5rem', width: '100%', height: 120, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(90,46,166,.3)' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={closeModal} style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '0.7rem', color: 'rgba(255,255,255,.6)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!form.nome || !form.desc} style={{
                  flex: 2, background: !form.nome || !form.desc ? 'rgba(90,46,166,.3)' : 'linear-gradient(135deg,#5A2EA6,#2D6BFF)',
                  border: 'none', borderRadius: 6, padding: '0.7rem',
                  color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                }}>
                  {modal === 'add' ? 'Adicionar projeto' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnEdit = { background: 'rgba(90,46,166,.2)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 5, padding: '0.35rem 0.8rem', color: '#a855f7', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all .2s' }
const btnDel  = { background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 5, padding: '0.35rem 0.8rem', color: '#f87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', transition: 'all .2s' }
const mLabelSt = { display: 'block', fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: '0.35rem' }
const mInputSt = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }
