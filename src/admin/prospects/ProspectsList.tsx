import { useCallback, useEffect, useState } from 'react'
import { Search, Upload } from 'lucide-react'
import {
  ROTULO_ORIGEM, ROTULO_STATUS, STATUS_PROSPECT, faixaScore, listarProspects,
  type Prospect,
} from './prospectsClient'
import { ProspectDrawer } from './ProspectDrawer'
import { ImportCsvModal } from './ImportCsvModal'

export function ProspectsList() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [soQuentes, setSoQuentes] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Guardamos junto os filtros que originaram os dados, para "carregando" ser
  // derivado na renderização em vez de sincronizado por setState no efeito.
  const chave = `${busca}|${status}|${soQuentes}`
  const [resultado, setResultado] = useState<{ chave: string; lista: Prospect[] } | null>(null)
  const carregando = resultado?.chave !== chave

  const [aberto, setAberto] = useState<Prospect | null>(null)
  const [importando, setImportando] = useState(false)

  const carregar = useCallback(async () => {
    const r = await listarProspects({
      q: busca || undefined,
      status: status || undefined,
      score: soQuentes ? 70 : undefined,
    })
    if (r.ok) { setResultado({ chave, lista: r.dados.prospects }); setErro(null) } else setErro(r.erro)
  }, [busca, status, soQuentes, chave])

  // Todo setState em `carregar` acontece depois do await; o linter não
  // rastreia através da função assíncrona.
  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void carregar() }, [carregar])

  const prospects = resultado?.lista ?? []

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Prospecção</h1>
          <p className="text-sm text-ink-soft mt-1">
            Quem a Pulsari foi buscar. O score diz por onde começar.
          </p>
        </div>
        <button type="button" onClick={() => setImportando(true)} className="btn-gradient">
          <Upload size={16} /> Importar CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="relative flex-1 min-w-[15rem]">
          <span className="sr-only">Buscar prospect</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)}
                 placeholder="Empresa, contato, e-mail ou segmento"
                 className="w-full rounded-xl border border-line bg-paper-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none focus:border-brand-violet" />
        </label>
        <label>
          <span className="sr-only">Filtrar por status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="rounded-xl border border-line bg-paper-white px-3 py-2.5 text-sm text-ink-soft outline-none focus:border-brand-violet">
            <option value="">Todos os status</option>
            {STATUS_PROSPECT.map((s) => (
              <option key={s} value={s}>{ROTULO_STATUS[s]}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setSoQuentes((v) => !v)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  soQuentes ? 'bg-green-700 text-white' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
                }`}>
          Só quentes (70+)
        </button>
      </div>

      {erro && <p role="alert" className="mb-4 text-sm text-red-600">{erro}</p>}

      {carregando ? (
        <p className="text-sm text-ink-soft">Carregando…</p>
      ) : prospects.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="text-ink-soft">Nenhum prospect encontrado.</p>
        </div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.1em] text-ink/40 border-b border-line">
                <th className="px-5 py-3 font-semibold w-20">Score</th>
                <th className="px-5 py-3 font-semibold">Empresa</th>
                <th className="px-5 py-3 font-semibold">Segmento</th>
                <th className="px-5 py-3 font-semibold">Origem</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const faixa = faixaScore(p.score)
                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-ink/[0.02]">
                    <td className="px-5 py-3">
                      <span className={`inline-flex min-w-[2.75rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${faixa.classe}`}
                            title={`${faixa.rotulo} — ${p.score_detalhe.faltando.length} fator(es) faltando`}>
                        {p.score}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => setAberto(p)}
                              className="text-left font-medium text-ink hover:text-brand-violet">
                        {p.company_name}
                      </button>
                      {p.contact_name && <p className="text-xs text-ink-soft">{p.contact_name}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{p.segment ?? '—'}</td>
                    <td className="px-5 py-3 text-ink-soft">{ROTULO_ORIGEM[p.source] ?? p.source}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink-soft">
                        {ROTULO_STATUS[p.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {aberto && (
        <ProspectDrawer
          prospect={aberto}
          onFechar={() => setAberto(null)}
          onAtualizado={(p) => {
            setResultado((r) => (r ? { ...r, lista: r.lista.map((x) => (x.id === p.id ? p : x)) } : r))
            setAberto(p)
          }}
        />
      )}

      {importando && (
        <ImportCsvModal onFechar={() => setImportando(false)} onImportado={() => void carregar()} />
      )}
    </div>
  )
}
