import { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { whatsappHref } from '../config/site'
import { usePrefersReducedMotion } from '../lib/hooks'

const titleLines = ['Fazemos ideias', 'pulsarem no digital.']

export function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const mediaBlur = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 14])
  const mediaScale = useTransform(scrollYProgress, [0, 1], reducedMotion ? [1, 1] : [1, 1.12])
  const mediaFilter = useTransform(mediaBlur, (v) => `blur(${v}px)`)

  // Pausa o vídeo quando a hero sai da viewport, para economizar recursos.
  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reducedMotion) {
          video.play().catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <section
      id="inicio"
      ref={sectionRef}
      data-dark-section
      className="relative min-h-[90svh] sm:min-h-[95svh] lg:min-h-[100svh] w-full overflow-hidden bg-plum flex items-center"
    >
      {/* Mídia de fundo: vídeo 3D iridescente em loop, com desfoque progressivo ao rolar a página */}
      <motion.div className="absolute inset-0" style={{ filter: mediaFilter, scale: mediaScale }} aria-hidden="true">
        {!reducedMotion ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover object-right md:object-[70%_center]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/video/hero-poster.jpg"
          >
            <source src="/video/hero-ribbon.webm" type="video/webm" />
            <source src="/video/hero-ribbon.mp4" type="video/mp4" />
          </video>
        ) : (
          <img
            src="/video/hero-poster.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-right md:object-[70%_center]"
          />
        )}

        {/* Camada sutil em #1D0B2B para legibilidade do texto à esquerda */}
        <div className="absolute inset-0 bg-gradient-to-r from-plum via-plum/70 to-transparent sm:from-plum sm:via-plum/55 sm:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-plum/20" />
      </motion.div>

      <div className="relative z-10 container-px max-w-content mx-auto w-full pt-28 pb-20 sm:pt-32">
        <div className="max-w-xl">
          <h1 className="font-display font-bold text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.15] tracking-tight text-white text-balance">
            {titleLines.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.15em] -mb-[0.15em]">
                <motion.span
                  className={i === 1 ? 'gradient-text inline-block pb-[0.05em]' : 'inline-block pb-[0.05em]'}
                  initial={{ y: '110%', filter: 'blur(6px)' }}
                  animate={{ y: '0%', filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.25 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-6 text-base sm:text-lg text-white/75 leading-relaxed max-w-md text-balance"
          >
            Unimos estratégia, design e tecnologia para criar experiências digitais que conectam marcas, pessoas e
            resultados.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a href="#portfolio" className="btn-gradient">
              Conhecer projetos
              <ArrowRight size={16} />
            </a>
            <a href={whatsappHref()} className="btn-outline-light">
              Iniciar um projeto
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.05 }}
            className="mt-10 text-xs tracking-[0.18em] uppercase text-white/45"
          >
            Agência digital · Recife, PE · Brasil
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/50"
        aria-hidden="true"
      >
        <span className="text-[10px] tracking-[0.2em] uppercase">Role</span>
        <ArrowDown size={16} className={reducedMotion ? '' : 'animate-bounce'} />
      </motion.div>
    </section>
  )
}
