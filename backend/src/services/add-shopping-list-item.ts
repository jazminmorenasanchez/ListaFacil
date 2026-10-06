import type { Prisma, ShoppingListItem } from '../generated/prisma/client'
import { PurchaseStatus } from '../generated/prisma/enums'
import { AppError } from '../lib/app-error'

type PurchaseLookup = {
  where: { householdId: string }
  select: { status: true }
}

type CatalogLookup = {
  where: { id: string; householdId: string }
  select: { id: true }
}

type UpsertArgs = Pick<Prisma.ShoppingListItemUpsertArgs, 'where' | 'create' | 'update'>

export interface AddShoppingListTransaction {
  purchase: {
    findUnique(args: PurchaseLookup): PromiseLike<{ status: PurchaseStatus } | null>
  }
  catalogItem: {
    findFirst(args: CatalogLookup): PromiseLike<{ id: string } | null>
  }
  shoppingListItem: {
    upsert(args: UpsertArgs): PromiseLike<ShoppingListItem>
  }
}

export interface AddShoppingListDependencies {
  requireHousehold(userId: string): Promise<{ householdId: string }>
  transaction(
    operation: (transaction: AddShoppingListTransaction) => Promise<ShoppingListItem>,
  ): Promise<ShoppingListItem>
}

export function validateQuantity(quantity: unknown, defaultValue?: number): number {
  const value = quantity === undefined ? defaultValue : quantity

  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new AppError(400, 'La cantidad debe ser un entero mayor o igual a 1')
  }

  return value as number
}

export async function ensureListIsEditable(transaction: Pick<AddShoppingListTransaction, 'purchase'>, householdId: string) {
  const purchase = await transaction.purchase.findUnique({
    where: { householdId },
    select: { status: true },
  })

  if (purchase?.status === PurchaseStatus.IN_PROGRESS) {
    throw new AppError(409, 'La lista no puede modificarse durante una compra en curso')
  }
}

export function createAddShoppingListItem(dependencies: AddShoppingListDependencies) {
  return async function addShoppingListItem(userId: string, catalogItemId: string, requestedQuantity: unknown): Promise<ShoppingListItem> {
    const { householdId } = await dependencies.requireHousehold(userId)
    const quantity = validateQuantity(requestedQuantity, 1)

    return dependencies.transaction(async (transaction) => {
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
}
