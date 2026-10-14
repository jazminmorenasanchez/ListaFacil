import { FormEvent, useId, useRef, useState } from 'react'
import { ApiError, apiRequest } from '../services/api'

export function DeleteAccount({ token, onDeleted }: { token: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const pending = useRef(false)
  const titleId = useId()

  function cancel() {
    if (pending.current) return
    setPassword(''); setError(''); setOpen(false)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    if (!password) { setError('Ingresá tu contraseña actual'); return }
    pending.current = true
    setSubmitting(true); setError('')
    const currentPassword = password
    setPassword('')
    try {
      await apiRequest('/auth/me', { method: 'DELETE', body: JSON.stringify({ currentPassword }) }, token)
      onDeleted()
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 403) setError('La contraseña actual es incorrecta')
      else if (caught instanceof ApiError && caught.status === 429) setError('Demasiados intentos. Esperá unos minutos y volvé a intentarlo.')
      else if (caught instanceof TypeError) setError('No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.')
      else setError(caught instanceof Error ? caught.message : 'No se pudo eliminar la cuenta. Intentá nuevamente.')
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }

  return <div className="account-deletion">
    {!open ? <button className="danger" onClick={() => setOpen(true)}>Eliminar cuenta</button> :
      <form className="card account-deletion-form" aria-labelledby={titleId} onSubmit={submit}>
        <h3 id={titleId}>Eliminar cuenta</h3>
        <p>Esta acción es permanente y no se puede deshacer</p>
        <div className="account-deletion-info">
          <strong>¿Qué pasará con tu hogar?</strong>
          <p>Si quedan integrantes, el hogar se conserva. Si sos el último, también se eliminarán sus datos</p>
        </div>
        <label>Contraseña actual<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={submitting} autoFocus /></label>
        {error && <p className="message error" role="alert">{error}</p>}
        <div className="actions">
          <button className="danger" disabled={submitting}>{submitting ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}</button>
          <button type="button" className="secondary" disabled={submitting} onClick={cancel}>Cancelar</button>
        </div>
      </form>}
  </div>
}
