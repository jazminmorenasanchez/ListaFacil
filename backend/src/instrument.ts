import 'dotenv/config'
import * as Sentry from '@sentry/node'

// Must run before Express and database modules are loaded.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.DEPLOYMENT_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    tracePropagationTargets: [],
    beforeSendSpan: Sentry.withStreamedSpan((span) => {
      const op = span.attributes['sentry.op']
      span.name = typeof op === 'string' && op.startsWith('db')
        ? (span.name.match(/^\s*(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)\b/i)?.[1].toUpperCase() || 'database operation')
        : span.name.split('?')[0]
      span.attributes = Object.fromEntries(Object.entries(span.attributes).filter(([name]) =>
        ['sentry.op', 'sentry.origin', 'sentry.kind', 'sentry.segment.name.source', 'http.route', 'http.request.method', 'http.response.status_code'].includes(name)))
      delete span.links
      return span
    }),
    beforeSend(event) {
      // Authentication payloads and headers must not be sent to Sentry.
      delete event.request
      delete event.user
      delete event.breadcrumbs
      delete event.extra
      delete event.message
      for (const exception of event.exception?.values || []) {
        exception.value = 'Error interno del backend'
      }
      return event
    },
  })
}
