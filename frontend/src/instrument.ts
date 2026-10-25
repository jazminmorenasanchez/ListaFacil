import * as Sentry from '@sentry/react'

export function initializeSentry(dsn = import.meta.env.VITE_SENTRY_DSN): void {
  if (!dsn) return
  const origin = window.location.origin.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  Sentry.init({
    dsn,
    environment: window.location.hostname,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
    tracePropagationTargets: [/^\/api(?:\/|\?|$)/, new RegExp(`^${origin}/api(?:/|\\?|$)`)],
    beforeSend(event) {
      delete event.request
      delete event.user
      delete event.breadcrumbs
      delete event.extra
      delete event.message
      for (const exception of event.exception?.values || []) {
        exception.value = 'Error del frontend'
      }
      return event
    },
    beforeSendSpan: Sentry.withStreamedSpan((span) => {
      span.name = span.name.split('?')[0]
      span.attributes = Object.fromEntries(Object.entries(span.attributes).filter(([name]) =>
        ['sentry.op', 'sentry.origin', 'http.request.method', 'http.response.status_code'].includes(name)))
      delete span.links
      return span
    }),
  })
}

initializeSentry()
