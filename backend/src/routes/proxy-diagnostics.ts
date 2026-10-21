import { createHash, timingSafeEqual } from 'node:crypto'
import type { Express } from 'express'

// Temporary QA-only route. Remove this module and its registration after diagnosis.
export function registerProxyDiagnostics(app: Express, env = process.env): void {
  const key = env.PROXY_DIAGNOSTICS_KEY
  if (env.ENABLE_PROXY_DIAGNOSTICS !== 'true' || env.DEPLOYMENT_ENV !== 'qa'
      || !key || key.trim().length < 32) return

  const expected = createHash('sha256').update(key).digest()
  app.get('/api/diagnostics/proxy', (request, response) => {
    response.set('Cache-Control', 'no-store')
    const supplied = request.get('X-Proxy-Diagnostics-Key')
    if (!supplied || !timingSafeEqual(createHash('sha256').update(supplied).digest(), expected)) {
      response.status(401).json({ message: 'Diagnóstico no autorizado' })
      return
    }
    response.json({
      remoteAddress: request.socket.remoteAddress ?? null,
      ip: request.ip ?? null,
      ips: request.ips,
      forwardedFor: request.get('X-Forwarded-For') ?? null,
      forwardedProto: request.get('X-Forwarded-Proto') ?? null,
    })
  })
}
