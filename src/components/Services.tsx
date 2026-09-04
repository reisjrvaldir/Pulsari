import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Compass, Palette, LayoutTemplate, Boxes, Workflow, Clapperboard, Check, ChevronDown } from 'lucide-react'
import { Reveal } from './Reveal'

const services = [
  {
    icon: Compass,
    title: 'Estratégia Digital',
    text: 'Pesquisa, posicionamento e planejamento para transformar objetivos em uma direção clara.',
    span: 'lg:col-span-4',
    accent: 'from-brand-pink to-brand-violet',
    details: [
      'Pesquisa de mercado, concorrência e público',
      'Definição de posicionamento e proposta de valor',
      'Plano de ação com prioridades e cronograma',
    ],
  },
  {
    icon: Palette,
    title: 'Design e Identidade',
    text: 'Identidades, interfaces e sistemas visuais que comunicam propósito e constroem presença.',
    span: 'lg:col-span-4',
    accent: 'from-brand-violet to-brand-blue',
    details: [
      'Identidade visual: logo, paleta e tipografia',
      'Sistemas de design e componentes reutilizáveis',
      'Interfaces (UI) pensadas para a experiência do usuário (UX)',
    ],
  },
  {
    icon: LayoutTemplate,
    title: 'Sites e Landing Pages',
    text: 'Experiências responsivas, rápidas e pensadas para posicionar, apresentar e converter.',
    span: 'lg:col-span-4',
    accent: 'from-brand-blue to-brand-violet',
    details: [
      'Páginas responsivas otimizadas para conversão',
      'Performance, SEO técnico e boas práticas de acessibilidade',
      'Deploy, domínio e hospedagem configurados',
    ],
  },
  {
    icon: Boxes,
    title: 'Sistemas e Aplicações Web',
    text: 'Soluções digitais personalizadas para organizar processos, centralizar informações e apoiar o crescimento.',
    span: 'lg:col-span-4',
    accent: 'from-brand-violet to-brand-pink',
    details: [
      'Painéis administrativos e ferramentas internas',
      'Integração com bancos de dados e APIs',
      'Arquitetura escalável, pensada para crescer com o negócio',
    ],
  },
  {
    icon: Workflow,
    title: 'Automação e Integrações',
    text: 'Tecnologia para reduzir tarefas manuais, conectar ferramentas e melhorar a experiência entre empresas e clientes.',
    span: 'lg:col-span-4',
    accent: 'from-brand-pink to-brand-blue',
    details: [
      'Conexão entre ferramentas (CRM, planilhas, WhatsApp e outras)',
      'Fluxos automatizados que eliminam tarefas manuais',
      'Uso de IA para agilizar atendimento e produção de conteúdo',
    ],
  },
  {
    icon: Clapperboard,
    title: 'Conteúdo e Direção Criativa',
    text: 'Artes, vídeos e narrativas visuais desenvolvidas para fortalecer a comunicação das marcas.',
    span: 'lg:col-span-4',
    accent: 'from-brand-blue to-brand-pink',
    details: [
      'Artes para redes sociais e campanhas',
      'Roteiro e produção de vídeos',
      'Direção de arte alinhada à identidade da marca',
    ],
  },
]

export function Services() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="servicos" className="section-pad bg-paper-lavender/40">
      <div className="container-px max-w-content mx-auto">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
              Tudo o que uma ideia precisa para ganhar forma.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-ink-soft text-base sm:text-lg leading-relaxed text-balance">
              Da estratégia à publicação, conectamos as competências necessárias para transformar possibilidades em
              experiências digitais completas.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {services.map((service, i) => {
            const Icon = service.icon
            const isOpen = openIndex === i
            return (
              <Reveal key={service.title} delay={0.08 * i} className={service.span}>
                <div className="group card-surface h-full p-7 sm:p-8 flex flex-col hover:shadow-soft hover:border-transparent relative overflow-hidden transition-shadow duration-300">
                  <span
                    className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${service.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    aria-hidden="true"
                  />

                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-violet/[0.08] mb-6 shrink-0">
                    <Icon
                      size={22}
                      className="text-brand-violet transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                      strokeWidth={1.75}
                    />
                  </div>

                  <h3 className="font-display text-lg sm:text-xl font-semibold text-ink mb-2.5">{service.title}</h3>
                  <p className="text-ink-soft leading-relaxed text-[15px] flex-1">{service.text}</p>

                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/40 hover:text-brand-violet transition-colors duration-300 self-start"
                  >
                    {isOpen ? 'Ver menos' : 'Saiba mais'}
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-4 pt-4 border-t border-line space-y-2.5">
                          {service.details.map((detail) => (
                            <li key={detail} className="flex items-start gap-2.5 text-sm text-ink-soft leading-snug">
                              <Check size={14} className="text-brand-violet mt-0.5 shrink-0" strokeWidth={2} />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
