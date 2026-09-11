import { CalendarClock, Building2 } from 'lucide-react'
import { ROTULO_STATUS, STATUS_LEAD, atrasado, moeda, type Lead, type StatusLead } from './crmClient'

/**
 * Card do lead no quadro.
 *
 * Arrastar é o caminho principal, mas não é acessível por teclado nem em
 * leitor de tela. Por isso cada card também traz um seletor de fase — mesma
 * operação, alcançável por Tab. Sem ele o quadro seria inutilizável para
 * quem não usa mouse.
 */
export function LeadCard({
  lead,
  onAbrir,
  onMover,
  arrastando,
  onArrastarInicio,
  onArrastarFim,
}: {
  lead: Lead
  onAbrir: (lead: Lead) => void
  onMover: (lead: Lead, status: StatusLead) => void
  arrastando: boolean
  onArrastarInicio: (lead: Lead) => void
  onArrastarFim: () => void
}) {
  const emAtraso = atrasado(lead)

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', lead.id)
        onArrastarInicio(lead)
      }}
      onDragEnd={onArrastarFim}
      className={`card-surface p-3.5 cursor-grab active:cursor-grabbing transition-opacity ${
        arrastando ? 'opacity-40' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => onAbrir(lead)}
        className="block w-full text-left"
      >
        <h3 className="font-medium text-sm text-ink leading-snug">{lead.name}</h3>
        {lead.company_name && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
            <Building2 size={12} className="shrink-0" />
            {lead.company_name}
          </p>
        )}
        {lead.service_interest && (
          <p className="mt-2 text-xs text-ink-soft line-clamp-2">{lead.service_interest}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {lead.estimated_value && (
            <span className="text-xs font-medium text-ink">{moeda(lead.estimated_value)}</span>
          )}
          {lead.next_contact_at && (
            <span
              className={`inline-flex items-center gap-1 text-xs ${
                emAtraso ? 'text-red-600 font-medium' : 'text-ink-soft'
              }`}
            >
              <CalendarClock size={12} />
              {new Date(lead.next_contact_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit',
              })}
            </span>
          )}
          {lead.owner_name && (
            <span className="text-xs text-ink/40">{lead.owner_name.split(' ')[0]}</span>
          )}
        </div>
      </button>

      <label className="mt-3 block">
        <span className="sr-only">Mover {lead.name} para outra fase</span>
        <select
          value={lead.status}
          onChange={(e) => onMover(lead, e.target.value as StatusLead)}
          className="w-full rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink-soft outline-none focus:border-brand-violet"
        >
          {STATUS_LEAD.map((s) => (
            <option key={s} value={s}>{ROTULO_STATUS[s]}</option>
          ))}
        </select>
      </label>
    </article>
  )
}
