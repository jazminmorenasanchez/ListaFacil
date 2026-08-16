import { FormEvent, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'
import type { User } from '../types'

export function AuthPage({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const body = mode === 'register' ? { name, email, password } : { email, password }
      const result = await apiRequest<{ token: string; user: User }>(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(body) })
      onAuthenticated(result.token, result.user)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } finally { setLoading(false) }
  }
  return <main className="narrow"><h1>ListaFácil</h1><div className="tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Ingresar</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Registrarse</button></div><form className="card" onSubmit={submit}><h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>{mode === 'register' && <label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label><Message error={error} /><button disabled={loading}>{loading ? 'Enviando...' : mode === 'login' ? 'Ingresar' : 'Registrarme'}</button></form></main>
}
