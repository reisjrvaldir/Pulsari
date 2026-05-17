import { useEffect } from 'react'
import Lenis from 'lenis'
import Cursor from './components/Cursor'
import Navbar from './components/Navbar'
import GlobeScene from './components/GlobeScene'
import ScrollReveal from './components/ScrollReveal'
import Hero from './sections/Hero'
import Stats from './sections/Stats'
import About from './sections/About'
import Fluxo from './sections/Fluxo'
import Portfolio from './sections/Portfolio'
import Contact from './sections/Contact'
import Team from './sections/Team'
import Footer from './sections/Footer'
import './styles/globals.css'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  return (
    <>
      <Cursor />
      <GlobeScene />
      <ScrollReveal />
      <div id="scroll-container" style={{ position: 'relative', zIndex: 1 }}>
        <Navbar />
        <Hero />
        <Stats />
        <About />
        <Fluxo />
        <Portfolio />
        <Contact />
        <Team />
        <Footer />
      </div>
    </>
  )
}
