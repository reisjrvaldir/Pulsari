import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { ClientLogos } from './components/ClientLogos'
import { Manifesto } from './components/Manifesto'
import { Services } from './components/Services'
import { Stack } from './components/Stack'
import { Portfolio } from './components/Portfolio'
import { Testimonials } from './components/Testimonials'
import { MarqueeStrip } from './components/MarqueeStrip'
import { TransitionBand } from './components/TransitionBand'
import { Process } from './components/Process'
import { About } from './components/About'
import { Trust } from './components/Trust'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { WhatsAppFloat } from './components/WhatsAppFloat'

function App() {
  return (
    <>
      <a
        href="#inicio"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-white focus:text-ink focus:px-4 focus:py-2 focus:rounded-full focus:shadow-soft"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main>
        <Hero />
        <ClientLogos />
        <Manifesto />
        <Services />
        <Stack />
        <Portfolio />
        <Testimonials />
        <MarqueeStrip />
        <TransitionBand />
        <Process />
        <About />
        <Trust />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}

export default App
