import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/lib/app-error'

const mocks = vi.hoisted(() => ({ requireHousehold: vi.fn(), findMany: vi.fn(), create: vi.fn() }))
vi.mock('../src/lib/prisma', () => ({ prisma: { catalogItem: { findMany: mocks.findMany, create: mocks.create } } }))
vi.mock('../src/lib/household-access', () => ({ requireHousehold: mocks.requireHousehold, requireHouseholdAdmin: vi.fn() }))

import { createCatalogItem } from '../src/services/catalog.service'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireHousehold.mockResolvedValue({ householdId: 'household-1' })
  mocks.findMany.mockResolvedValue([{ name: 'Café molido' }])
})

describe('createCatalogItem', () => {
  it.each([
    { name: '  CAFE\tMOLIDO  ', duplicate: true, normalized: 'CAFE MOLIDO' },
    { name: '  Leche   entera  ', duplicate: false, normalized: 'Leche entera' },
  ])('detecta equivalencia y normaliza al crear: $name', async ({ name, duplicate, normalized }) => {
    const item = { id: 'product-1', householdId: 'household-1', name: normalized }
    mocks.create.mockResolvedValue(item)
    const result = createCatalogItem('user-1', name)
    if (duplicate) {
      await expect(result).rejects.toBeInstanceOf(AppError)
      await expect(result).rejects.toMatchObject({ statusCode: 409, message: 'Ya existe un producto equivalente en el catálogo' })
      expect(mocks.create).not.toHaveBeenCalled()
    } else {
      await expect(result).resolves.toEqual(item)
      expect(mocks.create).toHaveBeenCalledExactlyOnceWith({ data: { householdId: 'household-1', name: normalized } })
    }
    expect(mocks.requireHousehold).toHaveBeenCalledWith('user-1')
    expect(mocks.findMany).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'household-1' }, select: { name: true } })
  })
})
