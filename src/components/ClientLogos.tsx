const logos = [
  { name: 'Cardassi & Saad', src: '/images/logo-cardassi-saad.png' },
  { name: 'Hospital Veterinário Dr. Drummond', src: '/images/logo-dr-drummond.png' },
  { name: 'Atenxo', src: '/images/logo-atenxo.png' },
  { name: 'ONG Star', src: '/images/logo-ong-star.png' },
  { name: 'Alpha LED', src: '/images/logo-alpha-led.png' },
  { name: 'Gestescolar', src: '/images/logo-gestescolar.png' },
  { name: 'Pulsari Desk', src: '/images/logo-pulsari-desk.png', alwaysGray: true },
  { name: 'Rota Direta Transportes', src: '/images/logo-rota-direta.png' },
]

export function ClientLogos() {
  const track = [...logos, ...logos]

  return (
    <div className="relative border-y border-line bg-paper-white py-8 sm:py-10 overflow-hidden mask-fade-x">
      <div className="flex w-max items-center gap-16 sm:gap-20 whitespace-nowrap animate-marquee" aria-hidden="true">
        {track.map((logo, i) => (
          <img
            key={`${logo.name}-${i}`}
            src={logo.src}
            alt=""
            className={`h-8 sm:h-10 w-auto object-contain grayscale opacity-60 transition-all duration-300 ${
              logo.alwaysGray ? 'hover:opacity-80' : 'hover:opacity-100 hover:grayscale-0'
            }`}
          />
        ))}
      </div>
      <span className="sr-only">Clientes: {logos.map((l) => l.name).join(', ')}</span>
    </div>
  )
}
