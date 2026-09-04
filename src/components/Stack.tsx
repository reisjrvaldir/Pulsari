import { Bot, Database, Palette, PenTool } from 'lucide-react'
import {
  SiVercel,
  SiSupabase,
  SiNeon,
  SiWordpress,
  SiHostinger,
  SiNextdotjs,
  SiNodedotjs,
  SiTypescript,
  SiPhp,
  SiCss,
  SiHtml5,
  SiJavascript,
  SiPython,
  SiGithub,
  SiGooglegemini,
  SiClaude,
} from 'react-icons/si'
import { Reveal } from './Reveal'

const tools = [
  { name: 'Vercel', Icon: SiVercel },
  { name: 'Supabase', Icon: SiSupabase },
  { name: 'Neon', Icon: SiNeon },
  { name: 'WordPress', Icon: SiWordpress },
  { name: 'Hostinger', Icon: SiHostinger },
  { name: 'Next.js', Icon: SiNextdotjs },
  { name: 'Node.js', Icon: SiNodedotjs },
  { name: 'TypeScript', Icon: SiTypescript },
  { name: 'PHP', Icon: SiPhp },
  { name: 'SQL', Icon: Database },
]

const tools2 = [
  { name: 'HTML', Icon: SiHtml5 },
  { name: 'CSS', Icon: SiCss },
  { name: 'JavaScript', Icon: SiJavascript },
  { name: 'Python', Icon: SiPython },
  { name: 'GitHub', Icon: SiGithub },
  { name: 'Canva', Icon: Palette },
  { name: 'Affinity', Icon: PenTool },
  { name: 'Gemini', Icon: SiGooglegemini },
  { name: 'ChatGPT', Icon: Bot },
  { name: 'Claude', Icon: SiClaude },
]

function MarqueeRow({ row, reverse = false }: { row: typeof tools; reverse?: boolean }) {
  const track = [...row, ...row]
  return (
    <div className="overflow-hidden mask-fade-x">
      <div
        className="flex w-max items-center gap-14 sm:gap-20 py-3 animate-marquee hover:[animation-play-state:paused]"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
        aria-hidden="true"
      >
        {track.map((tool, i) => {
          const { Icon } = tool
          return (
            <div key={`${tool.name}-${i}`} className="group flex flex-col items-center gap-2.5 shrink-0">
              <Icon
                size={36}
                className="text-white/45 transition-all duration-300 group-hover:text-white group-hover:scale-110"
              />
              <span className="text-[11px] font-medium tracking-wide text-white/25 group-hover:text-white/70 transition-colors duration-300 whitespace-nowrap">
                {tool.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Stack() {
  return (
    <section id="stack" data-dark-section className="section-pad bg-plum overflow-hidden">
      <div className="container-px max-w-content mx-auto">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-white text-balance">
              Stack que usamos no dia a dia.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-white/60 text-base sm:text-lg leading-relaxed text-balance">
              As ferramentas e tecnologias que sustentam cada entrega, do design ao código.
            </p>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.15}>
        <div className="mt-14 sm:mt-16 flex flex-col gap-8 sm:gap-10">
          <MarqueeRow row={tools} />
          <MarqueeRow row={tools2} reverse />
        </div>
      </Reveal>
    </section>
  )
}
