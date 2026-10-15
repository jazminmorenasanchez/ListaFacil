import { randomUUID } from 'node:crypto'
import { householdTest as test, expect } from './support/account.js'


test('crea un producto, conserva cantidad y urgencia tras recargar y lo quita de la lista', async ({ page, householdAccount: account }) => {
  const productName = `Producto TP7 ${randomUUID()}`
  const matches = (response, method, path) => response.request().method() === method
    && new URL(response.url()).pathname === path

  await page.goto('/')
  const login = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Iniciar sesión', exact: true }) })
  await login.getByLabel('Email', { exact: true }).fill(account.email)
  await login.getByLabel('Contraseña', { exact: true }).fill(account.password)
  await login.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByText(`${account.householdName} · ${account.name} (ADMIN)`, { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Catálogo', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Catálogo', exact: true })).toBeVisible()
  await page.getByPlaceholder('Nuevo producto', { exact: true }).fill(productName)
  const [created] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'POST', '/api/catalog')),
    page.getByRole('button', { name: 'Crear', exact: true }).click(),
  ])
  expect(created.status()).toBe(201)
  const { item: product } = await created.json()
  expect(product.name).toBe(productName)
  const productRow = page.locator('.list-row').filter({ has: page.getByText(productName, { exact: true }) })
  await expect(productRow).toHaveCount(1)
  const [added] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'POST', '/api/shopping-list/items')),
    productRow.getByRole('button', { name: 'Agregar a lista', exact: true }).click(),
  ])
  expect(added.status()).toBe(201)
  const { item } = await added.json()
  expect(item.catalogItemId).toBe(product.id)
  expect(item.quantity).toBe(1)

  await page.getByRole('button', { name: 'Lista', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lista de compras', exact: true })).toBeVisible()
  const row = page.locator('.list-row').filter({ has: page.getByText(productName, { exact: true }) })
  await expect(row).toHaveCount(1)
  const quantity = row.getByRole('spinbutton', { name: `Cantidad de ${productName}`, exact: true })
  await quantity.fill('4')
  const path = `/api/shopping-list/items/${item.id}`
  const [updated] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'PATCH', path)
      && response.request().postDataJSON().quantity === 4),
    quantity.blur(),
  ])
  expect(updated.status()).toBe(200)
  await expect(row.getByText('Comprado: 0 de 4', { exact: true })).toBeVisible()
  const urgent = row.getByRole('checkbox', { name: 'Urgente', exact: true })
  const [marked] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'PATCH', path)
      && response.request().postDataJSON().urgent === true),
    urgent.click(),
  ])
  expect(marked.status()).toBe(200)
  await expect(urgent).toBeChecked()

  await page.reload()
  await expect(quantity).toHaveValue('4')
  await expect(urgent).toBeChecked()
  await expect(row.getByText('Comprado: 0 de 4', { exact: true })).toBeVisible()
  const [removed] = await Promise.all([
    page.waitForResponse((response) => matches(response, 'DELETE', path)),
    row.getByRole('button', { name: 'Quitar', exact: true }).click(),
  ])
  expect(removed.status()).toBe(204)
  await expect(row).toHaveCount(0)
  await expect(page.getByText('La lista está vacía.', { exact: true })).toBeVisible()
})
