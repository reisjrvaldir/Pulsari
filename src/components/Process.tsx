import { useRef, useState } from 'react'
import { motion, useScroll, useSpring, useMotionValueEvent } from 'framer-motion'
import { Search, Target, Sparkles, Code2, TrendingUp } from 'lucide-react'
import { Reveal } from './Reveal'
import { HighlightText } from './HighlightText'
import { usePrefersReducedMotion } from '../lib/hooks'

const steps = [
  {
    number: '01',
    title: 'Descobrir',
    icon: Search,
    text: 'Entendemos o negócio, o público, os desafios e as oportunidades.',
  },
  {
    number: '02',
    title: 'Definir',
    icon: Target,
    text: 'Transformamos informações em estratégia, escopo e prioridades.',
  },
  {
    number: '03',
    title: 'Criar',
    icon: Sparkles,
    text: 'Desenvolvemos conceitos, interfaces e protótipos alinhados à direção definida.',
  },
  {
    number: '04',
    title: 'Desenvolver',
    icon: Code2,
    text: 'Construímos a solução com qualidade, performance, segurança e atenção aos detalhes.',
  },
  {
    number: '05',
    title: 'Evoluir',
    icon: TrendingUp,
    text: 'Testamos, publicamos, acompanhamos e identificamos oportunidades de melhoria.',
  },
]

export function Process() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [activeStep, setActiveStep] = useState(-1)

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start 0.8', 'end 0.55'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reducedMotion) {
      setActiveStep(steps.length - 1)
      return
    }
    const idx = Math.floor(v * steps.length)
    setActiveStep(Math.min(steps.length - 1, Math.max(-1, idx)))
  })

  return (
    <section id="processo" className="section-pad bg-paper-lavender/40">
      <div className="container-px max-w-content mx-auto">
        <div className="max-w-2xl mx-auto text-center lg:mx-0 lg:text-left">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
              Um processo claro. <HighlightText text="Colaboração em cada etapa." />
            </h2>
          </Reveal>
        </div>

        <div ref={containerRef} className="mt-16 sm:mt-20">
          {/* Desktop: linha horizontal conectando etapas, preenchida conforme o scroll */}
          <div className="hidden lg:block relative">
            <div className="absolute top-6 left-0 right-0 h-[2px] bg-line" aria-hidden="true" />
            <motion.div
              className="absolute top-6 left-0 h-[2px] animate-pulse-line"
              style={{
                backgroundImage: 'linear-gradient(90deg, #FF2BA6, #8B5CF6, #3B82F6)',
                backgroundSize: '200% 100%',
                width: '100%',
                scaleX: reducedMotion ? 1 : progress,
                transformOrigin: '0% 50%',
              }}
              aria-hidden="true"
            />
            <div className="grid grid-cols-5 gap-6">
              {steps.map((step, i) => {
                const Icon = step.icon
                const isActive = i <= activeStep
                return (
                  <div key={step.number} className="group">
                    <div
                      className={`relative z-10 h-12 w-12 rounded-full flex items-center justify-center mb-5 transition-all duration-500 ease-out border-2 ${
                        isActive
                          ? 'border-transparent bg-gradient-to-br from-brand-pink to-brand-blue shadow-[0_0_0_6px_rgba(139,92,246,0.12)] scale-105'
                          : 'border-brand-violet/30 bg-paper-white'
                      } group-hover:scale-110`}
                    >
                      <Icon
                        size={18}
                        className={`transition-colors duration-500 ${isActive ? 'text-white' : 'text-brand-violet/50'}`}
                        strokeWidth={1.75}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold tracking-[0.16em] transition-colors duration-500 ${
                        isActive ? 'text-brand-violet' : 'text-ink/35'
                      }`}
                    >
                      {step.number}
                    </span>
                    <h3
                      className={`font-display text-lg font-semibold mt-1 mb-2 transition-colors duration-500 ${
                        isActive ? 'text-ink' : 'text-ink/40'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed transition-colors duration-500 ${isActive ? 'text-ink-soft' : 'text-ink/30'}`}>
                      {step.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mobile/Tablet: timeline vertical, preenchida conforme o scroll */}
          <div className="lg:hidden relative pl-10">
            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-line" aria-hidden="true" />
            <motion.div
              className="absolute left-[15px] top-2 w-[2px] animate-pulse-line"
              style={{
                backgroundImage: 'linear-gradient(180deg, #FF2BA6, #8B5CF6, #3B82F6)',
                backgroundSize: '100% 200%',
                height: 'calc(100% - 16px)',
                scaleY: reducedMotion ? 1 : progress,
                transformOrigin: '50% 0%',
              }}
              aria-hidden="true"
            />
            <div className="flex flex-col gap-10">
              {steps.map((step, i) => {
                const Icon = step.icon
                const isActive = i <= activeStep
                return (
                  <div key={step.number} className="relative">
                    <div
                      className={`absolute -left-10 top-0 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 ease-out border-2 ${
                        isActive
                          ? 'border-transparent bg-gradient-to-br from-brand-pink to-brand-blue scale-105'
                          : 'border-brand-violet/30 bg-paper-white'
                      }`}
                    >
                      <Icon size={14} className={`transition-colors duration-500 ${isActive ? 'text-white' : 'text-brand-violet/50'}`} strokeWidth={1.75} />
                    </div>
                    <span className={`text-xs font-semibold tracking-[0.16em] transition-colors duration-500 ${isActive ? 'text-brand-violet' : 'text-ink/35'}`}>
                      {step.number}
                    </span>
                    <h3 className={`font-display text-lg font-semibold mt-1 mb-1.5 transition-colors duration-500 ${isActive ? 'text-ink' : 'text-ink/40'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed transition-colors duration-500 ${isActive ? 'text-ink-soft' : 'text-ink/30'}`}>
                      {step.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
