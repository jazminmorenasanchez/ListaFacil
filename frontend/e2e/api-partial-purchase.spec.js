import { randomUUID } from 'node:crypto'
import { test, expect, request } from '@playwright/test'
import {
  createTestAccount, prepareHouseholdAccount, cleanupAccount, requireLocalURL, CleanupError,
} from './support/account.js'

test('API: bloquea la lista durante una compra parcial y conserva 3 de 5 unidades pendientes', async ({}, testInfo) => {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:8080'
  requireLocalURL(baseURL)
  const api = await request.newContext({ baseURL, timeout: 5000, maxRedirects: 0 })
  const account = createTestAccount()
  account.api = api
  let originalError

  try {
    await prepareHouseholdAccount(account)
    const headers = { Authorization: `Bearer ${account.token}` }
    const name = `Compra parcial API TP7 ${randomUUID()}`
    const created = await api.post('/api/catalog', { headers, data: { name } })
    expect(created.status()).toBe(201)
    const { item: product } = await created.json()
    expect(product).toMatchObject({ name, householdId: account.householdId })
    const added = await api.post('/api/shopping-list/items', {
      headers, data: { catalogItemId: product.id, quantity: 5 },
    })
    expect(added.status()).toBe(201)
    const { item } = await added.json()
    expect(item).toMatchObject({ catalogItemId: product.id, quantity: 5, purchasedQuantity: 0 })

    const scheduledFor = new Date(Date.now() + 24 * 60 * 60_000).toISOString()
    const scheduled = await api.post('/api/purchases', {
      headers, data: { responsibleUserId: account.userId, scheduledFor },
    })
    expect(scheduled.status()).toBe(201)
    const { purchase } = await scheduled.json()
    expect(purchase.id).toEqual(expect.any(String))
    const expectedPurchase = {
      id: purchase.id, householdId: account.householdId, responsibleUserId: account.userId, scheduledFor,
    }
    expect(purchase).toMatchObject({ ...expectedPurchase, status: 'SCHEDULED' })
    expect(purchase.responsibleUser).toMatchObject({ id: account.userId, email: account.email })
    const scheduledActive = await api.get('/api/purchases/active', { headers })
    expect(scheduledActive.status()).toBe(200)
    expect((await scheduledActive.json()).purchase).toMatchObject({ ...expectedPurchase, status: 'SCHEDULED' })

    const started = await api.post('/api/purchases/start', { headers })
    expect(started.status()).toBe(200)
    const startedPurchase = (await started.json()).purchase
    expect(startedPurchase).toMatchObject({ ...expectedPurchase, status: 'IN_PROGRESS' })
    expect(Number.isFinite(Date.parse(startedPurchase.startedAt))).toBe(true)

    const blocked = await api.patch(`/api/shopping-list/items/${item.id}`, {
      headers, data: { quantity: 6 },
    })
    expect(blocked.status()).toBe(409)
    expect((await blocked.json()).message).toBe('La lista no puede modificarse durante una compra en curso')
    const unchanged = await api.get('/api/shopping-list', { headers })
    expect(unchanged.status()).toBe(200)
    expect((await unchanged.json()).items).toEqual([
      expect.objectContaining({ id: item.id, catalogItemId: product.id, name, quantity: 5, purchasedQuantity: 0 }),
    ])

    const bought = await api.patch(`/api/purchases/items/${item.id}`, {
      headers, data: { purchasedQuantity: 2 },
    })
    expect(bought.status()).toBe(200)
    expect((await bought.json()).item).toMatchObject({
      id: item.id, catalogItemId: product.id, quantity: 5, purchasedQuantity: 2,
    })
    const inProgress = await api.get('/api/purchases/active', { headers })
    expect(inProgress.status()).toBe(200)
    expect((await inProgress.json()).purchase).toMatchObject({
      ...expectedPurchase, status: 'IN_PROGRESS',
      items: [expect.objectContaining({ id: item.id, name, quantity: 5, purchasedQuantity: 2 })],
    })

    const finished = await api.post('/api/purchases/finish', { headers })
    expect(finished.status()).toBe(200)
    expect((await finished.json()).result).toEqual({ completedItems: 0, partialItems: 1, pendingItems: 1 })
    const remaining = await api.get('/api/shopping-list', { headers })
    expect(remaining.status()).toBe(200)
    expect((await remaining.json()).items).toEqual([
      expect.objectContaining({ id: item.id, catalogItemId: product.id, name, quantity: 3, purchasedQuantity: 0 }),
    ])
    const active = await api.get('/api/purchases/active', { headers })
    expect(active.status()).toBe(200)
    expect((await active.json()).purchase).toBeNull()
  } catch (error) {
    originalError = error
    throw error
  } finally {
    // Allow cleanup to resolve an active purchase even after a test timeout.
    testInfo.setTimeout(testInfo.timeout + 30000)
    try {
      await cleanupAccount(api, account)
    } catch (error) {
      const cleanupError = error instanceof CleanupError ? error
        : new CleanupError('Limpieza API falló por conexión o respuesta inesperada; pueden quedar datos propios.')
      if (originalError) throw new AggregateError([originalError, cleanupError], 'Fallaron la prueba API y su limpieza.')
      throw cleanupError
    } finally {
      await api.dispose()
    }
  }
})
