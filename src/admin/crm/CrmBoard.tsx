import { useCallback, useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import {
  COR_COLUNA, ROTULO_STATUS, STATUS_LEAD, listarLeads, moeda, moverLead,
  type Lead, type StatusLead,
} from './crmClient'
import { LeadCard } from './LeadCard'
import { LeadDrawer } from './LeadDrawer'
import { NovoLeadModal } from './NovoLeadModal'

/**
 * Quadro do CRM — sete colunas, uma por fase do funil.
 *
 * Não é o mesmo quadro da gestão de projetos: aqui as colunas são estados de
 * negociação, lá são fases de execução de sprint. Misturar os dois foi
 * descartado de propósito.
 *
 * O movimento é otimista: o card muda de coluna na hora e só reverte se o
 * servidor recusar. Esperar a resposta antes de mover deixaria o arrastar com
 * uma latência que faz a interface parecer quebrada.
 */
export function CrmBoard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [soAtrasados, setSoAtrasados] = useState(false)

  const [arrastando, setArrastando] = useState<Lead | null>(null)
  const [colunaAlvo, setColunaAlvo] = useState<StatusLead | null>(null)
  const [aberto, setAberto] = useState<Lead | null>(null)
  const [criando, setCriando] = useState(false)

  const carregar = useCallback(async () => {
    const r = await listarLeads({ q: busca || undefined, atrasados: soAtrasados || undefined })
    if (r.ok) { setLeads(r.dados.leads); setErro(null) } else setErro(r.erro)
    setCarregado(true)
  }, [busca, soAtrasados])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void carregar() }, [carregar])

  async function mover(lead: Lead, status: StatusLead) {
    if (lead.status === status) return

    const anterior = leads
    setLeads((l) => l.map((x) => (x.id === lead.id ? { ...x, status } : x)))
    setErro(null)

    const r = await moverLead(lead.id, status)
    if (!r.ok) {
      setLeads(anterior)
      setErro(r.erro)
      return
    }
    // Ganho converte em cliente no servidor; recarregamos para trazer o
    // vínculo criado junto com o estado real do card.
    if (r.dados.convertido) await carregar()
    else setLeads((l) => l.map((x) => (x.id === lead.id ? r.dados.lead : x)))
  }

  const porColuna = (s: StatusLead) => leads.filter((l) => l.status === s)

  const totalColuna = (s: StatusLead) =>
    porColuna(s).reduce((soma, l) => soma + Number(l.estimated_value ?? 0), 0)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">CRM</h1>
          <p className="text-sm text-ink-soft mt-1">
            Do primeiro contato ao cliente fechado.
          </p>
        </div>
        <button type="button" onClick={() => setCriando(true)} className="btn-gradient">
          <Plus size={16} /> Novo lead
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="relative flex-1 min-w-[15rem]">
          <span className="sr-only">Buscar lead</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, empresa, e-mail ou telefone"
            className="w-full rounded-xl border border-line bg-paper-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-brand-violet"
          />
        </label>
        <button
          type="button"
          onClick={() => setSoAtrasados((v) => !v)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            soAtrasados ? 'bg-red-600 text-white' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
          }`}
        >
          Follow-up atrasado
        </button>
      </div>

      {erro && <p role="alert" className="mb-4 text-sm text-red-600">{erro}</p>}

      {!carregado ? (
        <p className="text-sm text-ink-soft">Carregando…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_LEAD.map((status) => {
            const daColuna = porColuna(status)
            const total = totalColuna(status)

            return (
              <section
                key={status}
                onDragOver={(e) => { e.preventDefault(); setColunaAlvo(status) }}
                onDragLeave={() => setColunaAlvo((c) => (c === status ? null : c))}
                onDrop={(e) => {
                  e.preventDefault()
                  setColunaAlvo(null)
                  if (arrastando) void mover(arrastando, status)
                  setArrastando(null)
                }}
                aria-label={`Fase ${ROTULO_STATUS[status]}`}
                className={`w-[17rem] shrink-0 rounded-2xl p-3 transition-colors ${
                  colunaAlvo === status ? 'bg-brand-violet/[0.06]' : 'bg-ink/[0.02]'
                }`}
              >
                <div className={`h-1 rounded-full ${COR_COLUNA[status]} mb-3`} />
                <header className="flex items-baseline justify-between mb-3 px-0.5">
                  <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-ink/50">
                    {ROTULO_STATUS[status]}
                  </h2>
                  <span className="text-xs text-ink/40">{daColuna.length}</span>
                </header>
                {total > 0 && (
                  <p className="px-0.5 mb-3 text-xs text-ink-soft">{moeda(String(total))}</p>
                )}

                <div className="space-y-2.5 min-h-[4rem]">
                  {daColuna.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onAbrir={setAberto}
                      onMover={mover}
                      arrastando={arrastando?.id === lead.id}
                      onArrastarInicio={setArrastando}
                      onArrastarFim={() => { setArrastando(null); setColunaAlvo(null) }}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {aberto && (
        <LeadDrawer
          lead={aberto}
          onFechar={() => setAberto(null)}
          onAtualizado={(l) => {
            setLeads((lista) => lista.map((x) => (x.id === l.id ? l : x)))
            setAberto(l)
          }}
        />
      )}

      {criando && (
        <NovoLeadModal
          onFechar={() => setCriando(false)}
          onCriado={() => { setCriando(false); void carregar() }}
        />
      )}
    </div>
  )
}
