import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSession } from './session-context'
import type { Role } from './authClient'

/**
 * Portão de entrada do Operations.
 *
 * Isto é conveniência de navegação, não segurança: a autorização de verdade
 * mora em requireAuth/requireRole no servidor. Esconder um botão não protege
 * um endpoint — cada rota da API decide sozinha quem pode chamá-la.
 */
export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode
  roles?: Role[]
}) {
  const { user, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <p className="text-ink-soft text-sm">Verificando sessão…</p>
      </div>
    )
  }

  if (!user) {
    // `state` preserva o destino para voltar até ele depois do login.
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-ink mb-2">Sem permissão</h1>
          <p className="text-ink-soft">
            Seu perfil ({user.role}) não tem acesso a esta área. Fale com um administrador se
            precisar dessa permissão.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
