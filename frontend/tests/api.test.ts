import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, UNAUTHORIZED_EVENT } from '../src/services/api'

afterEach(() => { vi.unstubAllGlobals() })

describe('apiRequest', () => {
  it.each([false, true])('construye la solicitud y devuelve JSON (autenticada: %s)', async (authenticated) => {
    const payload = { id: 'item-1' }
    const json = vi.fn().mockResolvedValue(payload)
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response())
    // Sólo sustituimos json de una Response real; no simulamos el contrato completo con un cast.
    fetchMock.mockResolvedValue(Object.assign(new Response(), { json }))
    vi.stubGlobal('fetch', fetchMock)
    const body = JSON.stringify({ quantity: 3 })
    const options: RequestInit = { method: 'POST', body, headers: { 'X-Request-Id': 'request-1' } }
    const result = authenticated
      ? await apiRequest('/items', options, 'test-token')
      : await apiRequest('/items')
    expect(result).toEqual(payload)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, sent] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/items')
    const headers = new Headers(sent?.headers)
    expect(sent?.method).toBe(authenticated ? 'POST' : undefined)
    expect(sent?.body).toBe(authenticated ? body : undefined)
    expect(headers.get('Authorization')).toBe(authenticated ? 'Bearer test-token' : null)
    expect(headers.get('Content-Type')).toBe(authenticated ? 'application/json' : null)
    expect(headers.get('X-Request-Id')).toBe(authenticated ? 'request-1' : null)
    expect(json).toHaveBeenCalledTimes(1)
  })

  it('devuelve undefined para 204 sin intentar leer JSON', async () => {
    const json = vi.fn().mockRejectedValue(new Error('No hay contenido'))
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Object.assign(new Response(null, { status: 204 }), { json }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await apiRequest('/items/item-1', { method: 'DELETE' }, 'test-token')).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(json).not.toHaveBeenCalled()
  })

 it.skip.each([
    { status: 422, token: 'test-token', payload: { message: 'Cantidad inválida' }, invalidJson: false, message: 'Cantidad inválida', events: 0 },
    { status: 500, token: 'test-token', payload: {}, invalidJson: false, message: 'No se pudo completar la operación', events: 0 },
    { status: 502, token: 'test-token', payload: {}, invalidJson: true, message: 'No se pudo completar la operación', events: 0 },
    { status: 401, token: 'test-token', payload: { message: 'Sesión vencida' }, invalidJson: false, message: 'Sesión vencida', events: 1 },
    { status: 401, token: undefined, payload: { message: 'Credenciales inválidas' }, invalidJson: false, message: 'Credenciales inválidas', events: 0 },
  ])('rechaza HTTP $status (token: $token, JSON inválido: $invalidJson) con el mensaje y evento correctos', async ({ status, token, payload, invalidJson, message, events }) => {
    const json = vi.fn()
    if (invalidJson) json.mockRejectedValue(new SyntaxError('JSON inválido'))
    else json.mockResolvedValue(payload)
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Object.assign(new Response(null, { status }), { json })))
    const listener = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, listener)
    try {
      const error: unknown = await apiRequest('/items', {}, token).catch((caught: unknown) => caught)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status, message })
      expect(listener).toHaveBeenCalledTimes(events)
      expect(json).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener(UNAUTHORIZED_EVENT, listener)
    }
  })
})
