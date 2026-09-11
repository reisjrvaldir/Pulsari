import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicSite } from './pages/PublicSite'

// O Operations é carregado só quando alguém abre /admin. Sem isso, todo
// visitante do site institucional baixaria o código do sistema interno junto.
const AdminApp = lazy(() =>
  import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })),
)

// A proposta também sai do pacote principal: só quem recebe um link abre.
const ProposalPage = lazy(() =>
  import('./pages/ProposalPage').then((m) => ({ default: m.ProposalPage })),
)

function Carregando() {
  return (
    <div className="min-h-screen grid place-items-center bg-paper">
      <p className="text-ink-soft text-sm">Carregando…</p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<Carregando />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route
        path="/proposta/:token"
        element={
          <Suspense fallback={<Carregando />}>
            <ProposalPage />
          </Suspense>
        }
      />
      {/* Qualquer outra URL cai no site institucional, como antes. */}
      <Route path="*" element={<PublicSite />} />
    </Routes>
  )
}

export default App
