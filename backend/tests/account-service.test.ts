import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prisma, compare, consume, clear } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn() }, $transaction: vi.fn() },
  compare: vi.fn(), consume: vi.fn(), clear: vi.fn(),
}))
vi.mock('../src/lib/prisma', () => ({ prisma }))
vi.mock('bcrypt', () => ({ default: { compare } }))
vi.mock('../src/lib/account-deletion-attempts', () => ({ createAccountDeletionLimiter: () => ({ consume, clear }) }))
import { deleteOwnAccount } from '../src/services/account.service'
import { leaveHousehold } from '../src/services/household.service'

function setup(role = 'MEMBER', householdId: string | null = 'home') {
  const user = { id: 'self', householdId, role, passwordHash: 'stored-hash' }
  const transaction = {
    user: { findUnique: vi.fn().mockResolvedValue(user), findFirst: vi.fn().mockResolvedValue({ id: 'oldest' }),
      update: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue(user) },
    purchase: { findUnique: vi.fn().mockResolvedValue(null), deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    shoppingListItem: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
    catalogItem: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
    household: { delete: vi.fn().mockResolvedValue({}) },
  }
  prisma.user.findUnique.mockResolvedValue(user)
  prisma.$transaction.mockImplementation(async (operation) => operation(transaction))
  return { user, transaction }
}

beforeEach(() => { vi.resetAllMocks(); compare.mockResolvedValue(true) })

describe('delete own account', () => {
  it('elimina sin hogar y verifica la contraseña sin recortarla', async () => {
    const { transaction: tx } = setup('MEMBER', null)
    await deleteOwnAccount('self', ' password ')
    expect(compare).toHaveBeenCalledExactlyOnceWith(' password ', 'stored-hash')
    expect(tx.user.delete).toHaveBeenCalledExactlyOnceWith({ where: { id: 'self' } })
    expect(tx.purchase.findUnique).not.toHaveBeenCalled()
    expect(prisma.$transaction).toHaveBeenCalledExactlyOnceWith(expect.any(Function), { isolationLevel: 'Serializable' })
  })

  it('desvincula MEMBER sin transferir administración ni borrar datos compartidos', async () => {
    const { transaction: tx } = setup()
    await deleteOwnAccount('self', 'password')
    expect(tx.user.update).toHaveBeenCalledExactlyOnceWith({ where: { id: 'self' }, data: { householdId: null, role: 'MEMBER' } })
    expect(tx.household.delete).not.toHaveBeenCalled()
    expect(tx.catalogItem.deleteMany).not.toHaveBeenCalled()
    expect(tx.user.delete).toHaveBeenCalledExactlyOnceWith({ where: { id: 'self' } })
  })

  it('transfiere ADMIN según createdAt e ID antes de eliminar su cuenta', async () => {
    const { transaction: tx } = setup('ADMIN')
    await deleteOwnAccount('self', 'password')
    expect(tx.user.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { householdId: 'home', id: { not: 'self' } }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    expect(tx.user.update).toHaveBeenNthCalledWith(1, { where: { id: 'oldest' }, data: { role: 'ADMIN' } })
    expect(tx.user.update.mock.invocationCallOrder[0]).toBeLessThan(tx.user.delete.mock.invocationCallOrder[0])
  })

  it.each(['ADMIN', 'MEMBER'])('el último integrante %s elimina también el hogar y sus datos', async (role) => {
    const { transaction: tx } = setup(role)
    tx.user.findFirst.mockResolvedValue(null)
    await deleteOwnAccount('self', 'password')
    expect(tx.shoppingListItem.deleteMany).toHaveBeenCalledExactlyOnceWith({ where: { catalogItem: { householdId: 'home' } } })
    expect(tx.catalogItem.deleteMany).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'home' } })
    expect(tx.purchase.deleteMany).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'home' } })
    expect(tx.household.delete).toHaveBeenCalledExactlyOnceWith({ where: { id: 'home' } })
    expect(tx.shoppingListItem.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.catalogItem.deleteMany.mock.invocationCallOrder[0])
    expect(tx.household.delete.mock.invocationCallOrder[0]).toBeLessThan(tx.user.delete.mock.invocationCallOrder[0])
  })

  it('contraseña incorrecta: 403 antes de abrir transacción', async () => {
    setup(); compare.mockResolvedValue(false)
    await expect(deleteOwnAccount('self', 'wrong')).rejects.toMatchObject({ statusCode: 403, message: 'La contraseña actual es incorrecta' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
  })

  it.each([undefined, '', 42, 'a'.repeat(73)])('rechaza contraseña inválida %j sin consultar datos', async (password) => {
    await expect(deleteOwnAccount('self', password)).rejects.toMatchObject({ statusCode: 400 })
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it.each([
    ['SCHEDULED', 'El responsable debe liberar la compra programada antes de salir del hogar'],
    ['IN_PROGRESS', 'El responsable debe finalizar la compra en curso antes de salir del hogar'],
  ])('responsable de %s: 409 sin ninguna escritura', async (status, message) => {
    const { transaction: tx } = setup('ADMIN')
    tx.purchase.findUnique.mockResolvedValue({ responsibleUserId: 'self', status })
    await expect(deleteOwnAccount('self', 'password')).rejects.toMatchObject({ statusCode: 409, message })
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
    expect(tx.household.delete).not.toHaveBeenCalled()
    expect(tx.purchase.deleteMany).not.toHaveBeenCalled()
  })

  it('preserva compra de otro integrante', async () => {
    const { transaction: tx } = setup()
    tx.purchase.findUnique.mockResolvedValue({ responsibleUserId: 'oldest', status: 'IN_PROGRESS' })
    await deleteOwnAccount('self', 'password')
    expect(tx.user.delete).toHaveBeenCalledOnce()
    expect(tx.purchase.deleteMany).not.toHaveBeenCalled()
    expect(tx.shoppingListItem.deleteMany).not.toHaveBeenCalled()
  })

  it.each(['P2034', 'P2003', 'P2025'])('informa conflicto transaccional %s', async (code) => {
    setup(); prisma.$transaction.mockRejectedValue({ code })
    await expect(deleteOwnAccount('self', 'password')).rejects.toMatchObject({ statusCode: 409, message: 'La cuenta o el hogar cambiaron durante la operación; intentá nuevamente' })
  })

  it('propaga fallo tardío al caller dentro de la única transacción; el fake no demuestra rollback SQL', async () => {
    const { transaction: tx } = setup('ADMIN')
    tx.user.findFirst.mockResolvedValue(null)
    const error = new Error('delete failed')
    tx.user.delete.mockRejectedValue(error)
    await expect(deleteOwnAccount('self', 'password')).rejects.toBe(error)
    expect(prisma.$transaction).toHaveBeenCalledOnce()
    expect(tx.household.delete).toHaveBeenCalledOnce()
  })

  it('rechaza cambios de contraseña entre verificación y transacción sin escribir', async () => {
    const { user, transaction: tx } = setup()
    tx.user.findUnique.mockResolvedValue({ ...user, passwordHash: 'changed' })
    await expect(deleteOwnAccount('self', 'password')).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.user.delete).not.toHaveBeenCalled()
    expect(tx.user.update).not.toHaveBeenCalled()
  })

  it.each([false, true])('usuario eliminado antes de la lectura transaccional: %s', async (duringTransaction) => {
    const { transaction: tx } = setup()
    if (duringTransaction) tx.user.findUnique.mockResolvedValue(null)
    else prisma.user.findUnique.mockResolvedValue(null)
    await expect(deleteOwnAccount('self', 'password')).rejects.toMatchObject({ statusCode: 401, message: 'Usuario no autenticado' })
    expect(tx.user.update).not.toHaveBeenCalled()
    expect(tx.user.delete).not.toHaveBeenCalled()
    if (!duringTransaction) expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('el límite bloquea antes de verificar contraseña o escribir', async () => {
    setup(); consume.mockImplementation(() => { throw Object.assign(new Error('limited'), { statusCode: 429 }) })
    await expect(deleteOwnAccount('self', 'password')).rejects.toMatchObject({ statusCode: 429 })
    expect(compare).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

describe('leaveHousehold regression', () => {
  it.each(['ADMIN', 'MEMBER'])('desvincula %s y nunca elimina la cuenta', async (role) => {
    const { transaction: tx } = setup(role)
    await leaveHousehold('self')
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'self' }, data: { householdId: null, role: 'MEMBER' } })
    expect(tx.user.delete).not.toHaveBeenCalled()
    expect(tx.household.delete).not.toHaveBeenCalled()
    if (role === 'ADMIN') expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'oldest' }, data: { role: 'ADMIN' } })
  })
  it('último ADMIN elimina hogar pero conserva cuenta', async () => {
    const { transaction: tx } = setup('ADMIN'); tx.user.findFirst.mockResolvedValue(null)
    await leaveHousehold('self')
    expect(tx.household.delete).toHaveBeenCalledWith({ where: { id: 'home' } })
    expect(tx.user.delete).not.toHaveBeenCalled()
  })
  it('sin hogar conserva el rechazo 409', async () => {
    const { transaction: tx } = setup('MEMBER', null)
    await expect(leaveHousehold('self')).rejects.toMatchObject({ statusCode: 409, message: 'El usuario no pertenece a un hogar' })
    expect(tx.user.update).not.toHaveBeenCalled()
  })
  it.each(['SCHEDULED', 'IN_PROGRESS'])('no permite abandonar siendo responsable de %s', async (status) => {
    const { transaction: tx } = setup()
    tx.purchase.findUnique.mockResolvedValue({ responsibleUserId: 'self', status })
    await expect(leaveHousehold('self')).rejects.toMatchObject({ statusCode: 409 })
    expect(tx.user.update).not.toHaveBeenCalled()
  })
})
