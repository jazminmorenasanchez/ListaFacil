import { PurchaseStatus } from '../generated/prisma/client'
import { AppError } from '../lib/app-error'
import { requireHousehold } from '../lib/household-access'
import { prisma } from '../lib/prisma'

interface ShoppingListUpdate {
  quantity?: unknown
  urgent?: unknown
  purchasedQuantity?: unknown
  catalogItemId?: unknown
}

function validateQuantity(quantity: unknown, defaultValue?: number): number {
  const value = quantity === undefined ? defaultValue : quantity

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new AppError(400, 'La cantidad debe ser un entero mayor o igual a 1')
  }

  return value as number
}

async function ensureListIsEditable(transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], householdId: string) {
  const purchase = await transaction.purchase.findUnique({
    where: { householdId },
    select: { status: true },
  })

  if (purchase?.status === PurchaseStatus.IN_PROGRESS) {
    throw new AppError(409, 'La lista no puede modificarse durante una compra en curso')
  }
}

export async function getShoppingList(userId: string) {
  const { householdId } = await requireHousehold(userId)

  return prisma.shoppingListItem.findMany({
    where: { catalogItem: { householdId } },
    select: {
      id: true,
      catalogItemId: true,
      quantity: true,
      purchasedQuantity: true,
      urgent: true,
      addedAt: true,
      catalogItem: { select: { name: true } },
    },
    orderBy: [{ urgent: 'desc' }, { addedAt: 'desc' }],
  }).then((items) => items.map(({ catalogItem, ...item }) => ({ ...item, name: catalogItem.name })))
}

export async function addShoppingListItem(userId: string, catalogItemId: string, requestedQuantity: unknown) {
  const { householdId } = await requireHousehold(userId)
  const quantity = validateQuantity(requestedQuantity, 1)

  return prisma.$transaction(async (transaction) => {
    await ensureListIsEditable(transaction, householdId)
    const catalogItem = await transaction.catalogItem.findFirst({
      where: { id: catalogItemId, householdId },
      select: { id: true },
    })

    if (!catalogItem) throw new AppError(404, 'Producto de catálogo no encontrado')

    return transaction.shoppingListItem.upsert({
      where: { catalogItemId },
      create: { catalogItemId, quantity },
      update: { quantity: { increment: quantity } },
    })
  })
}

export async function updateShoppingListItem(userId: string, itemId: string, update: ShoppingListUpdate) {
  const { householdId } = await requireHousehold(userId)

  if (update.purchasedQuantity !== undefined || update.catalogItemId !== undefined) {
    throw new AppError(400, 'No se permite modificar el producto ni la cantidad comprada')
  }
  if (update.quantity === undefined && update.urgent === undefined) {
    throw new AppError(400, 'Debe indicar quantity o urgent')
  }
  const quantity = update.quantity === undefined ? undefined : validateQuantity(update.quantity)
  if (update.urgent !== undefined && typeof update.urgent !== 'boolean') {
    throw new AppError(400, 'urgent debe ser booleano')
  }

  return prisma.$transaction(async (transaction) => {
    await ensureListIsEditable(transaction, householdId)
    const item = await transaction.shoppingListItem.findFirst({
      where: { id: itemId, catalogItem: { householdId } },
    })

    if (!item) throw new AppError(404, 'Item de lista no encontrado')
    if (quantity !== undefined && quantity < item.purchasedQuantity) {
      throw new AppError(400, 'La cantidad no puede ser menor que la cantidad comprada')
    }

    return transaction.shoppingListItem.update({
      where: { id: item.id },
      data: {
        ...(quantity !== undefined ? { quantity } : {}),
        ...(typeof update.urgent === 'boolean' ? { urgent: update.urgent } : {}),
      },
    })
  })
}

export async function deleteShoppingListItem(userId: string, itemId: string): Promise<void> {
  const { householdId } = await requireHousehold(userId)

  await prisma.$transaction(async (transaction) => {
    await ensureListIsEditable(transaction, householdId)
    const item = await transaction.shoppingListItem.findFirst({
      where: { id: itemId, catalogItem: { householdId } },
      select: { id: true },
    })

    if (!item) throw new AppError(404, 'Item de lista no encontrado')
    await transaction.shoppingListItem.delete({ where: { id: item.id } })
  })
}
