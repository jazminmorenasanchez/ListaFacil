import { afterEach, describe, expect, it, vi } from 'vitest'

const { init } = vi.hoisted(() => ({ init: vi.fn() }))
vi.mock('@sentry/node', () => ({ init, withStreamedSpan: (callback: unknown) => callback }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  init.mockReset()
})

describe('Sentry initialization', () => {
  it('does not initialize without a DSN', async () => {
    vi.stubEnv('SENTRY_DSN', '')
    await import('../src/instrument')
    expect(init).not.toHaveBeenCalled()
  })

  it('uses environment configuration and removes request data from error events', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://public-test-key@example.invalid/1')
    vi.stubEnv('DEPLOYMENT_ENV', 'qa')
    await import('../src/instrument')
    expect(init).toHaveBeenCalledTimes(1)
    const options = init.mock.calls[0][0]
    expect(options.environment).toBe('qa')
    const event = { message: 'test', request: { data: 'private' }, user: {}, breadcrumbs: [], extra: {} }
    expect(options.beforeSend(event)).toEqual({})
    expect(options.beforeSend({ exception: { values: [{ type: 'Error', value: 'private' }] } })).toEqual({
      exception: { values: [{ type: 'Error', value: 'Error interno del backend' }] },
    })
    const frames = [{ filename: '/app/src/services/purchase.service.ts', lineno: 42, colno: 7 }]
    expect(options.beforeSend({ exception: { values: [{ type: 'TypeError', value: 'private', stacktrace: { frames } }] } }))
      .toEqual({ exception: { values: [{ type: 'TypeError', value: 'Error interno del backend', stacktrace: { frames } }] } })
    expect(options.beforeSendSpan({
      name: 'SELECT private_value', start_timestamp: 1, end_timestamp: 2,
      attributes: { 'sentry.op': 'db.query', 'db.statement': 'private' }, links: [],
    })).toEqual({ name: 'SELECT', start_timestamp: 1, end_timestamp: 2, attributes: { 'sentry.op': 'db.query' } })
  })
})
