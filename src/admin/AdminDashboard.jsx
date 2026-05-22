import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from './auth'
import { getPortfolio, addProject, updateProject, deleteProject, uploadImage } from './portfolioService'
import { getCategories, createCategory, updateCategory, deleteCategory } from './categoriesService'
import { getUnreadCount } from './messagesService'
import AdminMessages from './AdminMessages'
import AdminCategories from './AdminCategories'

const EMPTY_FORM = { nome: '', desc: '', context: '', tags: '', link: '', imagem: '', linkSistema: '' }

export default function AdminDashboard() {
  const nav = useNavigate()
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.body.style.cursor = 'auto'
    return () => { document.body.style.cursor = '' }
  }, [])

  const [tab,        setTab]        = useState('portfolio')
  const [unread,     setUnread]     = useState(0)
  const [darkMode,   setDarkMode]   = useState(true)
  const [data,       setData]       = useState({})
  const [cats,       setCats]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeCat,  setActiveCat]  = useState(null)
  const [modal,      setModal]      = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState(null)
  const [imgPreview, setImgPreview] = useState(null)

  const DEFAULT_CATS = [
    { key: 'sites',     label: 'Sites',       color: '#5A2EA6' },
    { key: 'landing',   label: 'Landpages',   color: '#FF2D8D' },
    { key: 'ecommerce', label: 'E-commerce',  color: '#2D6BFF' },
    { key: 'sistemas',  label: 'Sistemas',    color: '#10b981' },
  ]

  /* Carrega categorias + projetos do Supabase */
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      /* Carrega em paralelo, com fallback individual */
      const [catsResult, portfolioResult] = await Promise.allSettled([
        getCategories(),
        getPortfolio(),
      ])

      const categories = catsResult.status === 'fulfilled' && catsResult.value.length > 0
        ? catsResult.value
        : DEFAULT_CATS

      const portfolio = portfolioResult.status === 'fulfilled'
        ? portfolioResult.value
        : {}

      setCats(categories)
      setData(portfolio)
      if (!activeCat && categories.length > 0) setActiveCat(categories[0].key)

      if (catsResult.status === 'rejected') {
        setError('⚠️ Categorias usando padrão — execute supabase-categories-setup.sql no Supabase')
      }
    } catch (e) {
      setError('Erro ao carregar dados: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleLogout = () => { logout(); nav('/admin/login') }

  const openAdd  = () => { setForm(EMPTY_FORM); setImgPreview(null); setModal('add') }
  const openEdit = p  => {
    setForm({ ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : '' })
    setImgPreview(p.imagem || null)
    setModal({ id: p.id })
  }
  const closeModal = () => { setModal(null); setForm(EMPTY_FORM); setImgPreview(null); setError(null) }

  /* ── Upload de imagem ── */
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande. Máx: 5 MB.'); return }

    /* Preview local imediato */
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(file)

    setUploading(true)
    setError(null)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, imagem: url }))
      setImgPreview(url)
    } catch (e) {
      setError('Falha no upload: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  /* ── Salvar projeto ── */
  const handleSave = async () => {
    if (!form.nome || !form.desc) return
    setSaving(true)
    setError(null)
    try {
      const project = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (modal === 'add') {
        await addProject(activeCat, project)
      } else {
        await updateProject({ ...project, id: modal.id, category: activeCat })
      }
      await loadData()
      closeModal()
      flash()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Remover projeto ── */
  const handleDelete = async (id) => {
    if (!window.confirm('Remover este projeto?')) return
    try {
      await deleteProject(id)
      await loadData()
      flash()
    } catch (e) {
      setError(e.message)
    }
  }

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  /* Polling mensagens */
  useEffect(() => {
    const poll = async () => { try { setUnread(await getUnreadCount()) } catch {} }
    poll()
    const t = setInterval(poll, 30000)
    return () => clearInterval(t)
  }, [])

  const projects = data[activeCat] || []

  const t = {
    bg:         darkMode ? '#0A0812'               : '#f0eef8',
    fg:         darkMode ? '#fff'                  : '#1a0a2e',
    fgMuted:    darkMode ? 'rgba(255,255,255,.45)' : 'rgba(26,10,46,.55)',
    fgSubtle:   darkMode ? 'rgba(255,255,255,.25)' : 'rgba(26,10,46,.3)',
    cardBg:     darkMode ? 'rgba(30,11,46,.95)'    : '#fff',
    border:     darkMode ? 'rgba(90,46,166,.3)'    : 'rgba(90,46,166,.25)',
    itemBg:     darkMode ? 'rgba(255,255,255,.04)' : 'rgba(90,46,166,.04)',
    catBtn:     darkMode ? 'rgba(255,255,255,.06)' : 'rgba(90,46,166,.08)',
    catBtnText: darkMode ? 'rgba(255,255,255,.5)'  : 'rgba(26,10,46,.5)',
    inputBg:    darkMode ? 'rgba(255,255,255,.05)' : '#f8f6ff',
    modalBg:    darkMode ? '#1a0b2e'               : '#fff',
    sairBorder: darkMode ? 'rgba(255,255,255,.15)' : 'rgba(26,10,46,.2)',
    sairColor:  darkMode ? 'rgba(255,255,255,.6)'  : 'rgba(26,10,46,.6)',
  }

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Montserrat',sans-serif", color: t.fg, transition: 'background .3s, color .3s' }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── Topbar ── */}
      <div style={{
        background: t.cardBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${t.border}`,
        padding: '0 2rem', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em', background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6,#2D6BFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PULSARI <span style={{ fontSize: '0.65rem', WebkitTextFillColor: t.fgMuted, background: 'none', letterSpacing: '0.2em' }}>ADMIN</span>
          </div>
          {[
            { key: 'portfolio',   label: 'Portfólio' },
            { key: 'categorias',  label: 'Categorias' },
            { key: 'mensagens',   label: 'Mensagens', badge: unread },
          ].map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.82rem',
              color: tab === tb.key ? '#a855f7' : t.fgMuted,
              borderBottom: `2px solid ${tab === tb.key ? '#a855f7' : 'transparent'}`,
              paddingBottom: '0.2rem', transition: 'all .2s',
              position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {tb.label}
              {tb.badge > 0 && (
                <span style={{ background: '#FF2D8D', borderRadius: 10, padding: '0.1rem 0.4rem', fontSize: '0.62rem', color: '#fff', fontWeight: 700 }}>{tb.badge}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => setDarkMode(v => !v)} title={darkMode ? 'Modo claro' : 'Modo escuro'} style={{
            background: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(90,46,166,.1)',
            border: `1px solid ${t.border}`, borderRadius: 6,
            padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '1rem',
          }}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <a href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(90,46,166,.15)', border: '1px solid rgba(90,46,166,.4)',
            borderRadius: 6, padding: '0.4rem 0.9rem',
            color: '#a855f7', fontSize: '0.78rem', letterSpacing: '0.08em',
            textDecoration: 'none', textTransform: 'uppercase', fontWeight: 600,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar ao site
          </a>
          <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${t.sairBorder}`, borderRadius: 6, padding: '0.4rem 0.9rem', color: t.sairColor, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Sair
          </button>
        </div>
      </div>

      {/* ── Aba Mensagens ── */}
      {tab === 'mensagens' && <AdminMessages theme={t} />}

      {/* ── Aba Categorias ── */}
      {tab === 'categorias' && (
        <AdminCategories
          theme={t}
          cats={cats}
          onRefresh={loadData}
        />
      )}

      {/* ── Aba Portfólio ── */}
      {tab === 'portfolio' && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.3rem', color: t.fg }}>Portfólio</h1>
            <p style={{ color: t.fgMuted, fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem' }}>
              Gerencie os projetos exibidos no site
            </p>
          </div>

          {/* Tabs de categoria (dinâmicas) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {cats.map(({ key, label, color }) => (
              <button key={key} onClick={() => setActiveCat(key)} translate="no" style={{
                padding: '0.5rem 1.2rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.06em',
                background: activeCat === key ? color : t.catBtn,
                color: activeCat === key ? '#fff' : t.catBtnText,
                transition: 'all .2s',
              }}>
                <span translate="no">{label}</span>{' '}
                <span translate="no" style={{ opacity: .7 }}>({(data[key] || []).length})</span>
              </button>
            ))}
            <button onClick={() => setTab('categorias')} style={{
              padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer',
              background: 'none', border: `1px dashed ${t.border}`,
              color: t.fgMuted, fontFamily: 'inherit', fontSize: '0.8rem',
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#a855f7'; e.currentTarget.style.color='#a855f7' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=t.border; e.currentTarget.style.color=t.fgMuted }}
            >+ Nova categoria</button>
          </div>

          {/* Barra de ações */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ color: t.fgMuted, fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>
              {loading ? 'Carregando...' : `${projects.length} projeto${projects.length !== 1 ? 's' : ''} em `}
              {!loading && activeCat && (() => {
                const cat = cats.find(c => c.key === activeCat)
                return cat ? <strong style={{ color: cat.color }}>{cat.label}</strong> : null
              })()}
            </span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {saved && <span style={{ color: '#10b981', fontSize: '0.78rem', fontFamily: "'Poppins',sans-serif" }}>✓ Salvo</span>}
              {error && <span style={{ color: '#f87171', fontSize: '0.78rem', fontFamily: "'Poppins',sans-serif", maxWidth: 300 }}>{error}</span>}
              <button onClick={loadData} style={{ background: t.catBtn, border: `1px solid ${t.border}`, borderRadius: 6, padding: '0.45rem 0.9rem', color: t.fgMuted, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
                ↻ Atualizar
              </button>
              <button onClick={openAdd} style={{
                background: 'linear-gradient(135deg,#FF2D8D,#5A2EA6)',
                border: 'none', borderRadius: 6, padding: '0.55rem 1.2rem',
                color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              }}>+ Adicionar projeto</button>
            </div>
          </div>

          {/* Lista de projetos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: t.fgSubtle, fontFamily: "'Poppins',sans-serif" }}>
                Carregando projetos...
              </div>
            )}
            {!loading && projects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: t.fgSubtle, fontFamily: "'Poppins',sans-serif" }}>
                Nenhum projeto nesta categoria. Clique em "+ Adicionar".
              </div>
            )}
            {projects.map(p => (
              <div key={p.id} style={{
                background: t.itemBg, border: `1px solid ${t.border}`,
                borderRadius: 8, padding: '1.1rem 1.4rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
              }}>
                {/* Thumbnail */}
                <div style={{
                  width: 56, height: 56, borderRadius: 6, flexShrink: 0,
                  overflow: 'hidden', background: 'rgba(90,46,166,.2)',
                  border: `1px solid ${t.border}`,
                }}>
                  {p.imagem
                    ? <img src={p.imagem} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🖼️</div>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: t.fg }}>{p.nome}</div>
                  <div style={{ color: t.fgMuted, fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif", marginBottom: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {(Array.isArray(p.tags) ? p.tags : []).map(tag => (
                      <span key={tag} style={{ background: 'rgba(90,46,166,.2)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 4, padding: '0.15rem 0.5rem', fontSize: '0.68rem', color: '#a855f7', fontFamily: "'Poppins',sans-serif" }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={btnEdit}>Editar</button>
                  <button onClick={() => handleDelete(p.id)} style={btnDel}>Remover</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal add/edit ── */}
      {modal !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,18,.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{
            background: t.modalBg, border: `1px solid ${t.border}`,
            borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: t.fg }}>
                {modal === 'add' ? '+ Novo projeto' : '✎ Editar projeto'}
                {activeCat && (() => {
                  const cat = cats.find(c => c.key === activeCat)
                  return cat ? <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: cat.color, letterSpacing: '0.1em' }}>{cat.label}</span> : null
                })()}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: t.fgMuted, fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 6, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: '0.82rem', fontFamily: "'Poppins',sans-serif" }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Campos de texto */}
              {[
                { key: 'nome',        label: 'Nome do projeto *',                    placeholder: 'Ex: Site Empresa X',                   type: 'text' },
                { key: 'desc',        label: 'Descrição curta *',                    placeholder: 'Uma linha sobre o resultado alcançado', type: 'text' },
                { key: 'context',     label: 'Contexto / Detalhes',                  placeholder: 'Desafio, solução, impacto...',          type: 'textarea' },
                { key: 'tags',        label: 'Tecnologias (separadas por vírgula)',   placeholder: 'React, Node.js, MongoDB',              type: 'text' },
                { key: 'linkSistema', label: 'Link do sistema (clique na imagem)',    placeholder: 'https://sistema.com.br',               type: 'url' },
                { key: 'link',        label: 'Link externo (botão "Visitar projeto")',placeholder: 'https://...',                          type: 'url' },
              ].map(f => (
                <div key={f.key}>
                  <label style={mLabelSt}>{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea rows={3} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder} style={{ ...mInputSt, resize: 'vertical', fontFamily: "'Poppins',sans-serif" }} />
                  ) : (
                    <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder} style={mInputSt} />
                  )}
                </div>
              ))}

              {/* ── Upload de imagem ── */}
              <div>
                <label style={mLabelSt}>Imagem de capa</label>

                {/* Preview */}
                {imgPreview && (
                  <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                    <img src={imgPreview} alt="preview"
                      style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: `1px solid ${t.border}` }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                    <button onClick={() => { setImgPreview(null); setForm(f => ({ ...f, imagem: '' })) }}
                      style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(239,68,68,.85)', border: 'none', borderRadius: 4,
                        color: '#fff', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                      }}>✕ Remover</button>
                    {uploading && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(10,8,18,.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8, color: '#a855f7', fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem',
                      }}>Enviando...</div>
                    )}
                  </div>
                )}

                {/* Botões de upload + URL manual */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: uploading ? 'rgba(90,46,166,.2)' : 'rgba(90,46,166,.3)',
                      border: '1px solid rgba(90,46,166,.5)', borderRadius: 6,
                      padding: '0.6rem 1rem', color: '#a855f7',
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.82rem',
                      cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      transition: 'all .2s',
                    }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {uploading ? 'Enviando...' : '↑ Upload'}
                  </button>
                  <input
                    type="url"
                    value={form.imagem || ''}
                    onChange={e => { setForm({ ...form, imagem: e.target.value }); setImgPreview(e.target.value || null) }}
                    placeholder="ou cole uma URL"
                    style={{ ...mInputSt, flex: 1 }}
                  />
                </div>
                <p style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: 'rgba(168,85,247,.7)', fontFamily: "'Poppins',sans-serif" }}>
                  📐 Ideal: 800×450 px · JPG/WebP · máx. 5 MB
                </p>
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={closeModal} disabled={saving} style={{ flex: 1, background: 'rgba(255,255,255,.06)', border: `1px solid ${t.border}`, borderRadius: 6, padding: '0.7rem', color: t.fgMuted, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving || uploading || !form.nome || !form.desc} style={{
                  flex: 2, borderRadius: 6, padding: '0.7rem', border: 'none',
                  background: (saving || uploading || !form.nome || !form.desc) ? 'rgba(90,46,166,.3)' : 'linear-gradient(135deg,#5A2EA6,#2D6BFF)',
                  color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                }}>
                  {saving ? 'Salvando...' : modal === 'add' ? 'Adicionar projeto' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const btnEdit = { background: 'rgba(90,46,166,.2)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 5, padding: '0.35rem 0.8rem', color: '#a855f7', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }
const btnDel  = { background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 5, padding: '0.35rem 0.8rem', color: '#f87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }
const mLabelSt = { display: 'block', fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(168,85,247,.8)', marginBottom: '0.35rem' }
const mInputSt = { width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(90,46,166,.4)', borderRadius: 6, padding: '0.65rem 0.85rem', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }
