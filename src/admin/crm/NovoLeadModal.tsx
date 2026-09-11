import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { criarLead } from './crmClient'

const entrada =
  'w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-brand-violet'

export function NovoLeadModal({
  onFechar, onCriado,
}: {
  onFechar: () => void
  onCriado: () => void
}) {
  const [form, setForm] = useState({
    name: '', company_name: '', email: '', phone: '',
    service_interest: '', estimated_value: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    // O servidor exige ao menos uma forma de contato; avisar aqui evita uma
    // ida à rede só para receber a mesma recusa.
    if (!form.email && !form.phone) {
      setErro('Informe ao menos e-mail ou telefone.')
      return
    }

    setSalvando(true)
    try {
      const r = await criarLead({
        name: form.name,
        company_name: form.company_name || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        service_interest: form.service_interest || undefined,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : undefined,
        source: 'manual',
      })
      if (!r.ok) { setErro(r.erro); return }
      onCriado()
    } finally {
      setSalvando(false)
    }
  }

  const campo = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4">
      <button type="button" aria-label="Fechar" onClick={onFechar} className="absolute inset-0 bg-plum/40" />

      <div role="dialog" aria-label="Novo lead" className="relative w-full max-w-md rounded-2xl bg-paper-white p-6 shadow-soft">
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-ink">Novo lead</h2>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="text-ink/30 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Nome</span>
            <input required minLength={2} value={form.name}
                   onChange={(e) => campo('name', e.target.value)} className={`${entrada} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Empresa</span>
            <input value={form.company_name}
                   onChange={(e) => campo('company_name', e.target.value)} className={`${entrada} mt-1`} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-ink/40">E-mail</span>
              <input type="email" value={form.email}
                     onChange={(e) => campo('email', e.target.value)} className={`${entrada} mt-1`} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Telefone</span>
              <input value={form.phone}
                     onChange={(e) => campo('phone', e.target.value)} className={`${entrada} mt-1`} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Interesse</span>
            <input value={form.service_interest}
                   onChange={(e) => campo('service_interest', e.target.value)} className={`${entrada} mt-1`} />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/40">Valor estimado</span>
            <input type="number" min="0" step="0.01" value={form.estimated_value}
                   onChange={(e) => campo('estimated_value', e.target.value)} className={`${entrada} mt-1`} />
          </label>

          {erro && <p role="alert" className="text-sm text-red-600">{erro}</p>}

          <button type="submit" disabled={salvando || !form.name}
                  className="btn-gradient w-full justify-center disabled:opacity-60">
            {salvando ? 'Criando…' : 'Criar lead'}
          </button>
        </form>
      </div>
    </div>
  )
}
