import { test, expect } from './support/account.js'

test('registra una cuenta, crea un hogar ADMIN y conserva la asociación al volver a ingresar', async ({ page, account }) => {
  const isRegister = (message) => new URL(message.url()).pathname === '/api/auth/register'
    && message.request().method() === 'POST'
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/auth/register' && request.method() === 'POST') {
      account.registrationSent = true
    }
  })
  page.on('response', (response) => {
    if (isRegister(response) && response.status() === 201) account.registrationCreated = true
    if (isRegister(response) && [400, 409].includes(response.status())) account.registrationRejected = true
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'ListaFácil', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Registrarse', exact: true }).click()
  const registration = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Crear cuenta', exact: true }) })
  await registration.getByLabel('Nombre', { exact: true }).fill(account.name)
  await registration.getByLabel('Email', { exact: true }).fill(account.email)
  await registration.getByLabel('Contraseña', { exact: true }).fill(account.password)
  await registration.getByLabel('Confirmar contraseña', { exact: true }).fill(account.password)
  const [registered] = await Promise.all([
    page.waitForResponse(isRegister),
    registration.getByRole('button', { name: 'Registrarme', exact: true }).click(),
  ])
  expect(registered.status()).toBe(201)
  const registeredBody = await registered.json()
  account.userId = registeredBody.user?.id
  expect(account.userId).toEqual(expect.any(String))
  expect(registeredBody.user.email).toBe(account.email)
  expect(registeredBody.user.name).toBe(account.name)
  await expect(page.getByRole('heading', { name: 'Crear hogar', exact: true })).toBeVisible()

  const householdForm = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Crear hogar', exact: true }) })
  await householdForm.getByLabel('Nombre', { exact: true }).fill(account.householdName)
  const [created] = await Promise.all([
    page.waitForResponse((response) => new URL(response.url()).pathname === '/api/households' && response.request().method() === 'POST'),
    householdForm.getByRole('button', { name: 'Crear hogar', exact: true }).click(),
  ])
  expect(created.status()).toBe(201)
  const { household } = await created.json()
  account.householdId = household.id
  expect(household.name).toBe(account.householdName)
  expect(household.role).toBe('ADMIN')
  const identity = `${account.householdName} · ${account.name} (ADMIN)`
  await expect(page.getByText(identity, { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Iniciar sesión', exact: true })).toBeVisible()
  const login = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Iniciar sesión', exact: true }) })
  await login.getByLabel('Email', { exact: true }).fill(account.email)
  await login.getByLabel('Contraseña', { exact: true }).fill(account.password)
  await login.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page.getByText(identity, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Hogar', exact: true }).click()
  await expect(page.getByText(account.householdName, { exact: true })).toBeVisible()
})
