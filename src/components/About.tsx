import { useRef } from 'react'
import { Compass, Layers, Code2, TrendingUp, Boxes, Workflow } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Reveal } from './Reveal'
import { usePrefersReducedMotion } from '../lib/hooks'

const founders = [
  {
    name: 'Shirley Gomes',
    role: 'Co-founder · Estratégia, Design e Tecnologia',
    initials: 'SG',
    photo: '/images/shirley-gomes.jpg' as string | null,
    accent: 'from-brand-pink to-brand-violet',
    skills: [
      { icon: Layers, label: 'Direção criativa' },
      { icon: Compass, label: 'Experiência do usuário' },
      { icon: Code2, label: 'Desenvolvimento de soluções digitais' },
      { icon: TrendingUp, label: 'Estratégia e crescimento' },
    ],
  },
  {
    name: 'Valdir Reis',
    role: 'Co-founder · Estratégia, Design e Tecnologia',
    initials: 'VR',
    photo: '/images/valdir-reis.jpg' as string | null,
    accent: 'from-brand-violet to-brand-blue',
    skills: [
      { icon: Boxes, label: 'Arquitetura de sistemas' },
      { icon: Code2, label: 'Desenvolvimento full-stack' },
      { icon: Workflow, label: 'Automação e integrações' },
      { icon: TrendingUp, label: 'Estratégia e performance' },
    ],
  },
]

function FounderCard({ founder, delay }: { founder: (typeof founders)[number]; delay: number }) {
  return (
    <Reveal delay={delay}>
      <div className="relative overflow-hidden card-surface h-full flex flex-col hover:shadow-soft transition-shadow duration-300">
        <div className={`relative w-full aspect-square overflow-hidden bg-gradient-to-br ${founder.accent}`}>
          {founder.photo ? (
            <img src={founder.photo} alt={founder.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-white text-5xl font-bold">{founder.initials}</span>
            </div>
          )}
        </div>

        <div className="px-6 pt-5 pb-1 text-center">
          <h3 className="font-display text-lg sm:text-xl font-bold text-ink">{founder.name}</h3>
          <p className="text-ink-soft text-sm mt-1 leading-snug">{founder.role}</p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-6 mt-auto">
          {founder.skills.map((skill) => {
            const Icon = skill.icon
            return (
              <li key={skill.label} className="flex items-start gap-2.5 min-w-0">
                <Icon size={16} className="text-ink/40 mt-0.5 shrink-0" strokeWidth={1.75} />
                <span className="text-sm text-ink-soft leading-snug break-words">{skill.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </Reveal>
  )
}

export function About() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const blobY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-60, 60])
  const blobY2 = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [50, -50])

  return (
    <section
      ref={sectionRef}
      id="sobre"
      data-dark-section
      className="relative section-pad overflow-hidden animate-gradient-pan"
      style={{
        backgroundImage: 'linear-gradient(140deg, #1D0B2B 0%, #2C1A40 35%, #3B2358 60%, #1E3A6B 85%, #1D0B2B 100%)',
        backgroundSize: '220% 220%',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      <motion.div
        style={{ y: blobY }}
        className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-pink/20 blur-3xl"
        aria-hidden="true"
      />
      <motion.div
        style={{ y: blobY2 }}
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-brand-blue/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-px max-w-content mx-auto relative">
        <div className="relative pl-7">
          <span
            className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
            style={{ backgroundImage: 'linear-gradient(180deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
            aria-hidden="true"
          />
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.8rem,4.6vw,3.4rem)] leading-tight text-white text-balance">
              Por trás da Pulsari, duas mentes que constroem juntas.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-white/70 text-base sm:text-lg leading-relaxed text-balance max-w-3xl">
              Somos uma dupla que une visão estratégica, criatividade e desenvolvimento para entregar soluções
              completas — do conceito à execução. Cada projeto passa por mãos que entendem tanto de estética quanto
              de performance.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 font-display text-lg sm:text-xl font-semibold text-white">
              Estratégia, design e tecnologia. <span className="gradient-text">Sem divisões. Sem barreiras.</span>
            </p>
          </Reveal>
        </div>

        <div className="mt-14 sm:mt-16 grid md:grid-cols-2 gap-6 sm:gap-8">
          {founders.map((founder, i) => (
            <FounderCard key={founder.name} founder={founder} delay={0.1 * i} />
          ))}
        </div>
      </div>
    </section>
  )
}
