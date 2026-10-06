import { describe, expect, it, vi } from 'vitest'
import { PurchaseStatus } from '../src/generated/prisma/enums'
import { AppError } from '../src/lib/app-error'
import {
  createAddShoppingListItem,
  type AddShoppingListDependencies,
  type AddShoppingListTransaction,
} from '../src/services/add-shopping-list-item'

function setup() {
  const item = {
    id: 'list-item-1',
    catalogItemId: 'product-1',
    quantity: 3,
    purchasedQuantity: 0,
    urgent: false,
    addedAt: new Date('2026-10-06T12:00:00Z'),
  }
  const requireHousehold = vi.fn<AddShoppingListDependencies['requireHousehold']>()
    .mockResolvedValue({ householdId: 'household-1' })
  const findPurchase = vi.fn<AddShoppingListTransaction['purchase']['findUnique']>()
    .mockResolvedValue(null)
  const findCatalogItem = vi.fn<AddShoppingListTransaction['catalogItem']['findFirst']>()
    .mockResolvedValue({ id: 'product-1' })
  const upsert = vi.fn<AddShoppingListTransaction['shoppingListItem']['upsert']>()
    .mockResolvedValue(item)
  const transactionDouble: AddShoppingListTransaction = {
    purchase: { findUnique: findPurchase },
    catalogItem: { findFirst: findCatalogItem },
    shoppingListItem: { upsert },
  }
  const transaction = vi.fn<AddShoppingListDependencies['transaction']>(
    (operation) => operation(transactionDouble),
  )
  const addShoppingListItem = createAddShoppingListItem({ requireHousehold, transaction })

  return { addShoppingListItem, item, requireHousehold, transaction, findPurchase, findCatalogItem, upsert }
}

describe('addShoppingListItem', () => {
  it('agrega un producto del hogar con cantidad 3 mediante un único upsert de creación o incremento', async () => {
    const { addShoppingListItem, item, requireHousehold, transaction, findCatalogItem, upsert } = setup()

    const result = await addShoppingListItem('user-1', 'product-1', 3)

    expect(requireHousehold).toHaveBeenCalledWith('user-1')
    expect(transaction).toHaveBeenCalledTimes(1)
    expect(findCatalogItem).toHaveBeenCalledWith({
      where: { id: 'product-1', householdId: 'household-1' },
      select: { id: true },
    })
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith({
      where: { catalogItemId: 'product-1' },
      create: { catalogItemId: 'product-1', quantity: 3 },
      update: { quantity: { increment: 3 } },
    })
    expect(result).toEqual(item)
  })

  it('utiliza cantidad 1 para creación e incremento cuando la cantidad es undefined', async () => {
    const { addShoppingListItem, upsert } = setup()

    await addShoppingListItem('user-1', 'product-1', undefined)

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith({
      where: { catalogItemId: 'product-1' },
      create: { catalogItemId: 'product-1', quantity: 1 },
      update: { quantity: { increment: 1 } },
    })
  })

  it('rechaza una compra IN_PROGRESS con AppError 409 antes de buscar el producto o ejecutar upsert', async () => {
    const { addShoppingListItem, findPurchase, findCatalogItem, upsert } = setup()
    findPurchase.mockResolvedValue({ status: PurchaseStatus.IN_PROGRESS })

    const result = addShoppingListItem('user-1', 'product-1', 3)

    await expect(result).rejects.toBeInstanceOf(AppError)
    await expect(result).rejects.toMatchObject({
      statusCode: 409,
      message: 'La lista no puede modificarse durante una compra en curso',
    })
    expect(findPurchase).toHaveBeenCalledWith({
      where: { householdId: 'household-1' },
      select: { status: true },
    })
    expect(findCatalogItem).not.toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })
})
