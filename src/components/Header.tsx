import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Logo } from './Logo'
import { site, whatsappHref } from '../config/site'
import { useActiveSection, useOverDarkSection, useScrolled } from '../lib/hooks'
import { trackEvent } from '../lib/analytics'

const sectionIds = site.nav.map((item) => item.href.replace('#', ''))

export function Header() {
  const scrolled = useScrolled(32)
  const active = useActiveSection(sectionIds)
  const overDark = useOverDarkSection(72)
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement | null>(null)

  const lightMode = overDark // header claro sempre que passa sobre uma seção escura, com o menu aberto ou não

  // Fecha o menu mobile ao clicar/tocar fora dele
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <header
      ref={headerRef}
      className={[
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        overDark
          ? scrolled || open
            ? 'bg-plum/70 backdrop-blur-md border-b border-white/10 shadow-[0_1px_0_rgba(0,0,0,0.06)]'
            : 'bg-transparent border-b border-transparent'
          : scrolled || open
            ? 'bg-paper/80 backdrop-blur-md border-b border-line shadow-[0_1px_0_rgba(0,0,0,0.02)]'
            : 'bg-transparent border-b border-transparent',
      ].join(' ')}
    >
      <div className="container-px max-w-content mx-auto flex h-[72px] items-center justify-between">
        <a href="#inicio" className="shrink-0" aria-label="Pulsari — página inicial">
          <Logo variant={lightMode ? 'light' : 'dark'} />
        </a>

        <nav className="hidden lg:flex items-center gap-1" aria-label="Navegação principal">
          {site.nav.map((item) => {
            const isActive = active === item.href.replace('#', '')
            return (
              <a
                key={item.href}
                href={item.href}
                className={[
                  'group relative px-4 py-2 text-sm font-medium tracking-wide transition-colors duration-300 rounded-full',
                  lightMode ? 'text-white/85 hover:text-white hover:bg-white/10' : 'text-ink/75 hover:text-ink hover:bg-ink/[0.05]',
                ].join(' ')}
              >
                {item.label}
                <span
                  className={[
                    'absolute left-4 right-4 -bottom-0.5 h-[2px] rounded-full transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
                  ].join(' ')}
                  style={{ backgroundImage: 'linear-gradient(90deg, #FF2BA6, #8B5CF6, #3B82F6)' }}
                  aria-hidden="true"
                />
              </a>
            )
          })}
        </nav>

        <div className="hidden lg:block">
          <a
            href={whatsappHref('Olá! Vim pelo site e quero conversar sobre um projeto.')}
            onClick={() => trackEvent('whatsapp_click', { location: 'header' })}
            className="btn-gradient"
          >
            Vamos conversar
          </a>
        </div>

        <button
          type="button"
          className={[
            'lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full transition-colors',
            lightMode ? 'text-white' : 'text-ink',
          ].join(' ')}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-paper border-t border-line">
          <nav className="container-px py-6 flex flex-col gap-1" aria-label="Navegação mobile">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-2 py-3 text-base font-medium text-ink/85 border-b border-line last:border-none"
              >
                {item.label}
              </a>
            ))}
            <a
              href={whatsappHref('Olá! Vim pelo site e quero conversar sobre um projeto.')}
              className="btn-gradient mt-5 w-full"
              onClick={() => {
                trackEvent('whatsapp_click', { location: 'header_mobile' })
                setOpen(false)
              }}
            >
              Vamos conversar
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
