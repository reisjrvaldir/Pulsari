import { Mail } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import { Logo } from './Logo'
import { site, mailHref, whatsappHref } from '../config/site'

export function Footer() {
  const year = new Date().getFullYear()
  const hasEmail = Boolean(site.contact.email)

  return (
    <footer className="bg-plum text-white/70">
      <div className="container-px max-w-content mx-auto py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <div>
            <Logo variant="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/55 max-w-[280px]">
              Agência digital que une estratégia, design e tecnologia para transformar ideias em experiências que
              conectam marcas, pessoas e resultados.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-white/40 mb-5">Navegação</h3>
            <ul className="space-y-3">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="text-sm hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-white/40 mb-5">Contato</h3>
            <p className="text-sm">{site.location}</p>

            {hasEmail && (
              <a
                href={mailHref()}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm hover:border-white/40 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Mail size={14} />
                {site.contact.email}
              </a>
            )}

            <div className="flex items-center gap-3 mt-5">
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noreferrer"
                aria-label={`Falar com a Pulsari no WhatsApp: ${site.contact.whatsappDisplay}`}
                className="h-10 w-10 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <SiWhatsapp size={16} />
              </a>
              <a
                href={site.contact.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label={`Pulsari no Instagram: ${site.contact.instagramHandle}`}
                className="h-10 w-10 rounded-full border border-white/15 flex items-center justify-center hover:border-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <SiInstagram size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">© {year} Pulsari. Todos os direitos reservados.</p>
          <p className="text-xs tracking-[0.14em] uppercase text-white/40">Pulsando ideias. Vibrando resultados.</p>
        </div>
      </div>
    </footer>
  )
}
