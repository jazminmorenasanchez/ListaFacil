import { Prisma, PurchaseStatus, UserRole } from '../generated/prisma/client'
import { AppError } from './app-error'
import { prisma } from './prisma'

type DepartingUser = { id: string; householdId: string | null; role: UserRole }

export function activePurchaseMessage(status: PurchaseStatus): string {
  return status === PurchaseStatus.SCHEDULED
    ? 'El responsable debe liberar la compra programada antes de salir del hogar'
    : 'El responsable debe finalizar la compra en curso antes de salir del hogar'
}

// Internal shared operation: callers own the transaction, never commit here.
export async function detachFromHousehold(transaction: Prisma.TransactionClient, user: DepartingUser): Promise<void> {
  if (!user.householdId) return

  const purchase = await transaction.purchase.findUnique({ where: { householdId: user.householdId } })
  if (purchase?.responsibleUserId === user.id) {
    throw new AppError(409, activePurchaseMessage(purchase.status))
  }

  const nextMember = await transaction.user.findFirst({
    where: { householdId: user.householdId, id: { not: user.id } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  if (nextMember && user.role === UserRole.ADMIN) {
    await transaction.user.update({ where: { id: nextMember.id }, data: { role: UserRole.ADMIN } })
  }
  await transaction.user.update({
    where: { id: user.id }, data: { householdId: null, role: UserRole.MEMBER },
  })
  if (!nextMember) {
    await transaction.shoppingListItem.deleteMany({ where: { catalogItem: { householdId: user.householdId } } })
    await transaction.catalogItem.deleteMany({ where: { householdId: user.householdId } })
    await transaction.purchase.deleteMany({ where: { householdId: user.householdId } })
    await transaction.household.delete({ where: { id: user.householdId } })
  }
}

export async function householdTransaction(operation: (transaction: Prisma.TransactionClient) => Promise<void>): Promise<void> {
  try {
    await prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error
        && ['P2034', 'P2003', 'P2025'].includes(String(error.code))) {
      throw new AppError(409, 'La cuenta o el hogar cambiaron durante la operación; intentá nuevamente')
    }
    throw error
  }
}
