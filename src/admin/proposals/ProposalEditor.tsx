import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Plus, Send, Trash2 } from 'lucide-react'
import {
  COR_STATUS, ROTULO_STATUS, criarProposta, enviarProposta, moeda,
  obterProposta, salvarItens, salvarProposta,
  type ItemProposta, type Proposta,
} from './proposalsClient'

interface ClienteResumo { id: string; name: string; company_name: string | null }

const CAMPOS_TEXTO = [
  ['presentation', 'Apresentação', 'Como você abre a conversa com este cliente.'],
  ['scope', 'Escopo', 'O que está incluído — e, quando útil, o que não está.'],
  ['deliverables', 'Entregáveis', 'O que o cliente recebe, item a item.'],
  ['timeline', 'Prazo', 'Etapas e datas.'],
] as const

function Campo({ label, ajuda, children }: { label: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">{label}</span>
      {ajuda && <span className="block text-xs text-ink-soft mt-1">{ajuda}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

const entrada =
  'w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-violet disabled:opacity-60'

export function ProposalEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const criando = !id || id === 'new'

  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [clientes, setClientes] = useState<ClienteResumo[]>([])
  const [itens, setItens] = useState<ItemProposta[]>([
    { description: '', quantity: '1', unit_price: '0' },
  ])

  const [form, setForm] = useState<Record<string, string>>({
    title: '', client_id: '', presentation: '', scope: '',
    deliverables: '', timeline: '', internal_notes: '', discount: '0', valid_until: '',
  })

  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [urlPublica, setUrlPublica] = useState<string | null>(null)

  // Depois de enviada, o cliente está lendo: nada aqui pode mudar sem antes
  // devolver a proposta a rascunho. A trava real está no banco; isto é a
  // tradução dela para a tela.
  const rascunho = criando || proposta?.status === 'draft'

  useEffect(() => {
    fetch('/api/clients', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { clients: [] }))
      .then((d: { clients?: ClienteResumo[] }) => setClientes(d.clients ?? []))
      .catch(() => setClientes([]))
  }, [])

  const carregar = useCallback(async () => {
    if (criando || !id) return
    const r = await obterProposta(id)
    if (!r.ok) { setErro(r.erro); return }
    const p = r.dados.proposal
    setProposta(p)
    setForm({
      title: p.title ?? '', client_id: p.client_id ?? '',
      presentation: p.presentation ?? '', scope: p.scope ?? '',
      deliverables: p.deliverables ?? '', timeline: p.timeline ?? '',
      internal_notes: p.internal_notes ?? '', discount: p.discount ?? '0',
      valid_until: p.valid_until ? p.valid_until.slice(0, 10) : '',
    })
    if (p.items.length > 0) setItens(p.items)
  }, [criando, id])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void carregar() }, [carregar])

  function alterar(campo: string, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function alterarItem(i: number, campo: keyof ItemProposta, valor: string) {
    setItens((lista) => lista.map((it, j) => (j === i ? { ...it, [campo]: valor } : it)))
  }

  /** Só para conferência na tela. O total que vale vem do banco. */
  const subtotalEstimado = itens.reduce(
    (soma, it) => soma + Number(it.quantity || 0) * Number(it.unit_price || 0),
    0,
  )

  async function salvar() {
    setErro(null); setAviso(null); setSalvando(true)
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        client_id: form.client_id || undefined,
        presentation: form.presentation, scope: form.scope,
        deliverables: form.deliverables, timeline: form.timeline,
        internal_notes: form.internal_notes,
        discount: Number(form.discount || 0),
        valid_until: form.valid_until || undefined,
      }

      const alvo = criando
        ? await criarProposta(payload)
        : await salvarProposta(id!, payload)
      if (!alvo.ok) { setErro(alvo.erro); return }

      const propostaId = alvo.dados.proposal.id
      const limpos = itens.filter((it) => it.description.trim() !== '')
      const ri = await salvarItens(propostaId, limpos)
      if (!ri.ok) { setErro(ri.erro); return }

      if (criando) { navigate(`/admin/proposals/${propostaId}`, { replace: true }); return }
      await carregar()
      setAviso('Proposta salva.')
    } finally {
      setSalvando(false)
    }
  }

  async function enviar() {
    if (!id) return
    setErro(null); setAviso(null); setSalvando(true)
    try {
      const r = await enviarProposta(id)
      if (!r.ok) { setErro(r.erro); return }
      setUrlPublica(r.dados.url)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <Link to="/admin/proposals" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-5">
        <ArrowLeft size={15} /> Propostas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
        <h1 className="font-display text-2xl font-bold text-ink">
          {criando ? 'Nova proposta' : form.title || 'Proposta'}
        </h1>
        {proposta && (
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${COR_STATUS[proposta.status] ?? ''}`}>
            {ROTULO_STATUS[proposta.status] ?? proposta.status}
          </span>
        )}
      </div>

      {!rascunho && (
        <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Esta proposta já foi enviada e o cliente pode estar com o link aberto.
          Para corrigir algo, devolva-a a rascunho antes.
        </p>
      )}

      {urlPublica && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800 mb-2">Link para enviar ao cliente</p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-[16rem] rounded-lg bg-white px-3 py-2 text-xs text-ink break-all">
              {urlPublica}
            </code>
            <button
              type="button"
              onClick={() => { void navigator.clipboard?.writeText(urlPublica) }}
              className="btn-outline-dark text-xs"
            >
              <Copy size={13} /> Copiar
            </button>
          </div>
        </div>
      )}

      {erro && <p role="alert" className="mb-5 text-sm text-red-600">{erro}</p>}
      {aviso && <p className="mb-5 text-sm text-green-700">{aviso}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-surface p-6 space-y-5">
            <Campo label="Título">
              <input className={entrada} disabled={!rascunho} value={form.title}
                     onChange={(e) => alterar('title', e.target.value)} />
            </Campo>
            <Campo label="Cliente">
              <select className={entrada} disabled={!rascunho} value={form.client_id}
                      onChange={(e) => alterar('client_id', e.target.value)}>
                <option value="">— sem cliente vinculado —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name ?? c.name}</option>
                ))}
              </select>
            </Campo>
            {CAMPOS_TEXTO.map(([campo, label, ajuda]) => (
              <Campo key={campo} label={label} ajuda={ajuda}>
                <textarea rows={4} className={entrada} disabled={!rascunho}
                          value={form[campo]} onChange={(e) => alterar(campo, e.target.value)} />
              </Campo>
            ))}
          </div>

          <div className="card-surface p-6">
            <h2 className="font-display font-semibold text-ink mb-4">Itens</h2>
            <div className="space-y-3">
              {itens.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                  <input className={`${entrada} col-span-6`} placeholder="Descrição" disabled={!rascunho}
                         value={item.description} onChange={(e) => alterarItem(i, 'description', e.target.value)} />
                  <input className={`${entrada} col-span-2 text-right`} type="number" min="0" step="0.001"
                         disabled={!rascunho} value={item.quantity}
                         onChange={(e) => alterarItem(i, 'quantity', e.target.value)} aria-label={`Quantidade do item ${i + 1}`} />
                  <input className={`${entrada} col-span-3 text-right`} type="number" min="0" step="0.01"
                         disabled={!rascunho} value={item.unit_price}
                         onChange={(e) => alterarItem(i, 'unit_price', e.target.value)} aria-label={`Valor unitário do item ${i + 1}`} />
                  <button type="button" disabled={!rascunho}
                          onClick={() => setItens((l) => l.filter((_, j) => j !== i))}
                          className="col-span-1 grid h-10 place-items-center text-ink/30 hover:text-red-600 disabled:opacity-40"
                          aria-label={`Remover item ${i + 1}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            {rascunho && (
              <button type="button" className="btn-outline-dark mt-4 text-xs"
                      onClick={() => setItens((l) => [...l, { description: '', quantity: '1', unit_price: '0' }])}>
                <Plus size={13} /> Adicionar item
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6 space-y-5">
            <Campo label="Desconto">
              <input className={entrada} type="number" min="0" step="0.01" disabled={!rascunho}
                     value={form.discount} onChange={(e) => alterar('discount', e.target.value)} />
            </Campo>
            <Campo label="Válida até">
              <input className={entrada} type="date" disabled={!rascunho}
                     value={form.valid_until} onChange={(e) => alterar('valid_until', e.target.value)} />
            </Campo>

            <div className="border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{moeda(proposta?.items_total ?? String(subtotalEstimado))}</span>
              </div>
              <div className="mt-2 flex justify-between items-baseline">
                <span className="font-display font-semibold text-ink">Total</span>
                <span className="font-display text-xl font-bold text-ink">
                  {moeda(String(
                    Number(proposta?.items_total ?? subtotalEstimado) - Number(form.discount || 0),
                  ))}
                </span>
              </div>
              {!proposta && (
                <p className="mt-2 text-xs text-ink/40">
                  Estimativa da tela. O valor final é calculado no servidor ao salvar.
                </p>
              )}
            </div>
          </div>

          <div className="card-surface p-6">
            <Campo label="Notas internas" ajuda="Só a equipe vê. Nunca sai na página do cliente.">
              <textarea rows={4} className={entrada} disabled={!rascunho}
                        value={form.internal_notes} onChange={(e) => alterar('internal_notes', e.target.value)} />
            </Campo>
          </div>

          <div className="flex flex-col gap-2">
            {rascunho && (
              <button type="button" onClick={() => void salvar()} disabled={salvando || !form.title}
                      className="btn-gradient justify-center disabled:opacity-60">
                {salvando ? 'Salvando…' : criando ? 'Criar rascunho' : 'Salvar'}
              </button>
            )}
            {!criando && proposta?.status === 'draft' && (
              <button type="button" onClick={() => void enviar()} disabled={salvando}
                      className="btn-outline-dark justify-center disabled:opacity-60">
                <Send size={14} /> Enviar e gerar link
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
