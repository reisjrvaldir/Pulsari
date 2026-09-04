import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, CheckCircle2, X } from 'lucide-react'
import { Reveal } from './Reveal'
import { usePrefersReducedMotion } from '../lib/hooks'

// Vídeos reais de cada projeto em /public/video, com link para o site publicado.
// Contexto, solução, serviços entregues e depoimentos são reais, enviados
// pela própria Pulsari — Dr. Drummond ainda não tem depoimento porque nenhum
// foi enviado até agora. A "stack" de cada case reflete apenas o que já está
// descrito na entrega (ex: WordPress citado explicitamente) ou tecnologias
// genéricas presentes em qualquer site (HTML/CSS/JS), sem inventar detalhes
// técnicos não confirmados.
export const projects = [
  {
    number: '01',
    name: 'Cardassi & Saad',
    url: 'https://cardassisaad.adv.br/',
    video: '/video/cardassi.mp4',
    cropTop: 19,
    cropBottom: 4,
    gradient: 'from-[#1D0B2B] via-[#3B2358] to-[#8B5CF6]',
    category: 'Direito · Site Institucional',
    filterKey: 'institucional',
    tagline:
      'Assessoria Especializada na Solução de Problemas que Envolvem Licitações de Obras Públicas e em Questões Relacionadas à Execução de Obras Públicas e Privadas',
    description:
      'Escritório de advocacia especializado em licitações e na execução de obras públicas e privadas. A Pulsari desenvolveu o site institucional completo, com posicionamento claro sobre as áreas de atuação do escritório.',
    services: ['Desenvolvimento do site institucional completo', 'Gestão de redes sociais', 'Criação de conteúdo'],
    stack: ['HTML', 'CSS', 'JavaScript'],
    testimonial:
      'Gostaria de registrar meu elogio ao Valdir, CEO da Pulsari Marketing Digital, pela cordialidade, profissionalismo e atenção demonstrados durante o atendimento. A empresa Pulsari também merece reconhecimento pela organização e pela qualidade da apresentação de seus serviços. Tem sido uma experiência positiva e conduzida de forma bastante profissional! Parabéns Valdir e toda a equipe "Pulsari"!',
  },
  {
    number: '02',
    name: 'Hospital Veterinário Dr. Drummond',
    url: 'https://hvdrdrummond.com.br/',
    video: '/video/dr-drummond.mp4',
    cropTop: 14,
    cropBottom: 7,
    gradient: 'from-[#1D0B2B] via-[#5B2450] to-[#FF2BA6]',
    category: 'Saúde Animal · Site Institucional',
    filterKey: 'institucional',
    description:
      'Hospital veterinário com mais de 60 anos de história. A Pulsari reestruturou o blog que já existia em WordPress e criou o site institucional completo, unificando a comunicação digital do hospital.',
    services: ['Reestruturação do blog em WordPress', 'Criação do site institucional completo'],
    stack: ['WordPress', 'HTML', 'CSS'],
  },
  {
    number: '03',
    name: 'Atenxo',
    url: 'https://atenxo.com.br/',
    video: '/video/atenxo.mp4',
    cropTop: 0,
    cropBottom: 8,
    gradient: 'from-[#1D0B2B] via-[#1E3A6B] to-[#3B82F6]',
    category: 'SaaS · Automação de Atendimento',
    filterKey: 'automacao',
    description:
      'Plataforma SaaS de automação de atendimento via WhatsApp, com agente de inteligência artificial, CRM em formato Kanban, atendimento humano integrado e agenda conectada ao Google Agenda. A Pulsari desenvolveu o sistema completo, incluindo a estrutura de planos de assinatura e a comparação de recursos entre eles.',
    services: [
      'Desenvolvimento do sistema de automação via WhatsApp',
      'Estrutura de planos e assinaturas',
      'Integração com agente de IA e CRM',
    ],
    stack: ['Next.js', 'Node.js', 'TypeScript', 'IA / LLM'],
    testimonial:
      'Queríamos que o Atenxo fosse simples para quem usa, mesmo tendo muita tecnologia por trás. A Pulsari conseguiu transformar essa ideia em uma identidade moderna e em uma experiência que comunica muito bem o nosso produto.',
  },
  {
    number: '04',
    name: 'ONG Star',
    url: 'https://ongstar.org/',
    video: '/video/ong.mp4',
    cropTop: 21,
    cropBottom: 1,
    gradient: 'from-[#1D0B2B] via-[#4A1F5C] to-[#FF2BA6]',
    category: 'Terceiro Setor · Site Institucional',
    filterKey: 'institucional',
    description:
      'Organização social "Somos Todos Anjos Raros". A Pulsari criou o site institucional da ONG com integração de meios de pagamento, permitindo que doações sejam recebidas via Pix e cartão diretamente pelo site.',
    services: ['Criação do site institucional', 'Integração de pagamentos via Pix e cartão'],
    stack: ['HTML', 'CSS', 'JavaScript', 'Integração Pix/Cartão'],
    testimonial:
      'Nosso trabalho carrega muitas histórias, então era importante que o projeto transmitisse acolhimento e propósito. Sentimos esse cuidado durante todo o processo, e o resultado conseguiu representar a ONG Star de um jeito bonito, respeitoso e verdadeiro.',
  },
  {
    number: '05',
    name: 'Alpha LED',
    url: 'https://alphaledpaineis.com.br/gestao-de-midia/',
    video: '/video/alphaled.mp4',
    cropTop: 25,
    cropBottom: 1,
    gradient: 'from-[#1D0B2B] via-[#2C1A40] to-[#8B5CF6]',
    category: 'Mídia Indoor/Outdoor · Páginas e Conteúdo',
    filterKey: 'landing',
    description:
      'Empresa especializada em painéis de LED e gestão de mídia indoor e outdoor. A Pulsari criou novas páginas sobre a estrutura já existente em WordPress, incluindo um mapa interativo com os pontos de outdoor disponíveis, além da produção de conteúdo para o site.',
    services: ['Criação de páginas sobre o WordPress existente', 'Mapa interativo de pontos de outdoor', 'Criação de conteúdo para o site'],
    stack: ['WordPress', 'HTML', 'CSS'],
    testimonial:
      'Trabalhar com Shirley foi uma ótima experiência, principalmente em relação ao tempo de entrega e qualidade. Além disso o ponto crucial foi seu bom entendimento sobre o nosso negócio, que possibilitou chegar num ótimo produto.',
  },
  {
    number: '06',
    name: 'Gestescolar',
    url: 'https://gestescolar.com.br/',
    video: '/video/gestescolar.mp4',
    cropTop: 17,
    cropBottom: 7,
    gradient: 'from-[#1D0B2B] via-[#1E3A6B] to-[#8B5CF6]',
    category: 'Educação · Sistema de Gestão',
    filterKey: 'sistema',
    description:
      'Sistema completo de gestão escolar, unificando toda a rotina administrativa e pedagógica em um só lugar: matrícula, notas, frequência e arquivos dos alunos, gestão de professores e equipe, e a jornada de trabalho de cada colaborador. Conta ainda com um portal exclusivo para os responsáveis acompanharem tudo à distância.',
    services: [
      'Gestão de matrículas e arquivos escolares',
      'Lançamento de notas e frequência',
      'Gestão de professores, equipe e jornada de trabalho',
      'Portal do responsável',
    ],
    stack: ['Next.js', 'Node.js', 'TypeScript', 'PostgreSQL'],
    testimonial:
      'A gente precisava apresentar o GestEscolar de uma forma mais clara e profissional. A Pulsari entendeu a proposta, organizou bem as informações e trouxe sugestões que fizeram muita diferença no resultado.',
  },
]

