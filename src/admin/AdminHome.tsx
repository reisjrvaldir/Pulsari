import { Link } from 'react-router-dom'
import { useSession } from './session-context'
import { can } from './permissions'
import type { Resource } from './permissions'

const MODULOS: { resource: Resource; label: string; descricao: string; para?: string }[] = [
  { resource: 'leads', label: 'Prospecção', descricao: 'Quem buscamos ativamente', para: '/admin/prospects' },
  { resource: 'crm', label: 'CRM', descricao: 'Leads e relacionamento', para: '/admin/crm' },
  { resource: 'clients', label: 'Clientes', descricao: 'Cadastro e histórico' },
  { resource: 'projects', label: 'Projetos', descricao: 'Sprints e entregas' },
  { resource: 'proposals', label: 'Propostas', descricao: 'Orçamentos e aceite', para: '/admin/proposals' },
  { resource: 'finance', label: 'Financeiro', descricao: 'Receitas e despesas' },
  { resource: 'portfolio', label: 'Portfólio', descricao: 'Cases do site' },
  { resource: 'users', label: 'Usuários', descricao: 'Equipe e permissões' },
]

export function AdminHome() {
  const { user } = useSession()
  if (!user) return null

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-ink">Pulsari Operations</h1>
      <p className="mt-1 text-ink-soft">
        Os módulos sem link ainda estão em construção.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((m) => {
          const liberado = can(user.role, m.resource, 'read')
          const disponivel = liberado && m.para

          const conteudo = (
            <>
              <h2 className="font-display font-semibold text-ink">{m.label}</h2>
              <p className="mt-1 text-sm text-ink-soft">{m.descricao}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.14em] text-ink/40">
                {!liberado ? 'Sem permissão' : m.para ? 'Abrir' : 'Em construção'}
              </p>
            </>
          )

          return disponivel ? (
            <Link
              key={m.resource}
              to={m.para!}
              className="card-surface p-6 transition-colors hover:border-brand-violet/40"
            >
              {conteudo}
            </Link>
          ) : (
            <div key={m.resource} className={`card-surface p-6 ${liberado ? 'opacity-70' : 'opacity-40'}`}>
              {conteudo}
            </div>
          )
        })}
      </div>
    </>
  )
}
