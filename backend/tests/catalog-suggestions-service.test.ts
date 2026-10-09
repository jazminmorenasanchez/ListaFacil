import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/lib/app-error'
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), requireHousehold: vi.fn() }))
vi.mock('../src/lib/prisma', () => ({ prisma: { catalogItem: { findMany: mocks.findMany } } }))
vi.mock('../src/lib/household-access', () => ({ requireHousehold: mocks.requireHousehold, requireHouseholdAdmin: vi.fn() }))
import { getCatalogSuggestions } from '../src/services/catalog.service'

beforeEach(() => {
  vi.resetAllMocks()
  mocks.requireHousehold.mockResolvedValue({ householdId: 'household-1' })
  mocks.findMany.mockResolvedValue([{ id: '2', name: 'Café molido' }, { id: '1', name: 'Café' }])
})
describe('getCatalogSuggestions', () => {
  it('consulta sólo el hogar sin contains ni take y aplica ranking antes del límite', async () => {
    await expect(getCatalogSuggestions('user-1', 'cafe', 1)).resolves.toEqual([{ id: '1', name: 'Café' }])
    expect(mocks.requireHousehold).toHaveBeenCalledExactlyOnceWith('user-1')
    expect(mocks.findMany).toHaveBeenCalledExactlyOnceWith({ where: { householdId: 'household-1' }, select: { id: true, name: true } })
  })
  it('consulta vacía devuelve [] aun con productos disponibles', async () => {
    await expect(getCatalogSuggestions('user-1', '  ')).resolves.toEqual([])
    expect(mocks.requireHousehold).toHaveBeenCalledWith('user-1')
  })
  it('sin hogar propaga autorización y no consulta productos', async () => {
    const error = new AppError(403, 'El usuario debe pertenecer a un hogar')
    mocks.requireHousehold.mockRejectedValue(error)
    await expect(getCatalogSuggestions('user-1', 'cafe')).rejects.toBe(error)
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
