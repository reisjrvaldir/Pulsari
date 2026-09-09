import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom não implementa estas APIs; o site as usa em praticamente toda seção
// (Reveal, useInView, useCanHover, usePrefersReducedMotion).
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }

  if (!window.IntersectionObserver) {
    class FakeIntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds: readonly number[] = []
      constructor(private cb: IntersectionObserverCallback) {}
      // Reporta tudo como visível: os testes verificam conteúdo, não animação.
      observe(target: Element) {
        this.cb(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        )
      }
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] { return [] }
    }
    window.IntersectionObserver =
      FakeIntersectionObserver as unknown as typeof IntersectionObserver
  }

  window.scrollTo = window.scrollTo ?? vi.fn()
  Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? vi.fn()

  // jsdom não implementa reprodução de mídia: play() devolve undefined, e o
  // Portfolio encadeia .catch() nele ao dar autoplay nos vídeos dos cases.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  HTMLMediaElement.prototype.load = vi.fn()
}
