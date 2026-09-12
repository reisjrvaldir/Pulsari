import { useEffect, useState } from 'react'
import { ArrowRight, Check, Globe, Mail, Minus, Phone, X } from 'lucide-react'
import {
  ROTULO_ORIGEM, ROTULO_STATUS, STATUS_PROSPECT, converterProspect,
  faixaScore, salvarProspect, type Prospect, type StatusProspect,
} from './prospectsClient'

const entrada =
  'w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand-violet'

/**
 * Painel do prospect.
 *
 * O bloco do score mostra fator a fator o que somou e o que faltou. É o
 * ponto do módulo: o número sozinho não diz o que fazer a seguir, a lista do
 * que falta diz.
 */
export function ProspectDrawer({
  prospect, onFechar, onAtualizado,
}: {
  prospect: Prospect
  onFechar: () => void
  onAtualizado: (p: Prospect) => void
}) {
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [convertendo, setConvertendo] = useState(false)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function alterar(campo: string, valor: string) {
    const r = await salvarProspect(prospect.id, { [campo]: valor === '' ? null : valor })
    if (r.ok) onAtualizado(r.dados.prospect)
    else setErro(r.erro)
  }

  async function converter() {
    setConvertendo(true); setErro(null); setAviso(null)
    try {
      const r = await converterProspect(prospect.id)
      if (!r.ok) { setErro(r.erro); return }
      onAtualizado(r.dados.prospect)
      setAviso(
        r.dados.jaConvertido
          ? 'Este prospect já havia sido convertido.'
          : r.dados.leadCriado
            ? 'Convertido em novo lead no CRM.'
            : 'Vinculado a um lead que já existia no CRM.',
      )
    } finally {
      setConvertendo(false)
    }
  }

  const faixa = faixaScore(prospect.score)
  const convertido = Boolean(prospect.converted_lead_id)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fechar painel" onClick={onFechar} className="absolute inset-0 bg-plum/40" />

      <aside role="dialog" aria-label={`Prospect ${prospect.company_name}`}
             className="relative w-full max-w-md overflow-y-auto bg-paper-white shadow-soft">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-paper-white px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{prospect.company_name}</h2>
            {prospect.contact_name && <p className="text-sm text-ink-soft">{prospect.contact_name}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink-soft">
                {ROTULO_STATUS[prospect.status]}
              </span>
              <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink-soft">
                {ROTULO_ORIGEM[prospect.source] ?? prospect.source}
              </span>
            </div>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-ink/30 hover:text-ink">
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6">
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}
          {aviso && <p className="text-sm text-green-700">{aviso}</p>}

          <section aria-label="Detalhamento do score" className="rounded-xl border border-line p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40">Score</h3>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-ink">{prospect.score}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${faixa.classe}`}>
                  {faixa.rotulo}
                </span>
              </div>
            </div>

            <ul className="space-y-1.5">
              {prospect.score_detalhe.fatores.map((f) => (
                <li key={f.codigo} className="flex items-center justify-between gap-3 text-sm">
                  <span className={`flex items-center gap-2 ${f.atendido ? 'text-ink' : 'text-ink/35'}`}>
                    {f.atendido
                      ? <Check size={14} className="text-green-600 shrink-0" />
                      : <Minus size={14} className="shrink-0" />}
                    {f.rotulo}
                  </span>
                  <span className={f.atendido ? 'text-ink-soft' : 'text-ink/25'}>
                    {f.atendido ? `+${f.pontos}` : `${f.pontos}`}
                  </span>
                </li>
              ))}
            </ul>

            {prospect.score_detalhe.faltando.length > 0 && (
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-soft">
                Para subir o score, falta:{' '}
                {prospect.score_detalhe.faltando.map((f) => f.rotulo.toLowerCase()).join(', ')}.
              </p>
            )}
          </section>

          <div className="space-y-2 text-sm">
            {prospect.email && (
              <a href={`mailto:${prospect.email}`} className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Mail size={14} /> {prospect.email}
              </a>
            )}
            {prospect.phone && (
              <a href={`tel:${prospect.phone}`} className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Phone size={14} /> {prospect.phone}
              </a>
            )}
            {prospect.website && (
              <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                 target="_blank" rel="noreferrer"
                 className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Globe size={14} /> {prospect.website}
              </a>
            )}
          </div>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Status</span>
            <select
              value={prospect.status}
              onChange={(e) => void alterar('status', e.target.value as StatusProspect)}
              disabled={convertido}
              className={`${entrada} mt-1.5`}
            >
              {STATUS_PROSPECT.filter((s) => s !== 'converted').map((s) => (
                <option key={s} value={s}>{ROTULO_STATUS[s]}</option>
              ))}
              {convertido && <option value="converted">{ROTULO_STATUS.converted}</option>}
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Segmento</span>
            <input defaultValue={prospect.segment ?? ''}
                   onBlur={(e) => void alterar('segment', e.target.value)}
                   className={`${entrada} mt-1.5`} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Pesquisa e observações</span>
            <textarea rows={4} defaultValue={prospect.notes ?? ''}
                      onBlur={(e) => void alterar('notes', e.target.value)}
                      className={`${entrada} mt-1.5`} />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Próximo contato</span>
            <input type="datetime-local"
                   defaultValue={prospect.next_contact_at ? prospect.next_contact_at.slice(0, 16) : ''}
                   onBlur={(e) => void alterar('next_contact_at', e.target.value)}
                   className={`${entrada} mt-1.5`} />
          </label>

          {convertido ? (
            <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              Já está no CRM como lead.
            </p>
          ) : (
            <button type="button" onClick={() => void converter()} disabled={convertendo}
                    className="btn-gradient w-full justify-center disabled:opacity-60">
              {convertendo ? 'Convertendo…' : <>Converter em lead <ArrowRight size={15} /></>}
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
