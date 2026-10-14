import { expect, it } from 'vitest'
import { createAccountDeletionLimiter } from '../src/lib/account-deletion-attempts'

it('limita por usuario, no amplía la ventana al fallar y permite volver tras 15 minutos', () => {
  let now = 1000
  const limiter = createAccountDeletionLimiter(() => now)
  for (let index = 0; index < 5; index++) limiter.consume('user-1')
  now += 60_000
  expect(() => limiter.consume('user-1')).toThrowError(expect.objectContaining({ statusCode: 429 }))
  expect(() => limiter.consume('user-2')).not.toThrow()
  now = 1000 + 15 * 60_000
  expect(() => limiter.consume('user-1')).not.toThrow()
})

it('una contraseña válida permite limpiar los intentos de esa cuenta', () => {
  const limiter = createAccountDeletionLimiter(() => 1000)
  for (let index = 0; index < 5; index++) limiter.consume('user-1')
  limiter.clear('user-1')
  expect(() => limiter.consume('user-1')).not.toThrow()
})
