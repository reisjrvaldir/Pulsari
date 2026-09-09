import { describe, expect, it } from 'vitest'
import { ROLES, can, needsProjectMembership } from '../api/_lib/rbac.js'

describe('RBAC — matriz de permissões', () => {
  it('admin tem acesso total a todos os recursos', () => {
    for (const resource of ['crm', 'clients', 'projects', 'finance', 'users', 'settings']) {
      expect(can('admin', resource, 'write'), `admin deveria escrever em ${resource}`).toBe(true)
    }
  })

  it('manager tem CRM, clientes, projetos, portfólio e propostas com escrita', () => {
    for (const r of ['crm', 'clients', 'projects', 'portfolio', 'proposals']) {
      expect(can('manager', r, 'write')).toBe(true)
    }
  })

  it('manager tem financeiro apenas em leitura', () => {
    expect(can('manager', 'finance', 'read')).toBe(true)
    expect(can('manager', 'finance', 'write')).toBe(false)
  })

  it('financial escreve no financeiro mas só lê clientes e projetos', () => {
    expect(can('financial', 'finance', 'write')).toBe(true)
    expect(can('financial', 'clients', 'read')).toBe(true)
    expect(can('financial', 'clients', 'write')).toBe(false)
    expect(can('financial', 'projects', 'read')).toBe(true)
    expect(can('financial', 'projects', 'write')).toBe(false)
  })

  it('commercial cobre CRM, leads, clientes e propostas — e nada de financeiro', () => {
    for (const r of ['crm', 'leads', 'clients', 'proposals']) {
      expect(can('commercial', r, 'write')).toBe(true)
    }
    expect(can('commercial', 'finance', 'read')).toBe(false)
  })

  it('developer só alcança projetos, e sempre com escopo por vínculo', () => {
    expect(can('developer', 'projects', 'write')).toBe(true)
    expect(needsProjectMembership('developer', 'projects')).toBe(true)
    expect(can('developer', 'finance', 'read')).toBe(false)
    expect(can('developer', 'clients', 'read')).toBe(false)
  })

  it('nenhum papel além de admin escreve em users ou settings', () => {
    for (const role of ROLES.filter((r) => r !== 'admin')) {
      expect(can(role, 'users', 'write'), `${role} não deveria gerir usuários`).toBe(false)
      expect(can(role, 'settings', 'write'), `${role} não deveria mudar settings`).toBe(false)
    }
  })

  it('papel desconhecido não recebe nada', () => {
    expect(can('hacker', 'finance', 'read')).toBe(false)
    expect(can(undefined, 'crm', 'read')).toBe(false)
    expect(can(null, 'crm', 'read')).toBe(false)
  })

  it('admin não é escopado por vínculo de projeto', () => {
    expect(needsProjectMembership('admin', 'projects')).toBe(false)
    expect(needsProjectMembership('manager', 'projects')).toBe(false)
  })
})
