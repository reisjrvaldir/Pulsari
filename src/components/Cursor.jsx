import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    let cx = 0, cy = 0, rx = 0, ry = 0
    let raf

    const onMove = e => { cx = e.clientX; cy = e.clientY }
    window.addEventListener('mousemove', onMove)

    const loop = () => {
      if (dotRef.current) {
        dotRef.current.style.left = cx + 'px'
        dotRef.current.style.top  = cy + 'px'
      }
      rx += (cx - rx) * 0.1
      ry += (cy - ry) * 0.1
      if (ringRef.current) {
        ringRef.current.style.left = rx + 'px'
        ringRef.current.style.top  = ry + 'px'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const addHover = () => {
      dotRef.current?.classList.add('hovered')
      ringRef.current?.classList.add('hovered')
    }
    const rmHover = () => {
      dotRef.current?.classList.remove('hovered')
      ringRef.current?.classList.remove('hovered')
    }

    const interactives = document.querySelectorAll('a, button, [data-cursor]')
    interactives.forEach(el => {
      el.addEventListener('mouseenter', addHover)
      el.addEventListener('mouseleave', rmHover)
    })

    const obs = new MutationObserver(() => {
      document.querySelectorAll('a, button, [data-cursor]').forEach(el => {
        el.removeEventListener('mouseenter', addHover)
        el.removeEventListener('mouseleave', rmHover)
        el.addEventListener('mouseenter', addHover)
        el.addEventListener('mouseleave', rmHover)
      })
    })
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
      obs.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={dotRef} style={{
        position: 'fixed', width: 8, height: 8, borderRadius: '50%',
        background: 'var(--neon)', boxShadow: '0 0 10px var(--neon)',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        zIndex: 9999, transition: 'width .2s, height .2s',
      }}
        className="cursor-dot"
      />
      <div ref={ringRef} style={{
        position: 'fixed', width: 28, height: 28, borderRadius: '50%',
        border: '1px solid rgba(167,139,250,.4)',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
        zIndex: 9998, transition: 'width .2s, height .2s',
      }}
        className="cursor-ring"
      />
      <style>{`
        .cursor-dot.hovered  { width: 16px; height: 16px; }
        .cursor-ring.hovered { width: 48px; height: 48px; }
      `}</style>
    </>
  )
}
