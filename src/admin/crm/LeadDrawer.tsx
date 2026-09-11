import { useCallback, useEffect, useState } from 'react'
import { Mail, Phone, X } from 'lucide-react'
import {
  ROTULO_ATIVIDADE, ROTULO_STATUS, listarAtividades, moeda,
  registrarAtividade, salvarLead,
  type Atividade, type Lead,
} from './crmClient'

const entrada =
  'w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand-violet'

/** Painel lateral com dados, histórico e registro de contato. */
export function LeadDrawer({
  lead, onFechar, onAtualizado,
}: {
  lead: Lead
  onFechar: () => void
  onAtualizado: (lead: Lead) => void
}) {
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [texto, setTexto] = useState('')
  const [proximoContato, setProximoContato] = useState('')
  const [tipo, setTipo] = useState<'note' | 'contact'>('contact')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    const r = await listarAtividades(lead.id)
    if (r.ok) setAtividades(r.dados.activities)
  }, [lead.id])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { void carregar() }, [carregar])

  // Esc fecha: num painel sobreposto, obrigar a mirar o X é atrito à toa.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    setSalvando(true); setErro(null)
    try {
      const r = await registrarAtividade(lead.id, {
        type: tipo,
        description: texto.trim(),
        next_contact_at: proximoContato || undefined,
      })
      if (!r.ok) { setErro(r.erro); return }
      setAtividades(r.dados.activities)
      onAtualizado(r.dados.lead)
      setTexto(''); setProximoContato('')
    } finally {
      setSalvando(false)
    }
  }

  async function alterarCampo(campo: string, valor: string) {
    const r = await salvarLead(lead.id, { [campo]: valor === '' ? null : valor })
    if (r.ok) onAtualizado(r.dados.lead)
    else setErro(r.erro)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar painel"
        onClick={onFechar}
        className="absolute inset-0 bg-plum/40"
      />

      <aside
        role="dialog"
        aria-label={`Lead ${lead.name}`}
        className="relative w-full max-w-md overflow-y-auto bg-paper-white shadow-soft"
      >
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-line bg-paper-white px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{lead.name}</h2>
            {lead.company_name && <p className="text-sm text-ink-soft">{lead.company_name}</p>}
            <span className="mt-2 inline-block rounded-full bg-ink/5 px-2.5 py-0.5 text-xs text-ink-soft">
              {ROTULO_STATUS[lead.status]}
            </span>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-ink/30 hover:text-ink">
            <X size={18} />
          </button>
        </header>

        <div className="px-6 py-5 space-y-6">
          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}

          <div className="space-y-2 text-sm">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Mail size={14} /> {lead.email}
              </a>
            )}
            {(lead.phone || lead.whatsapp) && (
              <a href={`tel:${lead.phone ?? lead.whatsapp}`} className="flex items-center gap-2 text-ink-soft hover:text-ink">
                <Phone size={14} /> {lead.phone ?? lead.whatsapp}
              </a>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-ink/40">Origem</dt>
              <dd className="mt-0.5 text-ink">{lead.source}{lead.source_detail ? ` · ${lead.source_detail}` : ''}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-ink/40">Valor estimado</dt>
              <dd className="mt-0.5 text-ink">{moeda(lead.estimated_value)}</dd>
            </div>
          </dl>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Interesse</span>
            <input
              defaultValue={lead.service_interest ?? ''}
              onBlur={(e) => void alterarCampo('service_interest', e.target.value)}
              className={`${entrada} mt-1.5`}
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Anotações</span>
            <textarea
              rows={3}
              defaultValue={lead.notes ?? ''}
              onBlur={(e) => void alterarCampo('notes', e.target.value)}
              className={`${entrada} mt-1.5`}
            />
          </label>

          <form onSubmit={registrar} className="rounded-xl border border-line p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40 mb-3">
              Registrar
            </h3>
            <div className="flex gap-2 mb-3">
              {(['contact', 'note'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    tipo === t ? 'bg-ink text-white' : 'bg-ink/5 text-ink-soft'
                  }`}
                >
                  {t === 'contact' ? 'Contato' : 'Anotação'}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={tipo === 'contact' ? 'O que foi conversado?' : 'Observação interna'}
              className={entrada}
            />
            <label className="mt-3 block">
              <span className="text-xs text-ink-soft">Próximo follow-up</span>
              <input
                type="datetime-local"
                value={proximoContato}
                onChange={(e) => setProximoContato(e.target.value)}
                className={`${entrada} mt-1`}
              />
            </label>
            <button type="submit" disabled={salvando || !texto.trim()} className="btn-gradient mt-3 w-full justify-center text-sm disabled:opacity-50">
              {salvando ? 'Registrando…' : 'Registrar'}
            </button>
          </form>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/40 mb-3">
              Histórico
            </h3>
            <ol className="space-y-3">
              {atividades.map((a) => (
                <li key={a.id} className="border-l-2 border-line pl-3">
                  <p className="text-sm text-ink">
                    {ROTULO_ATIVIDADE[a.type] ?? a.type}
                    {a.from_value && a.to_value && (
                      <span className="text-ink-soft">
                        {' '}· {ROTULO_STATUS[a.from_value as keyof typeof ROTULO_STATUS] ?? a.from_value}
                        {' → '}
                        {ROTULO_STATUS[a.to_value as keyof typeof ROTULO_STATUS] ?? a.to_value}
                      </span>
                    )}
                  </p>
                  {a.description && <p className="text-xs text-ink-soft mt-0.5">{a.description}</p>}
                  <p className="text-xs text-ink/35 mt-1">
                    {new Date(a.created_at).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                    {/* Sem autor = ação do próprio site, não de alguém da equipe. */}
                    {a.user_name ? ` · ${a.user_name}` : ' · pelo site'}
                  </p>
                </li>
              ))}
              {atividades.length === 0 && (
                <li className="text-sm text-ink-soft">Nada registrado ainda.</li>
              )}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  )
}
