import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runControlledSentryError } from '../src/sentry-controlled-error'

const { getClient } = vi.hoisted(() => ({ getClient: vi.fn() }))
vi.mock('@sentry/react', () => ({ getClient }))

const flag = 'tp9:sentry-controlled-error'
let storage: Map<string, string>
let getItem: ReturnType<typeof vi.fn>
let removeItem: ReturnType<typeof vi.fn>
let schedule: ReturnType<typeof vi.fn>

function useHostname(hostname: string): void {
  vi.stubGlobal('window', {
    location: { hostname },
    sessionStorage: { getItem, removeItem },
    setTimeout: schedule,
  })
}

beforeEach(() => {
  storage = new Map()
  getItem = vi.fn((key: string) => storage.get(key) ?? null)
  removeItem = vi.fn((key: string) => { storage.delete(key) })
  schedule = vi.fn()
  getClient.mockReturnValue({})
  useHostname('listafacil-web-qa.onrender.com')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('temporary controlled Sentry error', () => {
  it.each([
    'listafacil-web-prod.onrender.com',
    'listafacil-web-preprod.onrender.com',
    'localhost',
    'listafacil-web-qa.onrender.com.example.com',
    'listafacil-web-qaXonrenderXcom',
  ])('never runs outside the exact QA hostname: %s', (hostname) => {
    storage.set(flag, 'once')
    useHostname(hostname)
    runControlledSentryError()
    expect(getItem).not.toHaveBeenCalled()
    expect(schedule).not.toHaveBeenCalled()
  })

  it('does not run before Sentry is initialized or when DSN is absent', () => {
    getClient.mockReturnValue(undefined)
    storage.set(flag, 'once')
    runControlledSentryError()
    expect(getItem).not.toHaveBeenCalled()
    expect(schedule).not.toHaveBeenCalled()
  })

  it.each([undefined, '', 'true', 'ONCE'])('requires the exact manual flag: %s', (value) => {
    if (value !== undefined) storage.set(flag, value)
    runControlledSentryError()
    expect(removeItem).not.toHaveBeenCalled()
    expect(schedule).not.toHaveBeenCalled()
  })

  it('consumes the flag before scheduling one asynchronous error from the source file', () => {
    storage.set(flag, 'once')
    storage.set('unrelated', 'preserve')
    schedule.mockImplementation(() => { expect(storage.has(flag)).toBe(false) })
    runControlledSentryError()
    runControlledSentryError()
    expect(removeItem).toHaveBeenCalledExactlyOnceWith(flag)
    expect(schedule).toHaveBeenCalledTimes(1)
    const [callback, delay] = schedule.mock.calls[0]
    expect(delay).toBe(0)
    expect(storage.get('unrelated')).toBe('preserve')
    expect(callback.name).toBe('tp9ControlledSentryError')
    expect(callback).toThrowError('TP9 controlled Sentry error - QA only')
    try { callback() } catch (error) {
      expect((error as Error).stack).toContain('sentry-controlled-error.ts:')
    }
  })

  it.each(['read', 'remove'])('does not interrupt startup if storage %s is blocked', (operation) => {
    storage.set(flag, 'once')
    const method = operation === 'read' ? getItem : removeItem
    method.mockImplementation(() => { throw new DOMException('Storage blocked', 'SecurityError') })
    expect(runControlledSentryError).not.toThrow()
    expect(schedule).not.toHaveBeenCalled()
  })
})
