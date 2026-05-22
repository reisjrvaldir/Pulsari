import { getToken } from './auth'

const API = import.meta.env.VITE_API_URL || '/api'
const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-token': getToken() })

export const getCategories = async () => {
  const res = await fetch(`${API}/categories`)
  if (!res.ok) throw new Error('Falha ao carregar categorias')
  return res.json()
}

export const createCategory = async (label, color) => {
  const res = await fetch(`${API}/categories`, {
    method: 'POST', headers: headers(),
    body: JSON.stringify({ label, color }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao criar categoria')
  return body
}

export const updateCategory = async (id, label, color) => {
  const res = await fetch(`${API}/categories`, {
    method: 'PUT', headers: headers(),
    body: JSON.stringify({ id, label, color }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao atualizar')
  return body
}

export const deleteCategory = async (id) => {
  const res = await fetch(`${API}/categories`, {
    method: 'DELETE', headers: headers(),
    body: JSON.stringify({ id }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Falha ao excluir')
  return body
}
