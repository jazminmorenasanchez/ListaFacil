import { FormEvent, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'

export function NoHouseholdPage({ token, onChanged, onLogout }: { token: string; onChanged: () => Promise<void>; onLogout: () => void }) {
  const [name, setName] = useState(''), [code, setCode] = useState(''), [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function send(event: FormEvent, path: string, body: object) { event.preventDefault(); setLoading(true); setError(''); try { await apiRequest(path, { method: 'POST', body: JSON.stringify(body) }, token); await onChanged() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } finally { setLoading(false) } }
  return <main><header><h1>ListaFácil</h1><button className="secondary" onClick={onLogout}>Cerrar sesión</button></header><Message error={error} /><div className="columns"><form className="card" onSubmit={(event) => send(event, '/households', { name })}><h2>Crear hogar</h2><label>Nombre<input value={name} onChange={(e) => setName(e.target.value)} required /></label><button disabled={loading}>Crear hogar</button></form><form className="card" onSubmit={(event) => send(event, '/households/join', { joinCode: code })}><h2>Unirse a un hogar</h2><label>Código<input value={code} onChange={(e) => setCode(e.target.value)} required /></label><button disabled={loading}>Unirme</button></form></div></main>
}
