import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useInView, usePrefersReducedMotion } from '../lib/hooks'

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  blur?: boolean
  className?: string
  as?: 'div' | 'span'
}

/**
 * Wrapper de revelação: fade + leve deslocamento vertical + blur-to-sharp opcional.
 * Respeita prefers-reduced-motion desabilitando o movimento (mantém apenas o fade).
 */
export function Reveal({ children, delay = 0, y = 24, blur = false, className, as = 'div' }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reducedMotion = usePrefersReducedMotion()

  const Comp = motion[as]

  return (
    <Comp
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        y: reducedMotion ? 0 : y,
        filter: blur && !reducedMotion ? 'blur(8px)' : 'blur(0px)',
      }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: reducedMotion ? 0 : y, filter: blur && !reducedMotion ? 'blur(8px)' : 'blur(0px)' }
      }
      transition={{ duration: reducedMotion ? 0.3 : 0.7, delay: reducedMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  )
}
