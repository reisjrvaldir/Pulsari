import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PublicSite } from './pages/PublicSite'

// O Operations é carregado só quando alguém abre /admin. Sem isso, todo
// visitante do site institucional baixaria o código do sistema interno junto.
const AdminApp = lazy(() =>
  import('./admin/AdminApp').then((m) => ({ default: m.AdminApp })),
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route
        path="/admin/*"
        element={
          <Suspense
            fallback={
              <div className="min-h-screen grid place-items-center bg-paper">
                <p className="text-ink-soft text-sm">Carregando…</p>
              </div>
            }
          >
            <AdminApp />
          </Suspense>
        }
      />
      {/* Qualquer outra URL cai no site institucional, como antes. */}
      <Route path="*" element={<PublicSite />} />
    </Routes>
  )
}

export default App
