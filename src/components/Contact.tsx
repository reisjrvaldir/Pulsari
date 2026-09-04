import { useState } from 'react'
import { Mail, MapPin, MessageCircle, Sparkles } from 'lucide-react'
import { SiInstagram, SiWhatsapp } from 'react-icons/si'
import { Reveal } from './Reveal'
import { BriefingWizard } from './BriefingWizard'
import { site, mailHref, whatsappHref } from '../config/site'
import { trackEvent } from '../lib/analytics'

export function Contact() {
  const [showWizard, setShowWizard] = useState(false)

  return (
    <section id="contato" className="relative section-pad bg-paper-lavender/40 overflow-hidden">
      <div
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: 'linear-gradient(135deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
        aria-hidden="true"
      />

      <div className="container-px max-w-content mx-auto relative">
        <div className="max-w-2xl">
          <Reveal>
            <h2 className="font-display font-bold text-[clamp(1.9rem,4vw,3rem)] leading-tight text-ink text-balance">
              Vamos conversar sobre o seu projeto?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 text-ink-soft text-base sm:text-lg leading-relaxed text-balance">
              Chame no WhatsApp pra bater um papo rápido, ou faça um briefing guiado — em poucos minutos você já
              deixa tudo organizado pra gente te responder direto ao ponto.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 sm:mt-16 grid lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <Reveal>
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('whatsapp_click', { location: 'contact_section' })}
                className="flex items-center gap-4 card-surface p-6 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                  <SiWhatsapp size={20} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">WhatsApp</p>
                  <p className="font-display font-semibold text-ink">{site.contact.whatsappDisplay}</p>
                </div>
              </a>
            </Reveal>
            <Reveal delay={0.06}>
              <a
                href={site.contact.instagram}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent('instagram_click', { location: 'contact_section' })}
                className="flex items-center gap-4 card-surface p-6 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 rounded-2xl bg-brand-pink/10 flex items-center justify-center shrink-0">
                  <SiInstagram size={20} className="text-brand-pink" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">Instagram</p>
                  <p className="font-display font-semibold text-ink">{site.contact.instagramHandle}</p>
                </div>
              </a>
            </Reveal>
            {site.contact.email && (
              <Reveal delay={0.12}>
                <a
                  href={mailHref()}
                  onClick={() => trackEvent('email_click', { location: 'contact_section' })}
                  className="flex items-center gap-4 card-surface p-6 hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-12 w-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                    <Mail size={20} className="text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">E-mail</p>
                    <p className="font-display font-semibold text-ink">{site.contact.email}</p>
                  </div>
                </a>
              </Reveal>
            )}
            <Reveal delay={0.18}>
              <div className="flex items-center gap-4 card-surface p-6">
                <div className="h-12 w-12 rounded-2xl bg-brand-violet/10 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-brand-violet" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] uppercase text-ink/40">Localização</p>
                  <p className="font-display font-semibold text-ink">{site.location}</p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal delay={0.15}>
              {!showWizard ? (
                <div className="relative overflow-hidden card-surface h-full flex flex-col items-start justify-center p-8 sm:p-10">
                  <span
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ backgroundImage: 'linear-gradient(90deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
                    aria-hidden="true"
                  />
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-violet/[0.08] mb-6">
                    <Sparkles size={22} className="text-brand-violet" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-ink mb-2">
                    Prefere ir direto ao ponto?
                  </h3>
                  <p className="text-ink-soft leading-relaxed mb-6">
                    Responda 4 perguntas rápidas sobre o seu projeto e a gente já recebe tudo organizado pra te dar
                    um retorno certeiro.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('briefing_wizard_start')
                      setShowWizard(true)
                    }}
                    className="btn-gradient"
                  >
                    Fazer um briefing rápido
                    <MessageCircle size={16} />
                  </button>
                </div>
              ) : (
                <BriefingWizard onClose={() => setShowWizard(false)} />
              )}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
