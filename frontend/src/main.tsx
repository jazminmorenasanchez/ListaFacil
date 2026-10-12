import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="deploy-notice"><span className="deploy-badge">TP6 · Deploy PROD</span></div>
    <App />
  </StrictMode>,
)
