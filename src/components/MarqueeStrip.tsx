const items = ['Estratégia', 'Sites', 'Sistemas', 'Design', 'Automação', 'Experiências Digitais']

export function MarqueeStrip() {
  const track = [...items, ...items]

  return (
    <div className="relative border-y border-line bg-paper-white py-6 sm:py-7 overflow-hidden mask-fade-x">
      <div className="flex w-max items-center gap-10 sm:gap-14 whitespace-nowrap animate-marquee" aria-hidden="true">
        {track.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-10 sm:gap-14">
            <span className="font-display text-lg sm:text-xl font-semibold tracking-wide text-ink/70">{item}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-violet/50" />
          </span>
        ))}
      </div>
      <span className="sr-only">Estratégia, Sites, Sistemas, Design, Automação, Experiências Digitais</span>
    </div>
  )
}
