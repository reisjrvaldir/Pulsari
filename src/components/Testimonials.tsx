import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { Reveal } from './Reveal'
import { projects } from './Portfolio'

const testimonials = projects.filter((project) => project.testimonial)
const PER_PAGE = 3
const pageCount = Math.ceil(testimonials.length / PER_PAGE)

export function Testimonials() {
  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(1)

  const go = (dir: number) => {
    setDirection(dir)
    setPage((p) => (p + dir + pageCount) % pageCount)
  }

  const goTo = (i: number) => {
    setDirection(i > page ? 1 : -1)
    setPage(i)
  }

  const items = testimonials.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE)

  return (
    <section className="section-pad bg-paper-lavender/40 border-y border-line overflow-hidden">
      <div className="container-px max-w-content mx-auto">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
              Quem trabalhou com a gente, conta como foi.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-ink-soft text-base sm:text-lg leading-relaxed text-balance">
              Depoimentos reais de clientes que passaram pelo processo da Pulsari.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 sm:mt-16 flex items-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Depoimentos anteriores"
            className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-line bg-white text-ink/60 hover:border-brand-violet/50 hover:text-brand-violet transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="relative flex-1 min-w-0 overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                initial={{ opacity: 0, x: direction * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -48, position: 'absolute' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {items.map((project) => (
                  <div key={project.name} className="card-surface h-full p-6 sm:p-7 flex flex-col text-left">
                    <Quote size={20} className="text-brand-violet/40 shrink-0" />
                    <p className="mt-4 text-ink/80 italic leading-relaxed text-sm flex-1">{project.testimonial}</p>
                    <div className="mt-5 pt-4 border-t border-line">
                      <p className="font-display font-semibold text-ink text-sm">{project.name}</p>
                      <p className="text-xs text-ink-soft mt-0.5">{project.category}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Próximos depoimentos"
            className="shrink-0 inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-line bg-white text-ink/60 hover:border-brand-violet/50 hover:text-brand-violet transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {pageCount > 1 && (
          <div className="mt-7 flex items-center justify-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ver página ${i + 1} de depoimentos`}
                aria-current={i === page}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === page ? 'w-6 bg-brand-violet' : 'w-2 bg-line hover:bg-brand-violet/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
