import { useEffect, useRef, useState } from 'react'

/** Detecta a preferência de redução de movimento do usuário. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

/**
 * Retorna um ref e um booleano "inView" via IntersectionObserver,
 * usado para revelar títulos, cards e etapas conforme entram na viewport.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit & { once?: boolean } = {}
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)
  const { once = true, threshold = 0.2, rootMargin = '0px 0px -10% 0px' } = options

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.unobserve(el)
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once, threshold, rootMargin])

  return { ref, inView }
}

/** Ativa/desativa estado "scrolled" para o header compacto. */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

/** Detecta se o dispositivo tem hover real (mouse) — usado para trocar hover por clique em telas de toque. */
export function useCanHover() {
  const [canHover, setCanHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return canHover
}

/**
 * Detecta se a faixa logo abaixo do header está sobre uma seção marcada como
 * escura (`data-dark-section`), pra alternar o header entre modo claro/escuro
 * conforme o fundo que está passando por trás dele.
 */
export function useOverDarkSection(headerHeight = 72) {
  const [overDark, setOverDark] = useState(true)

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-dark-section]'))
    if (!els.length) return

    const states = new Map<Element, boolean>()
    const update = () => setOverDark(Array.from(states.values()).some(Boolean))

    const bandThickness = 4
    const bottomMargin = Math.max(0, window.innerHeight - headerHeight - bandThickness)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => states.set(entry.target, entry.isIntersecting))
        update()
      },
      { rootMargin: `-${headerHeight}px 0px -${bottomMargin}px 0px`, threshold: 0 }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headerHeight])

  return overDark
}

/** Rastreia qual seção está ativa com base na posição do scroll. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        })
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
    )

    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [ids])

  return active
}
