import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { useSession } from './session-context'
import { can } from './permissions'
import type { Resource } from './permissions'

/**
 * Moldura comum do Operations: cabeçalho, navegação e área de conteúdo.
 *
 * Os itens de navegação somem para quem não tem permissão — conveniência, não
 * segurança. Cada rota da API decide sozinha quem pode chamá-la; esconder o
 * link só evita que a pessoa clique num lugar onde tomaria 403.
 */
const NAVEGACAO: { para: string; rotulo: string; recurso: Resource }[] = [
  { para: '/admin', rotulo: 'Início', recurso: 'crm' },
  { para: '/admin/proposals', rotulo: 'Propostas', recurso: 'proposals' },
]

export function AdminLayout() {
  const { user, signOut } = useSession()
  if (!user) return null

  const itens = NAVEGACAO.filter((i) => i.para === '/admin' || can(user.role, i.recurso, 'read'))

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-white">
        <div className="container-px max-w-content mx-auto flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-8">
            <Link to="/admin"><Logo /></Link>
            <nav className="flex items-center gap-1">
              {itens.map((i) => (
                <NavLink
                  key={i.para}
                  to={i.para}
                  end={i.para === '/admin'}
                  className={({ isActive }) =>
                    `rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                      isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                    }`
                  }
                >
                  {i.rotulo}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={() => { void signOut() }}
              className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft hover:text-ink"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container-px max-w-content mx-auto py-10">
        <Outlet />
      </main>
    </div>
  )
}
