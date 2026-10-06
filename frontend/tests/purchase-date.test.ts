// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { futureDateIso } from '../src/lib/purchase-date'

const now = Date.parse('2026-10-06T15:00:00.000Z')

describe('futureDateIso', () => {
  it.each([
    {
      caso: 'una fecha claramente posterior',
      timestamp: Date.parse('2026-10-07T15:00:00.000Z'),
      esperado: '2026-10-07T15:00:00.000Z',
    },
    {
      caso: 'exactamente 1 ms posterior al instante actual',
      timestamp: now + 1,
      esperado: '2026-10-06T15:00:00.001Z',
    },
  ])('devuelve el ISO para $caso', ({ timestamp, esperado }) => {
    expect(futureDateIso(timestamp, now)).toBe(esperado)
  })

  it.each([
    { caso: 'exactamente 1 ms anterior al instante actual', timestamp: now - 1 },
    { caso: 'una fecha exactamente igual al instante actual', timestamp: now },
    { caso: 'un timestamp inválido (NaN)', timestamp: NaN },
  ])('rechaza $caso devolviendo null', ({ timestamp }) => {
    expect(futureDateIso(timestamp, now)).toBeNull()
  })
})
