import { SiWhatsapp } from 'react-icons/si'
import { site, whatsappHref } from '../config/site'
import { usePrefersReducedMotion } from '../lib/hooks'
import { trackEvent } from '../lib/analytics'

export function WhatsAppFloat() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <a
      href={whatsappHref('Olá! Estava no site da Pulsari e queria tirar uma dúvida rápida.')}
      target="_blank"
      rel="noreferrer"
      aria-label={`Falar com a Pulsari no WhatsApp: ${site.contact.whatsappDisplay}`}
      onClick={() => trackEvent('whatsapp_click', { location: 'floating_button' })}
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-soft transition-transform duration-300 hover:scale-110"
    >
      {!reducedMotion && (
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40" aria-hidden="true" />
      )}
      <SiWhatsapp size={26} className="relative" />
    </a>
  )
}
