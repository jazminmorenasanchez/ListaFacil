import { AppError } from '../lib/app-error'
import { requireHousehold, requireHouseholdAdmin } from '../lib/household-access'
import { comparableProductName, normalizeProductName } from '../lib/product-name'
import { prisma } from '../lib/prisma'

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

async function ensureEquivalentNameIsAvailable(householdId: string, name: string, ignoredItemId?: string): Promise<void> {
  const items = await prisma.catalogItem.findMany({
    where: { householdId, ...(ignoredItemId ? { id: { not: ignoredItemId } } : {}) },
    select: { name: true },
  })
  const comparableName = comparableProductName(name)

  if (items.some((item) => comparableProductName(item.name) === comparableName)) {
    throw new AppError(409, 'Ya existe un producto equivalente en el catálogo')
  }
}

export async function listCatalog(userId: string, requestedSearch?: string) {
  const { householdId } = await requireHousehold(userId)
  const search = requestedSearch?.trim()
  const items = await prisma.catalogItem.findMany({
    where: {
      householdId,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      shoppingListItem: {
        select: { id: true, quantity: true, purchasedQuantity: true, urgent: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return items.map(({ shoppingListItem, ...item }) => ({
    ...item,
    inShoppingList: shoppingListItem !== null,
    shoppingListItem,
  }))
}

export async function createCatalogItem(userId: string, requestedName: string) {
  const { householdId } = await requireHousehold(userId)
  const name = normalizeProductName(requestedName)
  await ensureEquivalentNameIsAvailable(householdId, name)

  try {
    return await prisma.catalogItem.create({ data: { householdId, name } })
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AppError(409, 'El producto ya existe en el catálogo')
    throw error
  }
}

export async function updateCatalogItem(userId: string, itemId: string, requestedName: string) {
  const { householdId } = await requireHouseholdAdmin(userId)
  const name = normalizeProductName(requestedName)
  const item = await prisma.catalogItem.findFirst({ where: { id: itemId, householdId }, select: { id: true } })

  if (!item) throw new AppError(404, 'Producto no encontrado')
  await ensureEquivalentNameIsAvailable(householdId, name, itemId)

  try {
    return await prisma.catalogItem.update({ where: { id: itemId }, data: { name } })
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new AppError(409, 'El producto ya existe en el catálogo')
    throw error
  }
}

export async function deleteCatalogItem(userId: string, itemId: string): Promise<void> {
  const { householdId } = await requireHouseholdAdmin(userId)
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, householdId },
    select: { id: true, shoppingListItem: { select: { id: true } } },
  })

  if (!item) throw new AppError(404, 'Producto no encontrado')
  if (item.shoppingListItem) throw new AppError(409, 'El producto está actualmente en la lista de compras')
  await prisma.catalogItem.delete({ where: { id: item.id } })
}
