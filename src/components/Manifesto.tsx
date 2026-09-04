import { Eye, Crosshair, Zap } from 'lucide-react'
import { Reveal } from './Reveal'
import { HighlightText } from './HighlightText'

const principles = [
  {
    icon: Eye,
    title: 'Clareza',
    text: 'Ideias simples de entender, navegar e utilizar.',
  },
  {
    icon: Crosshair,
    title: 'Relevância',
    text: 'Soluções pensadas para pessoas, negócios e contextos reais.',
  },
  {
    icon: Zap,
    title: 'Impacto',
    text: 'Experiências que fortalecem marcas e movimentam resultados.',
  },
]

export function Manifesto() {
  return (
    <section id="manifesto" className="section-pad bg-paper">
      <div className="container-px max-w-content mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-7">
            <Reveal blur>
              <p className="font-serif italic text-[clamp(1.9rem,4.2vw,3.4rem)] leading-[1.15] text-ink text-balance">
                <HighlightText text="Uma ideia pode começar pequena." />
                <br />O impacto dela não precisa ser.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:pt-3">
            <Reveal delay={0.15}>
              <p className="text-ink-soft text-base sm:text-lg leading-relaxed text-balance">
                Na Pulsari, estratégia, criatividade e tecnologia caminham juntas. Entendemos o contexto, definimos a
                direção e transformamos ideias em experiências digitais claras, relevantes e preparadas para crescer.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 sm:mt-20 grid sm:grid-cols-3 gap-6 sm:gap-8">
          {principles.map((p, i) => {
            const Icon = p.icon
            return (
              <Reveal key={p.title} delay={0.1 * i}>
                <div className="hover-fill-gradient group card-surface h-full p-7 sm:p-8 relative overflow-hidden hover:-translate-y-1.5 hover:shadow-soft hover:border-transparent transition-all duration-300">
                  <span
                    className="absolute inset-x-0 top-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundImage: 'linear-gradient(90deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
                    aria-hidden="true"
                  />
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-violet/[0.08] group-hover:bg-white/15 mb-6 transition-colors duration-300">
                    <Icon
                      size={20}
                      className="text-brand-violet group-hover:text-white transition-all duration-300 group-hover:scale-110"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink group-hover:text-white mb-2 transition-colors duration-300">
                    {p.title}
                  </h3>
                  <p className="text-ink-soft group-hover:text-white/85 leading-relaxed transition-colors duration-300">
                    {p.text}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
