import { getToken } from './auth'

const API = import.meta.env.VITE_API_URL || '/api'

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-token': getToken() })

/* Envia formulário (sem auth — público) */
export const sendMessage = async (data) => {
  const res = await fetch(`${API}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('sendMessage failed:', res.status, body)
    throw new Error(body.error || `Falha ao enviar (${res.status})`)
  }
  return body
}

/* Lista todas as mensagens */
export const getMessages = async () => {
  const res = await fetch(`${API}/messages`, { headers: headers() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    console.error('getMessages failed:', res.status, body)
    throw new Error(body.error || 'Não autorizado')
  }
  return res.json()
}

/* Contagem de não lidas */
export const getUnreadCount = async () => {
  const res = await fetch(`${API}/messages/unread-count`, { headers: headers() })
  if (!res.ok) return 0
  const { count } = await res.json()
  return count
}

/* Marcar como lida */
export const markRead = (id) =>
  fetch(`${API}/messages/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ read: true }) })

/* Apagar */
export const deleteMessage = (id) =>
  fetch(`${API}/messages/${id}`, { method: 'DELETE', headers: headers() })
