import { Route, Routes } from 'react-router-dom'
import { SessionProvider } from './SessionProvider'
import { ProtectedRoute } from './ProtectedRoute'
import { AdminLayout } from './AdminLayout'
import { LoginPage } from './LoginPage'
import { AdminHome } from './AdminHome'
import { ProposalsList } from './proposals/ProposalsList'
import { ProposalEditor } from './proposals/ProposalEditor'
import { CrmBoard } from './crm/CrmBoard'
import { ProspectsList } from './prospects/ProspectsList'

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
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route
            path="crm"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'commercial']}>
                <CrmBoard />
              </ProtectedRoute>
            }
          />
          {/* `roles` aqui é conveniência de navegação; a autorização real
              acontece em requireRole, rota por rota, no servidor. */}
          <Route
            path="prospects"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'commercial']}>
                <ProspectsList />
              </ProtectedRoute>
            }
            />
          <Route
            path="proposals"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'commercial']}>
                <ProposalsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="proposals/new"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'commercial']}>
                <ProposalEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="proposals/:id"
            element={
              <ProtectedRoute roles={['admin', 'manager', 'commercial']}>
                <ProposalEditor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<AdminHome />} />
        </Route>
      </Routes>
    </SessionProvider>
  )
}
