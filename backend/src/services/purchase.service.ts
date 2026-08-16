import { Prisma, PurchaseStatus } from '../generated/prisma/client'
import { AppError } from '../lib/app-error'
import { requireHousehold } from '../lib/household-access'
import { prisma } from '../lib/prisma'

const responsibleSelect = { id: true, name: true, email: true } satisfies Prisma.UserSelect

function parseDate(value: string): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new AppError(400, 'La fecha programada no es válida')
  return date
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

function assertScheduled(status: PurchaseStatus): void {
  if (status !== PurchaseStatus.SCHEDULED) throw new AppError(409, 'La compra ya está en curso')
}

function assertInProgress(status: PurchaseStatus): void {
  if (status !== PurchaseStatus.IN_PROGRESS) throw new AppError(409, 'La compra todavía no está en curso')
}

async function requireActivePurchase(transaction: Prisma.TransactionClient, householdId: string) {
  const purchase = await transaction.purchase.findUnique({ where: { householdId } })
  if (!purchase) throw new AppError(404, 'No existe una compra activa')
  return purchase
}

async function requireHouseholdMember(transaction: Prisma.TransactionClient, householdId: string, userId: string) {
  const member = await transaction.user.findFirst({
    where: { id: userId, householdId },
    select: responsibleSelect,
  })
  if (!member) throw new AppError(404, 'El responsable no pertenece al hogar')
  return member
}

export async function schedulePurchase(userId: string, responsibleUserId: string, requestedDate: string) {
  const { householdId } = await requireHousehold(userId)
  const scheduledFor = parseDate(requestedDate)

  try {
    return await prisma.$transaction(async (transaction) => {
      if (await transaction.purchase.findUnique({ where: { householdId }, select: { id: true } })) {
        throw new AppError(409, 'Ya existe una compra activa para el hogar')
      }
      await requireHouseholdMember(transaction, householdId, responsibleUserId)
      const itemCount = await transaction.shoppingListItem.count({ where: { catalogItem: { householdId } } })
      if (itemCount === 0) throw new AppError(409, 'La lista de compras está vacía')

      return transaction.purchase.create({
        data: { householdId, responsibleUserId, scheduledFor, status: PurchaseStatus.SCHEDULED },
        include: { responsibleUser: { select: responsibleSelect } },
      })
    })
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AppError(409, 'Ya existe una compra activa para el hogar')
    throw error
  }
}

export async function getActivePurchase(userId: string) {
  const { householdId } = await requireHousehold(userId)
  const purchase = await prisma.purchase.findUnique({
    where: { householdId },
    include: { responsibleUser: { select: responsibleSelect } },
  })
  if (!purchase) return null

  const items = await prisma.shoppingListItem.findMany({
    where: { catalogItem: { householdId } },
    select: { id: true, catalogItemId: true, quantity: true, purchasedQuantity: true, urgent: true, addedAt: true, catalogItem: { select: { name: true } } },
    orderBy: [{ urgent: 'desc' }, { addedAt: 'desc' }],
  })
  return {
    ...purchase,
    items: items.map(({ catalogItem, ...item }) => ({ ...item, name: catalogItem.name })),
  }
}

export async function changeResponsible(userId: string, responsibleUserId: string) {
  const { householdId } = await requireHousehold(userId)
  return prisma.$transaction(async (transaction) => {
    const purchase = await requireActivePurchase(transaction, householdId)
    assertScheduled(purchase.status)
    await requireHouseholdMember(transaction, householdId, responsibleUserId)
    return transaction.purchase.update({
      where: { id: purchase.id },
      data: { responsibleUserId },
      include: { responsibleUser: { select: responsibleSelect } },
    })
  })
}

export async function postponePurchase(userId: string, requestedDate: string) {
  const { householdId } = await requireHousehold(userId)
  const scheduledFor = parseDate(requestedDate)
  return prisma.$transaction(async (transaction) => {
    const purchase = await requireActivePurchase(transaction, householdId)
    assertScheduled(purchase.status)
    return transaction.purchase.update({ where: { id: purchase.id }, data: { scheduledFor } })
  })
}

export async function releasePurchase(userId: string): Promise<void> {
  const { householdId } = await requireHousehold(userId)
  await prisma.$transaction(async (transaction) => {
    const purchase = await requireActivePurchase(transaction, householdId)
    assertScheduled(purchase.status)
    await transaction.purchase.delete({ where: { id: purchase.id } })
  })
}

export async function startPurchase(userId: string) {
  const { householdId } = await requireHousehold(userId)
  return prisma.$transaction(async (transaction) => {
    const purchase = await requireActivePurchase(transaction, householdId)
    assertScheduled(purchase.status)
    if (purchase.responsibleUserId !== userId) throw new AppError(403, 'Solo el responsable puede iniciar la compra')

    return transaction.purchase.update({
      where: { id: purchase.id },
      data: { status: PurchaseStatus.IN_PROGRESS, startedAt: new Date() },
      include: { responsibleUser: { select: responsibleSelect } },
    })
  })
}

export async function updatePurchasedQuantity(userId: string, itemId: string, requestedQuantity: unknown) {
  if (!Number.isInteger(requestedQuantity) || (requestedQuantity as number) < 0) {
    throw new AppError(400, 'La cantidad comprada debe ser un entero mayor o igual a 0')
  }
  const purchasedQuantity = requestedQuantity as number
  const { householdId } = await requireHousehold(userId)

  return prisma.$transaction(async (transaction) => {
    const purchase = await requireActivePurchase(transaction, householdId)
    assertInProgress(purchase.status)
    if (purchase.responsibleUserId !== userId) throw new AppError(403, 'Solo el responsable puede registrar cantidades compradas')
    const item = await transaction.shoppingListItem.findFirst({ where: { id: itemId, catalogItem: { householdId } } })
    if (!item) throw new AppError(404, 'Item de lista no encontrado')
    if (purchasedQuantity > item.quantity) throw new AppError(400, 'La cantidad comprada no puede superar la cantidad pendiente')

    return transaction.shoppingListItem.update({ where: { id: item.id }, data: { purchasedQuantity } })
  })
}

export async function finishPurchase(userId: string) {
  const { householdId } = await requireHousehold(userId)

  try {
    return await prisma.$transaction(async (transaction) => {
      const purchase = await requireActivePurchase(transaction, householdId)
      assertInProgress(purchase.status)
      if (purchase.responsibleUserId !== userId) throw new AppError(403, 'Solo el responsable puede finalizar la compra')

      const items = await transaction.shoppingListItem.findMany({ where: { catalogItem: { householdId } } })
      const completedIds = items.filter((item) => item.purchasedQuantity === item.quantity).map((item) => item.id)
      const partialItems = items.filter((item) => item.purchasedQuantity > 0 && item.purchasedQuantity < item.quantity)

      if (completedIds.length) await transaction.shoppingListItem.deleteMany({ where: { id: { in: completedIds } } })
      for (const item of partialItems) {
        await transaction.shoppingListItem.update({
          where: { id: item.id },
          data: { quantity: item.quantity - item.purchasedQuantity, purchasedQuantity: 0 },
        })
      }
      await transaction.purchase.delete({ where: { id: purchase.id } })
      return { completedItems: completedIds.length, partialItems: partialItems.length, pendingItems: items.length - completedIds.length }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2034') {
      throw new AppError(409, 'La compra cambió durante la finalización; intentá nuevamente')
    }
    throw error
  }
}
