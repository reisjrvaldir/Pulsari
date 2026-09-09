/**
 * Matriz de permissões — Pulsari é single-company com RBAC.
 * Não existe tenant_id nem organization_id: o escopo é a empresa inteira,
 * recortado apenas por papel (e, para developer, por vínculo com o projeto).
 */

export const ROLES = ['admin', 'manager', 'developer', 'financial', 'commercial']

export const RESOURCES = [
  'crm', 'leads', 'clients', 'projects', 'portfolio',
  'proposals', 'finance', 'users', 'settings',
]

const READ = ['read']
const FULL = ['read', 'write']

/** '*' significa acesso irrestrito a tudo. */
const MATRIX = {
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

  // Escopo adicional: só os projetos aos quais estiver vinculado.
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

/** Recursos em que o papel developer é limitado aos projetos vinculados. */
const MEMBERSHIP_SCOPED = { developer: ['projects'] }

export function can(role, resource, action = 'read') {
  const grants = MATRIX[role]
  if (!grants) return false
  if (grants === '*') return true
  const allowed = grants[resource]
  return Array.isArray(allowed) && allowed.includes(action)
}

/**
 * Diz se, além de `can()`, é preciso conferir vínculo com o projeto.
 * Quem responde true não pode receber acesso sem passar por
 * requireProjectMembership().
 */
export function needsProjectMembership(role, resource) {
  return (MEMBERSHIP_SCOPED[role] || []).includes(resource)
}
