import { getClient } from '@sentry/react'

// Temporary TP9 evidence: opt-in for this QA tab only, never for PROD.
export function runControlledSentryError(): void {
  if (window.location.hostname !== 'listafacil-web-qa.onrender.com' || !getClient()) return

  try {
    if (window.sessionStorage.getItem('tp9:sentry-controlled-error') !== 'once') return
    window.sessionStorage.removeItem('tp9:sentry-controlled-error')
  } catch {
    // Storage may be blocked. Do not affect application startup in that case.
    return
  }

  window.setTimeout(function tp9ControlledSentryError() {
    throw new Error('TP9 controlled Sentry error - QA only')
  }, 0)
}
