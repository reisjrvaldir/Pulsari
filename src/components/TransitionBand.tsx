import { Reveal } from './Reveal'

export function TransitionBand() {
  return (
    <section
      data-dark-section
      className="relative py-28 sm:py-32 overflow-hidden animate-gradient-pan"
      style={{
        backgroundImage:
          'linear-gradient(125deg, #1D0B2B 0%, #3B2358 32%, #2C1A40 55%, #1E3A6B 78%, #1D0B2B 100%)',
        backgroundSize: '220% 220%',
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      <div className="absolute -top-32 -left-20 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl animate-blob" aria-hidden="true" />
      <div
        className="absolute -bottom-32 -right-20 h-72 w-72 rounded-full bg-brand-blue/20 blur-3xl animate-blob"
        style={{ animationDelay: '4s' }}
        aria-hidden="true"
      />

      <div className="container-px max-w-content mx-auto relative text-center">
        <Reveal blur>
          <h2 className="font-display font-bold text-[clamp(1.9rem,4.5vw,3.4rem)] leading-tight text-white text-balance">
            Boas ideias precisam de <span className="gradient-text">direção</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-white/55 text-sm sm:text-base tracking-wide">
            <span>Menos ruído</span>
            <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden="true" />
            <span>Mais intenção</span>
            <span className="h-1 w-1 rounded-full bg-white/25" aria-hidden="true" />
            <span>Mais identidade</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
