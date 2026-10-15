import { randomUUID } from 'node:crypto'
import { householdTest as test, expect } from './support/account.js'

test('compra 2 de 5 unidades, bloquea la lista durante la compra y deja 3 pendientes', async ({ page, householdAccount: account }) => {
  const productName = `Compra parcial TP7 ${randomUUID()}`
  const headers = { Authorization: `Bearer ${account.token}` }
  const created = await account.api.post('/api/catalog', { headers, data: { name: productName } })
  expect(created.status()).toBe(201)
  const { item: product } = await created.json()
  expect(product.name).toBe(productName)
  const added = await account.api.post('/api/shopping-list/items', {
    headers, data: { catalogItemId: product.id, quantity: 5 },
  })
  expect(added.status()).toBe(201)
  const { item } = await added.json()
  expect(item.catalogItemId).toBe(product.id)
  expect(item.quantity).toBe(5)
  const matches = (response, method, path) => response.request().method() === method
    && new URL(response.url()).pathname === path

  await page.goto('/')
  const login = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Iniciar sesión', exact: true }) })
  await login.getByLabel('Email', { exact: true }).fill(account.email)
  await login.getByLabel('Contraseña', { exact: true }).fill(account.password)
  await login.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByText(`${account.householdName} · ${account.name} (ADMIN)`, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Compra', exact: true }).click()
  await page.getByRole('combobox', { name: 'Responsable', exact: true }).selectOption(account.userId)
  // datetime-local expects the browser's local time, not a UTC ISO suffix.
  const futureDate = await page.evaluate(() => {
    const date = new Date(Date.now() + 24 * 60 * 60_000)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
  })
  await page.getByLabel('Fecha y hora', { exact: true }).fill(futureDate)
  const [scheduled] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'POST', '/api/purchases')),
    page.getByRole('button', { name: 'Programar compra', exact: true }).click(),
  ])
  expect(scheduled.status()).toBe(201)
  const scheduledPurchase = (await scheduled.json()).purchase
  expect(scheduledPurchase.responsibleUserId).toBe(account.userId)
  expect(scheduledPurchase.status).toBe('SCHEDULED')
  await expect(page.getByRole('heading', { name: 'Compra programada', exact: true })).toBeVisible()
  const [started] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'POST', '/api/purchases/start')),
    page.getByRole('button', { name: 'Iniciar compra', exact: true }).click(),
  ])
  expect(started.status()).toBe(200)
  expect((await started.json()).purchase.status).toBe('IN_PROGRESS')
  await expect(page.getByRole('heading', { name: 'Compra en curso', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await expect(page.getByText('La lista está bloqueada porque hay una compra en curso.', { exact: true })).toBeVisible()
  const listRow = page.locator('.list-row').filter({ has: page.getByText(productName, { exact: true }) })
  await expect(listRow.getByRole('spinbutton', { name: `Cantidad de ${productName}`, exact: true })).toBeDisabled()
  await expect(listRow.getByRole('checkbox', { name: 'Urgente', exact: true })).toBeDisabled()
  await expect(listRow.getByRole('button', { name: 'Quitar', exact: true })).toBeDisabled()
  await expect(page.getByRole('combobox')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Agregar', exact: true })).toBeDisabled()
  // Confirm the backend enforces the lock as well, without changing the data.
  const rejected = await account.api.patch(`/api/shopping-list/items/${item.id}`, { headers, data: { quantity: 6 } })
  expect(rejected.status()).toBe(409)
  expect((await rejected.json()).message).toBe('La lista no puede modificarse durante una compra en curso')

  await page.getByRole('button', { name: 'Compra', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Compra en curso', exact: true })).toBeVisible()
  const purchaseRow = page.locator('.list-row').filter({ has: page.getByText(productName, { exact: true }) })
  await expect(purchaseRow.getByText('Cantidad necesaria: 5', { exact: true })).toBeVisible()
  const bought = purchaseRow.getByRole('spinbutton')
  await bought.fill('2')
  const [updated] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'PATCH', `/api/purchases/items/${item.id}`)),
    bought.blur(),
  ])
  expect(updated.status()).toBe(200)
  expect((await updated.json()).item.purchasedQuantity).toBe(2)
  await expect(bought).toHaveValue('2')
  const [finished] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'POST', '/api/purchases/finish')),
    page.getByRole('button', { name: 'Finalizar compra', exact: true }).click(),
  ])
  expect(finished.status()).toBe(200)
  expect((await finished.json()).result).toMatchObject({ completedItems: 0, partialItems: 1, pendingItems: 1 })
  await expect(page.getByRole('button', { name: 'Programar compra', exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await expect(listRow.getByRole('spinbutton', { name: `Cantidad de ${productName}`, exact: true })).toHaveValue('3')
  await expect(listRow.getByText('Comprado: 0 de 3', { exact: true })).toBeVisible()
  await expect(listRow.getByRole('button', { name: 'Quitar', exact: true })).toBeEnabled()
  const active = await account.api.get('/api/purchases/active', { headers })
  expect(active.status()).toBe(200)
  expect((await active.json()).purchase).toBeNull()
  const remaining = await account.api.get('/api/shopping-list', { headers })
  expect(remaining.status()).toBe(200)
  expect((await remaining.json()).items).toEqual([
    expect.objectContaining({ id: item.id, name: productName, quantity: 3, purchasedQuantity: 0 }),
  ])
})
