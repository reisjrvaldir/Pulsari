import { useEffect } from 'react'

export default function ScrollReveal() {
  useEffect(() => {
    const observe = () => {
      const els = document.querySelectorAll('.rev:not(.on), .revl:not(.on), .revr:not(.on)')
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on') }),
        { threshold: 0.06, rootMargin: '0px' }
      )
      els.forEach(el => obs.observe(el))
      return obs
    }

    let obs = observe()
    /* re-observa quando o DOM muda (portfólio/contato têm conteúdo dinâmico) */
    const mut = new MutationObserver(() => { obs.disconnect(); obs = observe() })
    mut.observe(document.body, { childList: true, subtree: true })

    return () => { obs.disconnect(); mut.disconnect() }
  }, [])
  return null
}
