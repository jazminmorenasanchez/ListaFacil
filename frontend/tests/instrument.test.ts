import { afterEach, describe, expect, it, vi } from 'vitest'

const { init, tracing } = vi.hoisted(() => ({ init: vi.fn(), tracing: vi.fn(() => ({ name: 'BrowserTracing' })) }))
vi.mock('@sentry/react', () => ({
  init, browserTracingIntegration: tracing, withStreamedSpan: (callback: unknown) => callback,
}))

afterEach(() => {
  vi.resetModules()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  init.mockClear()
  tracing.mockClear()
})

describe('frontend Sentry', () => {
  it('stays disabled without a build-time DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    await import('../src/instrument')
    expect(init).not.toHaveBeenCalled()
  })

  it('identifies PROD from its hostname rather than the shared build mode', async () => {
    vi.stubGlobal('window', { location: {
      origin: 'https://listafacil-web-prod.onrender.com', hostname: 'listafacil-web-prod.onrender.com',
    } })
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public-test-key@example.invalid/1')
    await import('../src/instrument')
    expect(init.mock.calls[0][0].environment).toBe('listafacil-web-prod.onrender.com')
  })

  it('initializes tracing and propagates only to same-origin API requests', async () => {
    vi.stubGlobal('window', { location: {
      origin: 'https://listafacil-web-qa.onrender.com', hostname: 'listafacil-web-qa.onrender.com',
    } })
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public-test-key@example.invalid/1')
    await import('../src/instrument')
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0]
    expect(options.environment).toBe(window.location.hostname)
    expect(options.tracesSampleRate).toBe(1)
    expect(tracing).toHaveBeenCalledTimes(1)
    const allowed = (url: string) => options.tracePropagationTargets.some((pattern: RegExp) => pattern.test(url))
    for (const url of ['/api/auth/login', `${window.location.origin}/api/catalog`, '/api?test=1']) expect(allowed(url)).toBe(true)
    for (const url of ['https://example.com/api/auth/login', '//example.com/api', '/apiculture', `${window.location.origin}.example.com/api`, 'https://listafacil-web-qaXonrenderXcom/api']) expect(allowed(url)).toBe(false)
    expect(options.beforeSend({ message: 'test', request: {}, user: {}, extra: {}, breadcrumbs: [] })).toEqual({})
    expect(options.beforeSend({ exception: { values: [{ type: 'Error', value: 'private' }] } })).toEqual({
      exception: { values: [{ type: 'Error', value: 'Error del frontend' }] },
    })
    const frames = [{ filename: '/assets/application.js', lineno: 12, colno: 5 }]
    expect(options.beforeSend({ exception: { values: [{ type: 'TypeError', value: 'private', stacktrace: { frames } }] } }))
      .toEqual({ exception: { values: [{ type: 'TypeError', value: 'Error del frontend', stacktrace: { frames } }] } })
    expect(options.beforeSendSpan({ name: '/api/catalog?search=private', attributes: { 'http.request.method': 'GET', token: 'private' } })).toEqual({ name: '/api/catalog', attributes: { 'http.request.method': 'GET' } })
  })
})