type Project = (typeof projects)[number]

function CardMedia({ project, eager = false }: { project: Project; eager?: boolean }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const totalCrop = project.cropTop + project.cropBottom
  const posY = totalCrop > 0 ? (project.cropTop / totalCrop) * 100 : 50

  useEffect(() => {
    const el = videoRef.current
    if (!el || reducedMotion) return

    const handleLoaded = () => {
      if (el.currentTime < 0.6) el.currentTime = 0.6
    }
    el.addEventListener('loadedmetadata', handleLoaded)

    if (eager) {
      el.play().catch(() => {})
      return () => el.removeEventListener('loadedmetadata', handleLoaded)
    }

    const wrapper = wrapperRef.current
    if (!wrapper) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.2 }
    )
    observer.observe(wrapper)
    return () => {
      el.removeEventListener('loadedmetadata', handleLoaded)
      observer.disconnect()
    }
  }, [reducedMotion, eager])

  return (
    <div ref={wrapperRef} className={`absolute inset-0 bg-gradient-to-br ${project.gradient}`}>
      {!reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: `center ${posY.toFixed(1)}%` }}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`Vídeo de apresentação do projeto ${project.name}`}
        >
          <source src={project.video} type="video/mp4" />
        </video>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  index,
  big,
  onOpen,
}: {
  project: Project
  index: number
  big: boolean
  onOpen: (project: Project) => void
}) {
  return (
    <Reveal delay={0.05 * index} className={big ? 'col-span-2 row-span-2' : ''}>
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="group relative block h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-line text-left"
      >
        <CardMedia project={project} />
        <div
          className="absolute inset-0 bg-gradient-to-t from-plum/95 via-plum/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.12em] uppercase text-white/60 truncate block">
              {project.category}
            </span>
            <h3 className="font-display text-base sm:text-xl font-bold text-white mt-1 truncate">{project.name}</h3>
          </div>
          <span className="shrink-0 inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white text-plum transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </button>
    </Reveal>
  )
}

function ProjectModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  useEffect(() => {
    if (!project) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [project, onClose])

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center overflow-y-auto bg-plum/80 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-3xl bg-paper sm:rounded-3xl overflow-hidden my-0 sm:my-auto min-h-screen sm:min-h-0"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-plum/50 text-white backdrop-blur hover:bg-plum/70 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-video bg-plum">
              <CardMedia project={project} eager />
            </div>

            <div className="p-6 sm:p-9">
              <span className="num-tag">{project.number}</span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-2">{project.name}</h3>
              <span className="inline-block mt-3 text-xs font-semibold tracking-[0.16em] uppercase text-brand-violet/80">
                {project.category}
              </span>

              {project.tagline && (
                <blockquote className="mt-5 border-l-2 border-brand-violet/40 pl-4 text-ink/70 italic leading-relaxed text-[15px]">
                  “{project.tagline}”
                </blockquote>
              )}

              <p className="mt-5 text-ink-soft leading-relaxed text-[15px]">{project.description}</p>

              <div className="mt-6">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40 mb-2.5">Entregas</p>
                <ul className="space-y-2">
                  {project.services.map((service) => (
                    <li key={service} className="flex items-start gap-2.5 text-sm text-ink-soft leading-snug">
                      <Check size={14} className="text-brand-violet mt-0.5 shrink-0" strokeWidth={2} />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40 mb-2.5">Stack utilizada</p>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-line bg-paper-lavender/60 px-3 py-1.5 text-xs font-medium text-ink-soft"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/40">
                  <CheckCircle2 size={15} />
                  Projeto entregue
                </span>
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-violet hover:text-brand-pink transition-colors"
                  >
                    Visitar site
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const filters = [
  { key: 'todos', label: 'Todos' },
  { key: 'sistema', label: 'Sistema' },
  { key: 'automacao', label: 'Automação' },
  { key: 'institucional', label: 'Site Institucional' },
  { key: 'landing', label: 'Landing Page' },
]

export function Portfolio() {
  const [active, setActive] = useState<Project | null>(null)
  const [filter, setFilter] = useState('todos')

  const filtered = filter === 'todos' ? projects : projects.filter((p) => p.filterKey === filter)

  return (
    <section id="portfolio" className="section-pad bg-paper overflow-hidden">
      <div className="container-px max-w-content mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
                Projetos com propósito, presença e resultado.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 text-ink-soft text-base sm:text-lg leading-relaxed text-balance">
                Cada projeto combina estratégia, identidade, experiência e tecnologia de acordo com o desafio de cada
                marca. Clique em um card para ver os detalhes do case.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {filters.map((f) => {
              const isActive = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'border-transparent bg-brand-violet text-white'
                      : 'border-line text-ink-soft hover:border-brand-violet/50'
                  }`}
                >
                  {f.label}
                </button>
              )
            })}
          </div>
        </Reveal>

        <div
          key={filter}
          className="mt-8 sm:mt-10 grid grid-cols-2 lg:grid-cols-3 [grid-auto-flow:dense] auto-rows-[180px] sm:auto-rows-[220px] lg:auto-rows-[240px] gap-4 sm:gap-5 animate-[fadeIn_0.3s_ease]"
        >
          {filtered.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} big={i === 0} onOpen={setActive} />
          ))}
        </div>
      </div>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </section>
  )
}
