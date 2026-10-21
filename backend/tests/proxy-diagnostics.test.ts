import express from 'express'
import type { Server } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { registerProxyDiagnostics } from '../src/routes/proxy-diagnostics'

const key = 'local-diagnostic-test-key-not-a-deployed-secret'
const enabled = { ENABLE_PROXY_DIAGNOSTICS: 'true', DEPLOYMENT_ENV: 'qa', PROXY_DIAGNOSTICS_KEY: key }
const servers: Server[] = []

async function start(env: NodeJS.ProcessEnv) {
  const app = express()
  registerProxyDiagnostics(app, env)
  const server = await new Promise<Server>((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
  })
  servers.push(server)
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected loopback listener')
  return `http://127.0.0.1:${address.port}/api/diagnostics/proxy`
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve())
  })))
})

describe('temporary proxy diagnostics', () => {
  it.each([
    ['default configuration', {}],
    ['disabled flag', { ...enabled, ENABLE_PROXY_DIAGNOSTICS: 'false' }],
    ['missing flag', { ...enabled, ENABLE_PROXY_DIAGNOSTICS: undefined }],
    ['missing environment', { ...enabled, DEPLOYMENT_ENV: undefined }],
    ['production environment', { ...enabled, DEPLOYMENT_ENV: 'production' }],
    ['prod environment', { ...enabled, DEPLOYMENT_ENV: 'prod' }],
    ['preprod environment', { ...enabled, DEPLOYMENT_ENV: 'preprod' }],
    ['missing key', { ...enabled, PROXY_DIAGNOSTICS_KEY: undefined }],
    ['short key', { ...enabled, PROXY_DIAGNOSTICS_KEY: 'short' }],
    ['31-character key', { ...enabled, PROXY_DIAGNOSTICS_KEY: 'a'.repeat(31) }],
    ['empty key', { ...enabled, PROXY_DIAGNOSTICS_KEY: '' }],
    ['whitespace-only key', { ...enabled, PROXY_DIAGNOSTICS_KEY: ' '.repeat(32) }],
  ] satisfies [string, NodeJS.ProcessEnv][])('does not register with %s', async (_name, env) => {
    const response = await fetch(await start(env), { headers: { 'X-Proxy-Diagnostics-Key': key } })
    expect(response.status).toBe(404)
  })

  it('accepts a matching 32-character key', async () => {
    const credential = 'a'.repeat(32)
    const response = await fetch(await start({ ...enabled, PROXY_DIAGNOSTICS_KEY: credential }), {
      headers: { 'X-Proxy-Diagnostics-Key': credential },
    })
    expect(response.status).toBe(200)
  })

  it.each([undefined, 'incorrect'])('rejects missing or wrong credentials', async (credential) => {
    const response = await fetch(await start(enabled), {
      headers: credential ? { 'X-Proxy-Diagnostics-Key': credential } : {},
    })
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ message: 'Diagnóstico no autorizado' })
  })

  it('returns only the five allowed fields without trusting forwarded headers', async () => {
    const response = await fetch(await start(enabled), { headers: {
      'X-Proxy-Diagnostics-Key': key,
      'X-Forwarded-For': '192.0.2.1, 198.51.100.2',
      'X-Forwarded-Proto': 'https',
      Authorization: 'Bearer local-test-sentinel',
      Cookie: 'session=local-test-sentinel',
    } })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({
      remoteAddress: '127.0.0.1', ip: '127.0.0.1', ips: [],
      forwardedFor: '192.0.2.1, 198.51.100.2', forwardedProto: 'https',
    })
  })
})
