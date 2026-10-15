import { randomBytes, randomUUID } from 'node:crypto'
import { test, expect, request } from '@playwright/test'

class CleanupError extends Error {}

test('API: registra, autentica, consulta y elimina exclusivamente su propia cuenta', async ({}, testInfo) => {
  const baseURL = process.env.API_BASE_URL ?? 'http://localhost:8080'
  const url = new URL(baseURL)
  if (!['http:', 'https:'].includes(url.protocol)
      || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || url.username || url.password) {
    throw new Error('Esta prueba API sólo admite destinos locales; QA y PROD no están permitidos.')
  }
  const id = randomUUID()
  const name = `Cuenta API TP7 ${id.slice(0, 8)}`
  const credentials = { email: `tp7-api-${id}@example.invalid`, password: randomBytes(24).toString('base64url') }
  const api = await request.newContext({ baseURL, timeout: 5000, maxRedirects: 0 })
  let attempted = false
  let rejected = false
  let created = false
  let deleted = false
  let userId
  let originalError

  try {
    attempted = true
    const registered = await api.post('/api/auth/register', { data: { name, ...credentials } })
    created = registered.status() === 201
    rejected = [400, 409].includes(registered.status())
    expect(registered.status()).toBe(201)
    const registration = await registered.json()
    userId = registration.user?.id
    expect(typeof userId).toBe('string')
    expect(Boolean(userId)).toBe(true)
    expect(registration.user.name).toBe(name)
    expect(registration.user.email).toBe(credentials.email)
    expect(registration.user.role).toBe('MEMBER')
    expect(registration.user.householdId).toBeNull()
    expect(Number.isFinite(Date.parse(registration.user.createdAt))).toBe(true)
    expect(Object.hasOwn(registration.user, 'passwordHash')).toBe(false)
    expect(typeof registration.token).toBe('string')
    expect(Boolean(registration.token)).toBe(true)

    const registeredSession = await api.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${registration.token}` },
    })
    expect(registeredSession.status()).toBe(200)
    expect((await registeredSession.json()).user.id).toBe(userId)

    const loggedIn = await api.post('/api/auth/login', { data: credentials })
    expect(loggedIn.status()).toBe(200)
    const login = await loggedIn.json()
    expect(login.user.id).toBe(userId)
    expect(login.user.email).toBe(credentials.email)
    expect(Object.hasOwn(login.user, 'passwordHash')).toBe(false)
    expect(typeof login.token).toBe('string')
    expect(Boolean(login.token)).toBe(true)
    // JWTs issued in the same second can be identical; validity is verified by /me.
    const headers = { Authorization: `Bearer ${login.token}` }
    const me = await api.get('/api/auth/me', { headers })
    expect(me.status()).toBe(200)
    const { user } = await me.json()
    expect(user.id).toBe(userId)
    expect(user.name).toBe(name)
    expect(user.email).toBe(credentials.email)
    expect(user.role).toBe('MEMBER')
    expect(user.householdId).toBeNull()
    expect(Object.hasOwn(user, 'passwordHash')).toBe(false)

    const removed = await api.delete('/api/auth/me', { headers, data: { currentPassword: credentials.password } })
    deleted = removed.status() === 204
    expect(removed.status()).toBe(204)
    expect(await removed.text()).toBe('')
    const oldSession = await api.get('/api/auth/me', { headers })
    expect(oldSession.status()).toBe(401)
    expect((await oldSession.json()).message).toBe('Token inválido o expirado')
    const oldLogin = await api.post('/api/auth/login', { data: credentials })
    expect(oldLogin.status()).toBe(401)
    expect((await oldLogin.json()).message).toBe('Credenciales inválidas')
  } catch (error) {
    originalError = error
    throw error
  } finally {
    // Reserve time for cleanup even when an intermediate request/assertion fails.
    testInfo.setTimeout(testInfo.timeout + 20000)
    try {
      if (attempted && !rejected && !deleted) {
        const recovery = await api.post('/api/auth/login', { data: credentials })
        if (recovery.status() !== 200) {
          throw new CleanupError(`Limpieza API: no se pudo recuperar la cuenta propia (HTTP ${recovery.status()}, registro confirmado: ${created}); pueden quedar datos.`)
        }
        const { user, token } = await recovery.json()
        if (user?.email !== credentials.email || !user.id || !token || user.householdId !== null
            || (userId && user.id !== userId)) {
          throw new CleanupError('Limpieza API cancelada: la identidad o el estado sin hogar no coincide con esta prueba.')
        }
        const headers = { Authorization: `Bearer ${token}` }
        const removed = await api.delete('/api/auth/me', { headers, data: { currentPassword: credentials.password } })
        if (removed.status() !== 204) throw new CleanupError(`Limpieza API falló: DELETE devolvió HTTP ${removed.status()}.`)
        const oldSession = await api.get('/api/auth/me', { headers })
        if (oldSession.status() !== 401) throw new CleanupError('Limpieza API: el token anterior no fue rechazado.')
        console.info('Limpieza API de recuperación: DELETE 204 y token anterior 401.')
      }
    } catch (error) {
      const cleanupError = error instanceof CleanupError ? error
        : new CleanupError('Limpieza API falló por conexión o respuesta inesperada; pueden quedar datos de esta prueba.')
      if (originalError) throw new AggregateError([originalError, cleanupError], 'Fallaron la prueba API y su limpieza.')
      throw cleanupError
    } finally {
      await api.dispose()
    }
  }
})
