import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { usePrefersReducedMotion } from '../lib/hooks'

/**
 * Efeito de "marca-texto": um retângulo lilás (sem bordas arredondadas) que
 * preenche a frase acompanhando o scroll, como se um marcador passasse por
 * cima das letras. As duas camadas (texto base + sobreposição) precisam
 * quebrar linha exatamente da mesma forma — por isso nenhuma das duas usa
 * `whitespace-nowrap`, o que evitava a quebra em telas estreitas.
 */
export function HighlightText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.35'] })
  const clip = useTransform(scrollYProgress, [0, 1], reducedMotion ? [100, 100] : [0, 100])
  const clipPath = useTransform(clip, (v) => `inset(0 ${100 - v}% 0 0)`)

  return (
    <span ref={ref} className={`relative inline-block ${className ?? ''}`}>
      <span className="relative z-0">{text}</span>
      <motion.span className="absolute inset-0 bg-brand-violet text-white" style={{ clipPath }} aria-hidden="true">
        {text}
      </motion.span>
    </span>
  )
}
