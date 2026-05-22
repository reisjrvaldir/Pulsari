import { useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from './categoriesService'

const PRESET_COLORS = [
  '#5A2EA6', '#FF2D8D', '#2D6BFF', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
]

export default function AdminCategories({ theme: t, cats, onRefresh }) {
  const [newLabel, setNewLabel]   = useState('')
  const [newColor, setNewColor]   = useState('#5A2EA6')
  const [saving,   setSaving]     = useState(false)
  const [editId,   setEditId]     = useState(null)
  const [editLabel,setEditLabel]  = useState('')
  const [editColor,setEditColor]  = useState('')
  const [error,    setError]      = useState(null)
  const [success,  setSuccess]    = useState(null)

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2500) }

  /* ── Criar ── */
  const handleCreate = async () => {
    if (!newLabel.trim()) return
    setSaving(true); setError(null)
    try {
      await createCategory(newLabel.trim(), newColor)
      setNewLabel(''); setNewColor('#5A2EA6')
      await onRefresh()
      flash('Categoria criada!')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  /* ── Salvar edição ── */
  const handleSaveEdit = async () => {
    if (!editLabel.trim()) return
    setSaving(true); setError(null)
    try {
      await updateCategory(editId, editLabel.trim(), editColor)
      setEditId(null)
      await onRefresh()
      flash('Categoria atualizada!')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  /* ── Excluir ── */
  const handleDelete = async (id, label) => {
    if (!window.confirm(`Excluir a categoria "${label}"? Projetos vinculados precisam ser removidos primeiro.`)) return
    setSaving(true); setError(null)
    try {
      await deleteCategory(id)
      await onRefresh()
      flash('Categoria excluída!')
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: t.fg, marginBottom: '0.3rem' }}>Categorias</h1>
        <p style={{ color: t.fgMuted, fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem' }}>
          Gerencie os tipos de serviço exibidos no portfólio
        </p>
      </div>

      {/* Mensagens */}
      {error   && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171', fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#10b981', fontFamily: "'Poppins',sans-serif", fontSize: '0.85rem' }}>✓ {success}</div>}

      {/* ── Lista de categorias ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '2rem' }}>
        {cats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: t.fgSubtle, fontFamily: "'Poppins',sans-serif" }}>
            Nenhuma categoria. Crie a primeira abaixo.
          </div>
        )}
        {cats.map(cat => (
          <div key={cat.id} style={{
            background: t.itemBg, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: '1rem 1.2rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            {/* Bolinha de cor */}
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />

            {editId === cat.id ? (
              /* Modo edição inline */
              <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  style={{ ...inputSt, flex: 1, minWidth: 140 }}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  autoFocus
                />
                {/* Seletor de cor */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setEditColor(c)} style={{
                      width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                      outline: editColor === c ? `2px solid #fff` : 'none', outlineOffset: 1,
                    }} />
                  ))}
                </div>
                <button onClick={handleSaveEdit} disabled={saving} style={btnSave}>Salvar</button>
                <button onClick={() => setEditId(null)} style={btnCancel}>✕</button>
              </div>
            ) : (
              /* Modo visualização */
              <>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: t.fg }}>{cat.label}</span>
                  <span style={{ marginLeft: '0.6rem', fontSize: '0.72rem', color: t.fgMuted, fontFamily: "'Poppins',sans-serif" }}>
                    /{cat.key}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => { setEditId(cat.id); setEditLabel(cat.label); setEditColor(cat.color) }}
                    style={btnEdit}>Editar</button>
                  <button onClick={() => handleDelete(cat.id, cat.label)} disabled={saving}
                    style={btnDel}>Excluir</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Criar nova categoria ── */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.border}`,
        borderRadius: 12, padding: '1.5rem',
      }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: t.fg, marginBottom: '1.2rem' }}>
          + Nova categoria
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelSt}>Nome da categoria *</label>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Ex: Apps Mobile, Identidade Visual..."
              style={inputSt}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div>
            <label style={labelSt}>Cor de destaque</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setNewColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c,
                  border: 'none', cursor: 'pointer', flexShrink: 0,
                  outline: newColor === c ? `3px solid #fff` : '2px solid transparent',
                  outlineOffset: 2, transition: 'outline .15s',
                }} />
              ))}
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: 'none' }}
                title="Cor personalizada"
              />
              <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: '0.78rem', color: t.fgMuted }}>
                {newColor}
              </span>
            </div>
          </div>

          {/* Preview */}
          {newLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: t.fgMuted, fontFamily: "'Poppins',sans-serif" }}>Preview:</span>
              <span style={{
                background: newColor, color: '#fff', borderRadius: 6,
                padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.8rem',
              }}>{newLabel}</span>
            </div>
          )}

          <button onClick={handleCreate} disabled={saving || !newLabel.trim()} style={{
            alignSelf: 'flex-start',
            background: saving || !newLabel.trim() ? 'rgba(90,46,166,.3)' : 'linear-gradient(135deg,#5A2EA6,#2D6BFF)',
            border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem',
            color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
            cursor: saving || !newLabel.trim() ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}>
            {saving ? 'Criando...' : '+ Criar categoria'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelSt = { display: 'block', fontFamily: "'Poppins',sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(168,85,247,.8)', marginBottom: '0.4rem' }
const inputSt  = { width: '100%', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(90,46,166,.4)', borderRadius: 6, padding: '0.6rem 0.85rem', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }
const btnEdit   = { background: 'rgba(90,46,166,.2)', border: '1px solid rgba(90,46,166,.3)', borderRadius: 5, padding: '0.3rem 0.75rem', color: '#a855f7', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }
const btnDel    = { background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 5, padding: '0.3rem 0.75rem', color: '#f87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }
const btnSave   = { background: 'linear-gradient(135deg,#5A2EA6,#2D6BFF)', border: 'none', borderRadius: 5, padding: '0.3rem 0.85rem', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }
const btnCancel = { background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 5, padding: '0.3rem 0.6rem', color: 'rgba(255,255,255,.5)', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }
