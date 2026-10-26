import './instrument'
import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'
import { runControlledSentryError } from './sentry-controlled-error'

createRoot(document.getElementById('root')!, {
  onUncaughtError: Sentry.reactErrorHandler(),
  onCaughtError: Sentry.reactErrorHandler(),
}).render(
  <StrictMode>
    <div className="deploy-notice"><span className="deploy-badge">TP6 · Deploy PROD</span></div>
    <App />
  </StrictMode>,
)

runControlledSentryError()
