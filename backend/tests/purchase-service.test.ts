import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/lib/app-error'

const mocks = vi.hoisted(() => ({
  requireHousehold: vi.fn(), transaction: vi.fn(), findPurchase: vi.fn(), updatePurchase: vi.fn(),
  findItem: vi.fn(), updateItem: vi.fn(),
}))
vi.mock('../src/lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }))
vi.mock('../src/lib/household-access', () => ({ requireHousehold: mocks.requireHousehold }))

import { schedulePurchase, startPurchase, updatePurchasedQuantity } from '../src/services/purchase.service'

const now = new Date('2026-10-06T15:00:00.000Z')

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(now)
  mocks.requireHousehold.mockResolvedValue({ householdId: 'household-1' })
})
afterEach(() => { vi.useRealTimers() })

describe('purchase rules', () => {
  it.each([
    { date: 'invalid-date', message: 'La fecha programada no es válida' },
    { date: '2026-10-06T14:59:59.000Z', message: 'La fecha programada debe ser futura' },
    { date: now.toISOString(), message: 'La fecha programada debe ser futura' },
  ])('rechaza fecha $date antes de abrir una transacción', async ({ date, message }) => {
    const result = schedulePurchase('user-1', 'user-1', date)
    await expect(result).rejects.toBeInstanceOf(AppError)
    await expect(result).rejects.toMatchObject({ statusCode: 400, message })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it.each([
    { scenario: 'responsable y SCHEDULED', responsibleUserId: 'user-1', status: 'SCHEDULED', statusCode: null, message: null },
    { scenario: 'otro responsable', responsibleUserId: 'user-2', status: 'SCHEDULED', statusCode: 403, message: 'Solo el responsable puede iniciar la compra' },
    { scenario: 'ya IN_PROGRESS', responsibleUserId: 'user-1', status: 'IN_PROGRESS', statusCode: 409, message: 'La compra ya está en curso' },
  ])('iniciar compra: $scenario', async ({ responsibleUserId, status, statusCode, message }) => {
    const purchase = { id: 'purchase-1', responsibleUserId, status }
    mocks.findPurchase.mockResolvedValue(purchase)
    const updated = { ...purchase, status: 'IN_PROGRESS', startedAt: now }
    mocks.updatePurchase.mockResolvedValue(updated)
    const transaction = { purchase: { findUnique: mocks.findPurchase, update: mocks.updatePurchase } }
    mocks.transaction.mockImplementation((operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction))
    const result = startPurchase('user-1')
    if (statusCode === null) {
      await expect(result).resolves.toEqual(updated)
      expect(mocks.updatePurchase).toHaveBeenCalledExactlyOnceWith({
        where: { id: 'purchase-1' }, data: { status: 'IN_PROGRESS', startedAt: now },
        include: { responsibleUser: { select: { id: true, name: true, email: true } } },
      })
    } else {
      await expect(result).rejects.toBeInstanceOf(AppError)
      await expect(result).rejects.toMatchObject({ statusCode, message })
      expect(mocks.updatePurchase).not.toHaveBeenCalled()
    }
    expect(mocks.requireHousehold).toHaveBeenCalledWith('user-1')
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.findPurchase).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'household-1' } })
  })

  it.skip.each([
    { quantity: -1, message: 'La cantidad comprada debe ser un entero mayor o igual a 0', opensTransaction: false },
    { quantity: 1.5, message: 'La cantidad comprada debe ser un entero mayor o igual a 0', opensTransaction: false },
    { quantity: 4, message: 'La cantidad comprada no puede superar la cantidad pendiente', opensTransaction: true },
    { quantity: 0, message: null, opensTransaction: true },
    { quantity: 3, message: null, opensTransaction: true },
  ])('valida límites de cantidad comprada: $quantity', async ({ quantity, message, opensTransaction }) => {
    const item = { id: 'item-1', quantity: 3, purchasedQuantity: 0 }
    mocks.findPurchase.mockResolvedValue({ id: 'purchase-1', status: 'IN_PROGRESS', responsibleUserId: 'user-1' })
    mocks.findItem.mockResolvedValue(item)
    const updated = { ...item, purchasedQuantity: quantity }
    mocks.updateItem.mockResolvedValue(updated)
    const transaction = {
      purchase: { findUnique: mocks.findPurchase },
      shoppingListItem: { findFirst: mocks.findItem, update: mocks.updateItem },
    }
    mocks.transaction.mockImplementation((operation: (tx: typeof transaction) => Promise<unknown>) => operation(transaction))
    const result = updatePurchasedQuantity('user-1', 'item-1', quantity)
    if (message !== null) {
      await expect(result).rejects.toBeInstanceOf(AppError)
      await expect(result).rejects.toMatchObject({ statusCode: 400, message })
      expect(mocks.updateItem).not.toHaveBeenCalled()
    } else {
      await expect(result).resolves.toEqual(updated)
      expect(mocks.updateItem).toHaveBeenCalledExactlyOnceWith({ where: { id: 'item-1' }, data: { purchasedQuantity: quantity } })
    }
    expect(mocks.transaction).toHaveBeenCalledTimes(opensTransaction ? 1 : 0)
    if (opensTransaction) {
      expect(mocks.findPurchase).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'household-1' } })
      expect(mocks.findItem).toHaveBeenCalledExactlyOnceWith({ where: { id: 'item-1', catalogItem: { householdId: 'household-1' } } })
    } else {
      expect(mocks.requireHousehold).not.toHaveBeenCalled()
      expect(mocks.findPurchase).not.toHaveBeenCalled()
      expect(mocks.findItem).not.toHaveBeenCalled()
    }
  })
})
