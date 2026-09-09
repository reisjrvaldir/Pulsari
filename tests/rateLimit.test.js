import { describe, expect, it } from 'vitest'
import { FAILURE_THRESHOLD, MAX_LOCKOUT_SECONDS, lockoutSecondsFor } from '../api/_lib/rateLimit.js'

describe('rate limit — bloqueio progressivo', () => {
  it('não bloqueia abaixo do limiar', () => {
    for (let i = 0; i < FAILURE_THRESHOLD; i++) {
      expect(lockoutSecondsFor(i)).toBe(0)
    }
  })

  it('bloqueia a partir da quinta falha e dobra a cada nova falha', () => {
    expect(lockoutSecondsFor(5)).toBe(60)
    expect(lockoutSecondsFor(6)).toBe(120)
    expect(lockoutSecondsFor(7)).toBe(240)
    expect(lockoutSecondsFor(8)).toBe(480)
  })

  it('respeita o teto de uma hora', () => {
    expect(lockoutSecondsFor(50)).toBe(MAX_LOCKOUT_SECONDS)
    expect(lockoutSecondsFor(1000)).toBe(MAX_LOCKOUT_SECONDS)
  })

  it('cresce de forma monotônica', () => {
    let anterior = -1
    for (let i = 0; i <= 20; i++) {
      const atual = lockoutSecondsFor(i)
      expect(atual).toBeGreaterThanOrEqual(anterior)
      anterior = atual
    }
  })
})
