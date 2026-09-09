import { Route, Routes } from 'react-router-dom'
import { SessionProvider } from './SessionProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from './LoginPage'
import { AdminHome } from './AdminHome'

/**
 * Raiz do Pulsari Operations, montado em /admin/*.
 * Vive no mesmo deploy do site institucional para que a API fique na mesma
 * origem — é isso que permite o cookie HttpOnly sem CORS.
 */
export function AdminApp() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          index
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
      </Routes>
    </SessionProvider>
  )
}
