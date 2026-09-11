import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import {
  COR_STATUS, ROTULO_STATUS, listarPropostas, moeda,
  type ResumoProposta,
} from './proposalsClient'

export function ProposalsList() {
  const [filtro, setFiltro] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  // Guardamos junto o filtro que originou os dados. Assim "carregando" é
  // derivado durante a renderização em vez de sincronizado por um setState
  // dentro do efeito — que dispararia renders em cascata.
  const [resultado, setResultado] = useState<{ filtro: string; lista: ResumoProposta[] } | null>(null)

  const carregando = resultado?.filtro !== filtro

  useEffect(() => {
    let ativo = true
    listarPropostas(filtro || undefined).then((r) => {
      if (!ativo) return
      if (r.ok) setResultado({ filtro, lista: r.dados.proposals })
      else setErro(r.erro)
    })
    return () => { ativo = false }
  }, [filtro])

  const propostas = resultado?.lista ?? []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Propostas</h1>
          <p className="text-sm text-ink-soft mt-1">
            Monte, envie e acompanhe quem abriu.
          </p>
        </div>
        <Link to="/admin/proposals/new" className="btn-gradient">
          <Plus size={16} /> Nova proposta
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[['', 'Todas'], ...Object.entries(ROTULO_STATUS)].map(([valor, rotulo]) => (
          <button
            key={valor || 'todas'}
            type="button"
            onClick={() => setFiltro(valor)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtro === valor
                ? 'bg-ink text-white'
                : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {erro && <p role="alert" className="text-sm text-red-600 mb-4">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-ink-soft">Carregando…</p>
      ) : propostas.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-ink-soft">
            {filtro ? 'Nenhuma proposta com esse status.' : 'Nenhuma proposta ainda.'}
          </p>
        </div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.1em] text-ink/40 border-b border-line">
                <th className="px-5 py-3 font-semibold">Proposta</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Valor</th>
                <th className="px-5 py-3 font-semibold text-right">Aberturas</th>
              </tr>
            </thead>
            <tbody>
              {propostas.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-ink/[0.02]">
                  <td className="px-5 py-3">
                    <Link to={`/admin/proposals/${p.id}`} className="font-medium text-ink hover:text-brand-violet">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{p.client_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${COR_STATUS[p.status] ?? ''}`}>
                      {ROTULO_STATUS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-ink">
                    {/* Aceita mostra o valor congelado; as demais, o cálculo atual. */}
                    {moeda(p.accepted_total ?? p.items_total)}
                  </td>
                  <td className="px-5 py-3 text-right text-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <Eye size={13} /> {p.view_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
