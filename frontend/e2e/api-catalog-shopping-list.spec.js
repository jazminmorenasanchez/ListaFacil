import { randomUUID } from 'node:crypto'
import { test, expect, request } from '@playwright/test'
import {
  createTestAccount, prepareHouseholdAccount, cleanupAccount, requireLocalURL, CleanupError,
} from './support/account.js'

test('API: acumula cantidades, persiste urgencia y aísla catálogo y lista entre hogares', async ({}, testInfo) => {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:8080'
  requireLocalURL(baseURL)
  const api = await request.newContext({ baseURL, timeout: 5000, maxRedirects: 0 })
  const accounts = [createTestAccount(), createTestAccount()]
  for (const account of accounts) account.api = api
  const [accountA, accountB] = accounts
  let originalError

  try {
    await prepareHouseholdAccount(accountA)
    await prepareHouseholdAccount(accountB)
    expect(accountA.userId).not.toBe(accountB.userId)
    expect(accountA.householdId).not.toBe(accountB.householdId)
    const headersA = { Authorization: `Bearer ${accountA.token}` }
    const headersB = { Authorization: `Bearer ${accountB.token}` }
    const name = `Producto API TP7 ${randomUUID()}`

    const created = await api.post('/api/catalog', { headers: headersA, data: { name } })
    expect(created.status()).toBe(201)
    const { item: product } = await created.json()
    expect(product.id).toEqual(expect.any(String))
    expect(product.name).toBe(name)
    expect(product.householdId).toBe(accountA.householdId)

    const catalogA = await api.get('/api/catalog', { headers: headersA })
    expect(catalogA.status()).toBe(200)
    expect((await catalogA.json()).items).toContainEqual(expect.objectContaining({
      id: product.id, name, householdId: accountA.householdId, inShoppingList: false,
    }))

    const first = await api.post('/api/shopping-list/items', {
      headers: headersA, data: { catalogItemId: product.id, quantity: 3 },
    })
    expect(first.status()).toBe(201)
    const { item: listItem } = await first.json()
    expect(listItem.quantity).toBe(3)
    expect(listItem.catalogItemId).toBe(product.id)
    const second = await api.post('/api/shopping-list/items', {
      headers: headersA, data: { catalogItemId: product.id, quantity: 2 },
    })
    expect(second.status()).toBe(201)
    expect((await second.json()).item).toMatchObject({ id: listItem.id, quantity: 5 })

    const urgent = await api.patch(`/api/shopping-list/items/${listItem.id}`, {
      headers: headersA, data: { urgent: true },
    })
    expect(urgent.status()).toBe(200)
    expect((await urgent.json()).item).toMatchObject({ id: listItem.id, quantity: 5, urgent: true })
    const expectedItem = {
      id: listItem.id, catalogItemId: product.id, name, quantity: 5, purchasedQuantity: 0, urgent: true,
    }
    const persisted = await api.get('/api/shopping-list', { headers: headersA })
    expect(persisted.status()).toBe(200)
    expect((await persisted.json()).items).toEqual([expect.objectContaining(expectedItem)])

    const catalogB = await api.get('/api/catalog', { headers: headersB })
    expect(catalogB.status()).toBe(200)
    const itemsB = (await catalogB.json()).items
    expect(itemsB.some(item => item.id === product.id || item.name === name)).toBe(false)
    expect(itemsB.every(item => item.householdId === accountB.householdId)).toBe(true)
    const listB = await api.get('/api/shopping-list', { headers: headersB })
    expect(listB.status()).toBe(200)
    expect((await listB.json()).items).toEqual([])

    const foreignRename = await api.patch(`/api/catalog/${product.id}`, {
      headers: headersB, data: { name: `Ajeno ${randomUUID()}` },
    })
    expect(foreignRename.status()).toBe(404)
    expect((await foreignRename.json()).message).toBe('Producto no encontrado')
    const foreignAdd = await api.post('/api/shopping-list/items', {
      headers: headersB, data: { catalogItemId: product.id, quantity: 1 },
    })
    expect(foreignAdd.status()).toBe(404)
    expect((await foreignAdd.json()).message).toBe('Producto de catálogo no encontrado')
    const foreignUpdate = await api.patch(`/api/shopping-list/items/${listItem.id}`, {
      headers: headersB, data: { quantity: 99, urgent: false },
    })
    expect(foreignUpdate.status()).toBe(404)
    expect((await foreignUpdate.json()).message).toBe('Item de lista no encontrado')

    const unchanged = await api.get('/api/shopping-list', { headers: headersA })
    expect(unchanged.status()).toBe(200)
    expect((await unchanged.json()).items).toEqual([expect.objectContaining(expectedItem)])
    const unchangedCatalog = await api.get('/api/catalog', { headers: headersA })
    expect(unchangedCatalog.status()).toBe(200)
    expect((await unchangedCatalog.json()).items).toContainEqual(expect.objectContaining({ id: product.id, name }))
    const stillEmpty = await api.get('/api/shopping-list', { headers: headersB })
    expect(stillEmpty.status()).toBe(200)
    expect((await stillEmpty.json()).items).toEqual([])

    const removed = await api.delete(`/api/shopping-list/items/${listItem.id}`, { headers: headersA })
    expect(removed.status()).toBe(204)
    expect(await removed.text()).toBe('')
    const remaining = await api.get('/api/shopping-list', { headers: headersA })
    expect(remaining.status()).toBe(200)
    expect((await remaining.json()).items).toEqual([])
  } catch (error) {
    originalError = error
    throw error
  } finally {
    testInfo.setTimeout(testInfo.timeout + 60000)
    const cleanupErrors = []
    try {
      // Attempt both cleanups even if the first one fails.
      for (const [index, account] of accounts.entries()) {
        try {
          console.info(`Limpieza de cuenta ${index === 0 ? 'A' : 'B'}:`)
          await cleanupAccount(api, account)
        } catch (error) {
          const detail = error instanceof CleanupError ? error.message : 'Error de conexión o respuesta inesperada.'
          cleanupErrors.push(new CleanupError(`Cuenta ${index === 0 ? 'A' : 'B'}: ${detail}`))
        }
      }
      if (cleanupErrors.length) {
        throw new AggregateError([
          ...(originalError ? [originalError] : []), ...cleanupErrors,
        ], 'Falló la limpieza de cuentas de esta prueba API; pueden quedar datos propios.')
      }
    } finally {
      await api.dispose()
    }
  }
})
