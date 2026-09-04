import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { whatsappHref } from '../config/site'
import { trackEvent } from '../lib/analytics'

const serviceOptions = [
  'Estratégia Digital',
  'Design e Identidade',
  'Sites e Landing Pages',
  'Sistemas e Aplicações Web',
  'Automação e Integrações',
  'Conteúdo e Direção Criativa',
]

const timelineOptions = ['Urgente (até 2 semanas)', 'Este mês', 'Sem pressa, só me organizando']

const budgetOptions = ['Até R$ 2 mil', 'R$ 2 mil a R$ 5 mil', 'Acima de R$ 5 mil', 'Prefiro conversar sobre valores']

const steps = ['Sobre você', 'O que você precisa', 'Prazo e orçamento', 'Detalhes finais']

type FormData = {
  name: string
  company: string
  services: string[]
  timeline: string
  budget: string
  details: string
}

const initialData: FormData = { name: '', company: '', services: [], timeline: '', budget: '', details: '' }

function buildMessage(data: FormData) {
  const lines = [
    'Olá! Vim pelo site da Pulsari e quero fazer um briefing rápido.',
    '',
    `Nome: ${data.name}`,
    data.company ? `Empresa/marca: ${data.company}` : null,
    '',
    `Serviços de interesse: ${data.services.length ? data.services.join(', ') : 'Não especificado'}`,
    `Prazo: ${data.timeline || 'Não especificado'}`,
    `Orçamento: ${data.budget || 'Não especificado'}`,
    data.details ? `\nDetalhes do projeto: ${data.details}` : null,
  ].filter((line): line is string => line !== null)
  return lines.join('\n')
}

function pillClass(selected: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
    selected ? 'border-transparent bg-brand-violet text-white' : 'border-line text-ink-soft hover:border-brand-violet/50'
  }`
}

export function BriefingWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState<FormData>(initialData)

  const goNext = () => {
    setDirection(1)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  const goBack = () => {
    setDirection(-1)
    setStep((s) => Math.max(s - 1, 0))
  }

  const toggleService = (label: string) => {
    setData((d) => ({
      ...d,
      services: d.services.includes(label) ? d.services.filter((s) => s !== label) : [...d.services, label],
    }))
  }

  const canProceedStep0 = data.name.trim().length > 0
  const isLastStep = step === steps.length - 1

  return (
    <div className="card-surface p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-8">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-brand-violet' : 'bg-line'}`}
          />
        ))}
      </div>

      <p className="text-xs font-semibold tracking-[0.16em] uppercase text-brand-violet mb-1.5">
        Passo {step + 1} de {steps.length}
      </p>
      <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mb-6">{steps[step]}</h3>

      <div className="relative min-h-[220px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: direction * 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -32, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <input
                  value={data.name}
                  onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Seu nome"
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand-violet transition-colors"
                />
                <input
                  value={data.company}
                  onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))}
                  placeholder="Empresa ou marca (opcional)"
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand-violet transition-colors"
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-wrap gap-2.5">
                {serviceOptions.map((label) => {
                  const selected = data.services.includes(label)
                  return (
                    <button type="button" key={label} onClick={() => toggleService(label)} className={pillClass(selected)}>
                      <span className="inline-flex items-center gap-1.5">
                        {selected && <Check size={14} />}
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-ink mb-3">Prazo</p>
                  <div className="flex flex-wrap gap-2.5">
                    {timelineOptions.map((label) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setData((d) => ({ ...d, timeline: label }))}
                        className={pillClass(data.timeline === label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink mb-3">Orçamento aproximado</p>
                  <div className="flex flex-wrap gap-2.5">
                    {budgetOptions.map((label) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setData((d) => ({ ...d, budget: label }))}
                        className={pillClass(data.budget === label)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <textarea
                  value={data.details}
                  onChange={(e) => setData((d) => ({ ...d, details: e.target.value }))}
                  placeholder="Conte um pouco mais sobre o seu projeto (opcional)"
                  rows={4}
                  className="w-full rounded-xl border border-line px-4 py-3 text-sm text-ink resize-none focus:outline-none focus:border-brand-violet transition-colors"
                />
                <div className="rounded-xl bg-paper-lavender/60 p-4 text-sm text-ink-soft leading-relaxed">
                  <p className="font-semibold text-ink mb-1">
                    {data.name || 'Seu nome'}
                    {data.company ? ` · ${data.company}` : ''}
                  </p>
                  <p>{data.services.length ? data.services.join(', ') : 'Nenhum serviço selecionado ainda'}</p>
                  <p>
                    {data.timeline || 'Prazo não definido'} · {data.budget || 'Orçamento não definido'}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={step === 0 ? onClose : goBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} />
          {step === 0 ? 'Cancelar' : 'Voltar'}
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={goNext}
            disabled={step === 0 && !canProceedStep0}
            className="btn-gradient disabled:opacity-40 disabled:pointer-events-none"
          >
            Continuar
            <ArrowRight size={16} />
          </button>
        ) : (
          <a
            href={whatsappHref(buildMessage(data))}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent('briefing_wizard_complete', { services: data.services.join(', ') })}
            className="btn-gradient"
          >
            Enviar pelo WhatsApp
            <Send size={16} />
          </a>
        )}
      </div>
    </div>
  )
}
