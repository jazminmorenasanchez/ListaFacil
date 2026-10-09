import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/lib/app-error'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('../src/lib/prisma', () => ({ prisma: { user: { findUnique } } }))

import { requireHousehold, requireHouseholdAdmin } from '../src/lib/household-access'

describe('household access', () => {
  it.each([
    { scenario: 'usuario inexistente', user: null, admin: false, statusCode: 401, message: 'Usuario no autenticado' },
    { scenario: 'usuario sin hogar', user: { id: 'user-1', householdId: null, role: 'MEMBER' }, admin: false, statusCode: 403, message: 'El usuario debe pertenecer a un hogar' },
    { scenario: 'MEMBER no administra', user: { id: 'user-1', householdId: 'household-1', role: 'MEMBER' }, admin: true, statusCode: 403, message: 'Solo un administrador puede realizar esta acción' },
    { scenario: 'ADMIN permitido', user: { id: 'user-1', householdId: 'household-1', role: 'ADMIN' }, admin: true, statusCode: null, message: null },
  ])('$scenario', async ({ user, admin, statusCode, message }) => {
    findUnique.mockReset().mockResolvedValue(user)
    const result = admin ? requireHouseholdAdmin('user-1') : requireHousehold('user-1')
    if (statusCode === null) {
      await expect(result).resolves.toEqual({ userId: 'user-1', householdId: 'household-1', role: 'ADMIN' })
    } else {
      await expect(result).rejects.toBeInstanceOf(AppError)
      await expect(result).rejects.toMatchObject({ statusCode, message })
    }
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'user-1' }, select: { id: true, householdId: true, role: true },
    })
  })
})
