/**
 * Cliente da API de propostas.
 *
 * Valores monetários trafegam como string do começo ao fim — é assim que o
 * `NUMERIC` do Postgres chega, e converter para Number reintroduziria o erro
 * de ponto flutuante que o tipo existe para evitar. A interface formata para
 * exibir; somar é sempre trabalho do banco.
 */

export interface ItemProposta {
  id?: string
  description: string
  quantity: string
  unit_price: string
  line_total?: string
}

export interface Proposta {
  id: string
  title: string
  presentation: string | null
  scope: string | null
  deliverables: string | null
  timeline: string | null
  internal_notes: string | null
  discount: string
  valid_until: string | null
  status: string
  public_token: string
  client_id: string | null
  client_name: string | null
  items_total: string
  items: ItemProposta[]
  sent_at: string | null
  first_viewed_at: string | null
  accepted_at: string | null
  accepted_by: string | null
  accepted_total: string | null
}

export interface ResumoProposta {
  id: string
  title: string
  status: string
  client_name: string | null
  items_total: string
  accepted_total: string | null
  valid_until: string | null
  view_count: string
  created_at: string
}

const BASE: RequestInit = {
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
}

async function pedir<T>(url: string, init?: RequestInit): Promise<
  { ok: true; dados: T } | { ok: false; erro: string }
> {
  try {
    const res = await fetch(url, { ...BASE, ...init })
    const corpo = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      return { ok: false, erro: (corpo.error as string) ?? 'Não foi possível completar a operação.' }
    }
    return { ok: true, dados: corpo as T }
  } catch {
    return { ok: false, erro: 'Falha de conexão.' }
  }
}

export const listarPropostas = (status?: string) =>
  pedir<{ proposals: ResumoProposta[] }>(
    `/api/proposals${status ? `?status=${encodeURIComponent(status)}` : ''}`,
  )

export const obterProposta = (id: string) =>
  pedir<{ proposal: Proposta }>(`/api/proposals/${id}`)

export const criarProposta = (dados: Record<string, unknown>) =>
  pedir<{ proposal: Proposta }>('/api/proposals', {
    method: 'POST',
    body: JSON.stringify(dados),
  })

export const salvarProposta = (id: string, dados: Record<string, unknown>) =>
  pedir<{ proposal: Proposta }>(`/api/proposals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  })

/** Substitui a lista inteira: o formulário edita linhas e salva o conjunto. */
export const salvarItens = (id: string, items: ItemProposta[]) =>
  pedir<{ items: ItemProposta[] }>(`/api/proposals/${id}/items`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  })

export const enviarProposta = (id: string) =>
  pedir<{ proposal: Proposta; url: string }>(`/api/proposals/${id}/send`, {
    method: 'POST',
  })

/** Só formata. Nenhuma conta acontece aqui. */
export function moeda(valor: string | null | undefined): string {
  if (valor == null) return '—'
  const n = Number(valor)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const ROTULO_STATUS: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Visualizada',
  accepted: 'Aceita',
  rejected: 'Recusada',
  expired: 'Vencida',
  paid: 'Paga',
}

export const COR_STATUS: Record<string, string> = {
  draft: 'bg-ink/5 text-ink-soft',
  sent: 'bg-blue-50 text-blue-700',
  viewed: 'bg-amber-50 text-amber-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-ink/5 text-ink-soft',
  paid: 'bg-green-100 text-green-800',
}
