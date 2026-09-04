import { useRef } from 'react'
import { ClipboardCheck, MessageCircle, Smartphone, LifeBuoy } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Reveal } from './Reveal'
import { HighlightText } from './HighlightText'
import { usePrefersReducedMotion } from '../lib/hooks'

// Nenhum depoimento, logo autorizado ou métrica comprovada foi encontrado no
// projeto — por isso, em vez de números inventados, apresentamos os
// princípios de confiança que orientam o trabalho da Pulsari.
const principles = [
  {
    icon: ClipboardCheck,
    title: 'Estratégia primeiro',
    text: 'Nada é produzido sem antes entender o objetivo por trás.',
    accent: 'from-brand-pink to-brand-violet',
  },
  {
    icon: MessageCircle,
    title: 'Comunicação constante',
    text: 'Você acompanha decisões e avanços em cada etapa do projeto.',
    accent: 'from-brand-violet to-brand-blue',
  },
  {
    icon: Smartphone,
    title: 'Experiência responsiva',
    text: 'Feito para funcionar bem em qualquer tela, do celular ao desktop.',
    accent: 'from-brand-blue to-brand-violet',
  },
  {
    icon: LifeBuoy,
    title: 'Entrega acompanhada',
    text: 'O suporte continua depois da publicação, não termina nela.',
    accent: 'from-brand-violet to-brand-pink',
  },
]

export function Trust() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-70, 70])
  const blobRotate = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 45])

  return (
    <section ref={sectionRef} className="relative py-24 sm:py-32 bg-paper-lavender/40 border-y border-line overflow-hidden">
      <motion.div
        style={{ y: blobY, rotate: blobRotate }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] sm:h-[620px] sm:w-[620px] rounded-full opacity-[0.15] blur-3xl"
        aria-hidden="true"
      >
        <div
          className="h-full w-full rounded-full"
          style={{ backgroundImage: 'linear-gradient(135deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
        />
      </motion.div>

      <div className="container-px max-w-content mx-auto relative">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
              Um jeito de trabalhar em que você <HighlightText text="nunca perde o rumo." />
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal key={item.title} delay={0.08 * i} y={32}>
                <div className="hover-fill-gradient group h-full rounded-3xl border border-line bg-white p-7 flex flex-col items-center text-center gap-4 shadow-card hover:-translate-y-2 hover:shadow-soft hover:border-transparent transition-all duration-300">
                  <div
                    className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.accent} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                  >
                    <Icon size={22} className="text-white" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink group-hover:text-white mb-1.5 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm text-ink-soft group-hover:text-white/85 leading-snug transition-colors duration-300">
                      {item.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
