/**
 * Espelho da matriz de permissões do servidor (api/_lib/rbac.js).
 *
 * Serve APENAS para a interface decidir o que mostrar. A autorização real
 * acontece no servidor — este arquivo não protege nada.
 *
 * A duplicação existe porque o servidor roda em JS e o front em TS, em
 * runtimes separados. Para que ela não se torne uma divergência silenciosa,
 * tests/permissions-parity.test.js compara as duas matrizes em todas as
 * combinações de papel × recurso × ação e falha o CI se discordarem.
 * Ao mudar uma, mude a outra.
 */
import type { Role } from './authClient'

export type Resource =
  | 'crm' | 'leads' | 'clients' | 'projects'
  | 'portfolio' | 'proposals' | 'finance' | 'users' | 'settings'

export type Action = 'read' | 'write'

const READ: Action[] = ['read']
const FULL: Action[] = ['read', 'write']

const MATRIX: Record<Role, '*' | Partial<Record<Resource, Action[]>>> = {
  admin: '*',

  manager: {
    crm: FULL,
    leads: FULL,
    clients: FULL,
    projects: FULL,
    portfolio: FULL,
    proposals: FULL,
    finance: READ,
  },

  developer: {
    projects: FULL,
  },

  financial: {
    finance: FULL,
    clients: READ,
    projects: READ,
  },

  commercial: {
    crm: FULL,
    leads: FULL,
    clients: FULL,
    proposals: FULL,
  },
}

const MEMBERSHIP_SCOPED: Partial<Record<Role, Resource[]>> = {
  developer: ['projects'],
}

export function can(role: Role, resource: Resource, action: Action = 'read'): boolean {
  const grants = MATRIX[role]
  if (!grants) return false
  if (grants === '*') return true
  const allowed = grants[resource]
  return Array.isArray(allowed) && allowed.includes(action)
}

export function needsProjectMembership(role: Role, resource: Resource): boolean {
  return (MEMBERSHIP_SCOPED[role] ?? []).includes(resource)
}
