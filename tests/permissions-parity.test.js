import { describe, expect, it } from 'vitest'
import * as server from '../api/_lib/rbac.js'
import * as client from '../src/admin/permissions'

/**
 * A matriz de permissões existe duas vezes: no servidor (autoridade) e no
 * front (só para decidir o que mostrar). Este teste é a trava que impede as
 * duas de divergirem sem ninguém perceber.
 */
describe('paridade entre a matriz do servidor e a do front', () => {
  const ACTIONS = ['read', 'write']

  it('can() concorda em todas as combinações de papel × recurso × ação', () => {
    const divergencias = []

    for (const role of server.ROLES) {
      for (const resource of server.RESOURCES) {
        for (const action of ACTIONS) {
          const noServidor = server.can(role, resource, action)
          const noFront = client.can(role, resource, action)
          if (noServidor !== noFront) {
            divergencias.push(
              `${role} / ${resource} / ${action}: servidor=${noServidor} front=${noFront}`,
            )
          }
        }
      }
    }

    expect(divergencias, 'matrizes divergiram:\n' + divergencias.join('\n')).toEqual([])
  })

  it('needsProjectMembership() concorda em todas as combinações', () => {
    for (const role of server.ROLES) {
      for (const resource of server.RESOURCES) {
        expect(
          client.needsProjectMembership(role, resource),
          `${role} / ${resource}`,
        ).toBe(server.needsProjectMembership(role, resource))
      }
    }
  })

  it('o front cobre exatamente os mesmos papéis do servidor', () => {
    for (const role of server.ROLES) {
      // Se o papel não existisse no front, can() devolveria false em tudo.
      const temAlgumAcesso = server.RESOURCES.some((r) =>
        ACTIONS.some((a) => client.can(role, r, a)),
      )
      expect(temAlgumAcesso, `papel ${role} não existe na matriz do front`).toBe(true)
    }
  })
})
