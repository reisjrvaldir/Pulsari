/**
 * Cliente da API do CRM.
 *
 * Espelha a matriz de status do servidor. A ordem aqui é a ordem das colunas
 * no quadro — mudar uma sem a outra deixaria o funil fora de sequência.
 */

export const STATUS_LEAD = [
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost',
] as const

export type StatusLead = (typeof STATUS_LEAD)[number]

export const ROTULO_STATUS: Record<StatusLead, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  proposal: 'Proposta',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
}

/** Cor da faixa no topo de cada coluna. */
export const COR_COLUNA: Record<StatusLead, string> = {
  new: 'bg-ink/20',
  contacted: 'bg-blue-400',
  qualified: 'bg-indigo-400',
  proposal: 'bg-brand-violet',
  negotiation: 'bg-amber-400',
  won: 'bg-green-500',
  lost: 'bg-red-300',
}

export interface Lead {
  id: string
  name: string
  company_name: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  source: string
  source_detail: string | null
  service_interest: string | null
  estimated_value: string | null
  score: number
  status: StatusLead
  owner_id: string | null
  owner_name: string | null
  notes: string | null
  last_contact_at: string | null
  next_contact_at: string | null
  board_position: number
  converted_client_id: string | null
  created_at: string
}

export interface Atividade {
  id: string
  type: string
  description: string | null
  from_value: string | null
  to_value: string | null
  created_at: string
  user_name: string | null
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
    if (!res.ok) return { ok: false, erro: (corpo.error as string) ?? 'Operação não concluída.' }
    return { ok: true, dados: corpo as T }
  } catch {
    return { ok: false, erro: 'Falha de conexão.' }
  }
}

export function listarLeads(filtros: { q?: string; owner?: string; atrasados?: boolean } = {}) {
  const p = new URLSearchParams()
  if (filtros.q) p.set('q', filtros.q)
  if (filtros.owner) p.set('owner', filtros.owner)
  if (filtros.atrasados) p.set('atrasados', '1')
  const qs = p.toString()
  return pedir<{ leads: Lead[] }>(`/api/leads${qs ? `?${qs}` : ''}`)
}

export const criarLead = (dados: Record<string, unknown>) =>
  pedir<{ lead: Lead }>('/api/leads', { method: 'POST', body: JSON.stringify(dados) })

export const salvarLead = (id: string, dados: Record<string, unknown>) =>
  pedir<{ lead: Lead }>(`/api/leads/${id}`, { method: 'PATCH', body: JSON.stringify(dados) })

/**
 * Mover para "Ganho" converte em cliente no servidor — por isso a resposta
 * pode trazer o cliente criado. Não há caminho que marque um lead como ganho
 * sem o cliente correspondente existir.
 */
export const moverLead = (id: string, status: StatusLead, position?: number) =>
  pedir<{ lead: Lead; client?: { id: string; name: string }; convertido?: boolean }>(
    `/api/leads/${id}/move`,
    { method: 'PATCH', body: JSON.stringify({ status, position }) },
  )

export const listarAtividades = (id: string) =>
  pedir<{ activities: Atividade[] }>(`/api/leads/${id}/activities`)

export const registrarAtividade = (
  id: string,
  dados: { type: 'note' | 'contact'; description: string; next_contact_at?: string },
) =>
  pedir<{ activities: Atividade[]; lead: Lead }>(`/api/leads/${id}/activities`, {
    method: 'POST',
    body: JSON.stringify(dados),
  })

export function moeda(valor: string | null | undefined): string {
  if (valor == null) return '—'
  const n = Number(valor)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Follow-up vencido é o que a equipe precisa enxergar primeiro. */
export function atrasado(lead: Lead): boolean {
  if (!lead.next_contact_at) return false
  return new Date(lead.next_contact_at) < new Date()
}

export const ROTULO_ATIVIDADE: Record<string, string> = {
  created: 'Lead criado',
  status_changed: 'Fase alterada',
  owner_changed: 'Responsável alterado',
  note: 'Anotação',
  contact: 'Contato registrado',
  follow_up_scheduled: 'Follow-up agendado',
  message_received: 'Mensagem recebida',
  converted: 'Convertido em cliente',
  updated: 'Dados atualizados',
}
