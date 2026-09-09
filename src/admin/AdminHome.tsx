import { Logo } from '../components/Logo'
import { useSession } from './session-context'
import { can } from './permissions'
import type { Resource } from './permissions'

const MODULOS: { resource: Resource; label: string; descricao: string }[] = [
  { resource: 'crm', label: 'CRM', descricao: 'Leads e relacionamento' },
  { resource: 'clients', label: 'Clientes', descricao: 'Cadastro e histórico' },
  { resource: 'projects', label: 'Projetos', descricao: 'Sprints e entregas' },
  { resource: 'proposals', label: 'Propostas', descricao: 'Orçamentos e contratos' },
  { resource: 'finance', label: 'Financeiro', descricao: 'Receitas e despesas' },
  { resource: 'portfolio', label: 'Portfólio', descricao: 'Cases do site' },
  { resource: 'users', label: 'Usuários', descricao: 'Equipe e permissões' },
]

export function AdminHome() {
  const { user, signOut } = useSession()
  if (!user) return null

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-white">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
          <Logo />
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

      <main className="mx-auto max-w-content px-6 py-12">
        <h1 className="font-display text-2xl font-bold text-ink">Pulsari Operations</h1>
        <p className="mt-1 text-ink-soft">
          Fundação de segurança no ar. Os módulos abaixo chegam nas próximas sprints.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((m) => {
            const liberado = can(user.role, m.resource, 'read')
            return (
              <div
                key={m.resource}
                className={`card-surface p-6 ${liberado ? '' : 'opacity-40'}`}
              >
                <h2 className="font-display font-semibold text-ink">{m.label}</h2>
                <p className="mt-1 text-sm text-ink-soft">{m.descricao}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink/40">
                  {liberado ? 'Sprint 02' : 'Sem permissão'}
                </p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
