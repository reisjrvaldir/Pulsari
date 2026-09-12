export const STATUS_PROSPECT = [
  'new', 'researching', 'contacted', 'interested', 'converted', 'discarded',
] as const

export type StatusProspect = (typeof STATUS_PROSPECT)[number]

export const ROTULO_STATUS: Record<StatusProspect, string> = {
  new: 'Novo',
  researching: 'Pesquisando',
  contacted: 'Contatado',
  interested: 'Interessado',
  converted: 'Convertido',
  discarded: 'Descartado',
}

export const ORIGENS = ['indicacao', 'evento', 'inbound', 'pesquisa', 'lista', 'outro'] as const

export const ROTULO_ORIGEM: Record<string, string> = {
  indicacao: 'Indicação',
  evento: 'Evento',
  inbound: 'Procurou a Pulsari',
  pesquisa: 'Pesquisa',
  lista: 'Lista',
  outro: 'Outro',
}

export interface FatorScore {
  codigo: string
  rotulo: string
  pontos: number
  atendido: boolean
}

export interface Prospect {
  id: string
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  website: string | null
  social: string | null
  source: string
  segment: string | null
  city: string | null
  status: StatusProspect
  owner_id: string | null
  notes: string | null
  next_contact_at: string | null
  last_contact_at: string | null
  converted_lead_id: string | null
  score: number
  created_at: string
  score_detalhe: { total: number; fatores: FatorScore[]; faltando: FatorScore[] }
}

export interface ResultadoImportacao {
  total: number
  importados: number
  duplicados: number
  invalidos: number
  erros: { linha: number; motivo: string }[]
  colunas_reconhecidas: string[]
}

const BASE: RequestInit = {
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json' },
}

async function pedir<T>(url: string, init?: RequestInit): Promise<
  { ok: true; dados: T } | { ok: false; erro: string; corpo?: Record<string, unknown> }
> {
  try {
    const res = await fetch(url, { ...BASE, ...init })
    const corpo = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, erro: (corpo.error as string) ?? 'Operação não concluída.', corpo }
    return { ok: true, dados: corpo as T }
  } catch {
    return { ok: false, erro: 'Falha de conexão.' }
  }
}

export function listarProspects(f: { q?: string; status?: string; score?: number; atrasados?: boolean } = {}) {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.status) p.set('status', f.status)
  if (f.score) p.set('score', String(f.score))
  if (f.atrasados) p.set('atrasados', '1')
  const qs = p.toString()
  return pedir<{ prospects: Prospect[] }>(`/api/prospects${qs ? `?${qs}` : ''}`)
}

export const criarProspect = (dados: Record<string, unknown>) =>
  pedir<{ prospect: Prospect; aviso?: { mensagem: string } }>('/api/prospects', {
    method: 'POST', body: JSON.stringify(dados),
  })

export const salvarProspect = (id: string, dados: Record<string, unknown>) =>
  pedir<{ prospect: Prospect }>(`/api/prospects/${id}`, {
    method: 'PATCH', body: JSON.stringify(dados),
  })

export const converterProspect = (id: string) =>
  pedir<{ jaConvertido: boolean; leadCriado: boolean; leadId: string; prospect: Prospect }>(
    `/api/prospects/${id}/convert`, { method: 'POST' },
  )

export const importarCsv = (csv: string, source: string, filename?: string) =>
  pedir<ResultadoImportacao>('/api/prospects/import', {
    method: 'POST', body: JSON.stringify({ csv, source, filename }),
  })

/** Faixa do score, para dar leitura rápida ao número. */
export function faixaScore(score: number): { rotulo: string; classe: string } {
  if (score >= 70) return { rotulo: 'Quente', classe: 'bg-green-100 text-green-800' }
  if (score >= 40) return { rotulo: 'Morno', classe: 'bg-amber-100 text-amber-800' }
  return { rotulo: 'Frio', classe: 'bg-ink/5 text-ink-soft' }
}
