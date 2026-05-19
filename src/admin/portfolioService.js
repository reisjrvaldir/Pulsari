/* ── Serviço de portfólio — Supabase via API Vercel ── */
import { getToken } from './auth'

const API = import.meta.env.VITE_API_URL || '/api'
const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-token': getToken() })

export const CATS = {
  sites:     { label: 'Sites',       color: '#5A2EA6' },
  landing:   { label: 'Landpages',   color: '#FF2D8D' },
  ecommerce: { label: 'E-commerce',  color: '#2D6BFF' },
  sistemas:  { label: 'Sistemas',    color: '#10b981' },
}

/* ── Leitura ── */
export const getPortfolio = async () => {
  try {
    const res = await fetch(`${API}/portfolio`)
    if (!res.ok) throw new Error('falha')
    return await res.json()
  } catch {
    return { sites: [], landing: [], ecommerce: [], sistemas: [] }
  }
}

/* ── Upload de imagem ── */
export const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const res = await fetch(`${API}/portfolio-upload`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            base64: e.target.result,
            filename: file.name,
            contentType: file.type,
          }),
        })
        const body = await res.json()
        if (!res.ok) throw new Error(body.error || 'Falha no upload')
        resolve(body.url)
      } catch (err) { reject(err) }
    }
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}

/* ── Criar projeto ── */
export const addProject = async (category, project) => {
  const res = await fetch(`${API}/portfolio`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ ...project, category }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao criar projeto')
  return body
}

/* ── Atualizar projeto ── */
export const updateProject = async (project) => {
  const res = await fetch(`${API}/portfolio`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(project),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao atualizar projeto')
  return body
}

/* ── Remover projeto ── */
export const deleteProject = async (id) => {
  const res = await fetch(`${API}/portfolio`, {
    method: 'DELETE',
    headers: headers(),
    body: JSON.stringify({ id }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao remover projeto')
  return body
}
