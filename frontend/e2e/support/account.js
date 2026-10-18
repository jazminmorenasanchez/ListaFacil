import { randomBytes, randomUUID } from 'node:crypto'
import { test as base, expect } from '@playwright/test'

function requireLocalURL(value, role = 'api') {
  const qaOrigins = {
    api: 'https://listafacil-api-qa.onrender.com',
    frontend: 'https://listafacil-web-qa.onrender.com',
  }
  const url = new URL(value)
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  const isQA = url.origin === qaOrigins[role]
  if (!['http:', 'https:'].includes(url.protocol)
      || !Object.hasOwn(qaOrigins, role)
      || (!isLocal && !isQA)
      || url.username || url.password) {
    throw new Error(`Destino ${role} no permitido: sólo se admiten servicios locales o el origen QA correspondiente; PROD y otros destinos remotos están bloqueados.`)
  }
}

class CleanupError extends Error {}

async function cleanupAccount(api, account) {
  if (!account.registrationSent || account.registrationRejected) return

  const login = await api.post('/api/auth/login', {
    data: { email: account.email, password: account.password },
  })
  // If the registration response was lost, a failed login does not prove that
  // no account was created. Report the uncertainty instead of hiding cleanup.
  if (login.status() === 401 && !account.registrationCreated) {
    throw new CleanupError('Limpieza: no se pudo confirmar si el registro incompleto creó una cuenta; login devolvió HTTP 401.')
  }
  if (login.status() !== 200) throw new CleanupError(`Limpieza: login propio devolvió HTTP ${login.status()}.`)
  const { user, token } = await login.json()
  if (user?.email !== account.email || !user.id || !token
      || (account.userId && user.id !== account.userId)) {
    throw new CleanupError('Limpieza cancelada: no se pudo confirmar la identidad de la cuenta creada.')
  }
  const headers = { Authorization: `Bearer ${token}` }
  const current = await api.get('/api/households/current', { headers })
  if (current.status() !== 200) throw new CleanupError(`Limpieza: consulta de hogar devolvió HTTP ${current.status()}.`)
  const { household } = await current.json()
  if (household && (household.name !== account.householdName || household.memberCount !== 1
      || (account.householdId && household.id !== account.householdId))) {
    throw new CleanupError('Limpieza cancelada: el hogar no coincide con el hogar exclusivo de esta prueba.')
  }
  if (household) {
    const active = await api.get('/api/purchases/active', { headers })
    if (active.status() !== 200) throw new CleanupError(`Limpieza: consulta de compra devolvió HTTP ${active.status()}.`)
    const { purchase } = await active.json()
    if (purchase) {
      if (purchase.householdId !== household.id || purchase.responsibleUserId !== user.id) {
        throw new CleanupError('Limpieza cancelada: la compra no pertenece al hogar y responsable exclusivos de la prueba.')
      }
      let resolved
      if (purchase.status === 'SCHEDULED') {
        resolved = await api.post('/api/purchases/release', { headers })
        if (resolved.status() !== 204) throw new CleanupError(`Limpieza: liberar compra devolvió HTTP ${resolved.status()}.`)
      } else if (purchase.status === 'IN_PROGRESS') {
        resolved = await api.post('/api/purchases/finish', { headers })
        if (resolved.status() !== 200) throw new CleanupError(`Limpieza: finalizar compra devolvió HTTP ${resolved.status()}.`)
      } else {
        throw new CleanupError('Limpieza cancelada: estado de compra desconocido.')
      }
      const remaining = await api.get('/api/purchases/active', { headers })
      if (remaining.status() !== 200 || (await remaining.json()).purchase !== null) {
        throw new CleanupError('Limpieza: la compra sigue activa después de intentar resolverla.')
      }
      console.info(`Limpieza: compra ${purchase.status} resuelta antes de eliminar la cuenta.`)
    }
  }
  const deleted = await api.delete('/api/auth/me', {
    headers, data: { currentPassword: account.password },
  })
  if (deleted.status() !== 204) {
    throw new CleanupError(`Limpieza falló: DELETE /api/auth/me devolvió HTTP ${deleted.status()}; pueden quedar datos de esta prueba.`)
  }
  const previousSession = await api.get('/api/auth/me', { headers })
  if (previousSession.status() !== 401) {
    throw new CleanupError('Limpieza: el token anterior no fue rechazado después de eliminar la cuenta.')
  }
  console.info('Limpieza completada: DELETE /api/auth/me=204; token anterior=401.')
}

export const test = base.extend({
  account: [async ({ playwright, baseURL }, use) => {
    const apiURL = process.env.API_BASE_URL ?? 'http://localhost:8080'
    requireLocalURL(baseURL, 'frontend')
    requireLocalURL(apiURL)
    const account = createTestAccount()
    const api = await playwright.request.newContext({ baseURL: apiURL, timeout: 5000, maxRedirects: 0 })
    try {
      account.api = api
      await use(account)
    } finally {
      try {
        await cleanupAccount(api, account)
      } catch (error) {
        // Do not expose request logs, tokens or the password in teardown errors.
        if (error instanceof CleanupError) throw error
        throw new CleanupError('Limpieza falló por un error de conexión o respuesta inesperada; pueden quedar datos de esta prueba.')
      } finally {
        await api.dispose()
      }
    }
  }, { timeout: 30000 }],
})


export { expect }

// Shared real API setup for browser and API integration tests.
export const householdTest = test.extend({
  householdAccount: [async ({ account }, use) => {
    await prepareHouseholdAccount(account)
    await use(account)
  }, { timeout: 30000 }],
})

export function createTestAccount() {
  const id = randomUUID()
  return {
    name: `Usuario TP7 ${id.slice(0, 8)}`,
    email: `tp7-${id}@example.invalid`,
    password: randomBytes(24).toString('base64url'),
    householdName: `Hogar TP7 ${id}`,
    registrationSent: false,
    registrationCreated: false,
    registrationRejected: false,
    userId: null,
    householdId: null,
  }
}


export async function prepareHouseholdAccount(account) {
  account.registrationSent = true
  const registered = await account.api.post('/api/auth/register', {
    data: { name: account.name, email: account.email, password: account.password },
  })
  account.registrationCreated = registered.status() === 201
  account.registrationRejected = [400, 409].includes(registered.status())
  expect(registered.status()).toBe(201)
  const { user, token } = await registered.json()
  account.userId = user.id
  account.token = token
  expect(user.email).toBe(account.email)
  const created = await account.api.post('/api/households', {
    headers: { Authorization: `Bearer ${token}` }, data: { name: account.householdName },
  })
  expect(created.status()).toBe(201)
  const { household } = await created.json()
  account.householdId = household.id
  expect(household.name).toBe(account.householdName)
  expect(household.role).toBe('ADMIN')
}

export { requireLocalURL, cleanupAccount, CleanupError }
