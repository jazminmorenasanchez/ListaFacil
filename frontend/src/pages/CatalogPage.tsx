import { FormEvent, useEffect, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'
import type { CatalogItem, UserRole } from '../types'

export function CatalogPage({ token, role }: { token: string; role: UserRole }) {
  const [items, setItems] = useState<CatalogItem[]>([]), [search, setSearch] = useState(''), [name, setName] = useState(''), [error, setError] = useState(''), [success, setSuccess] = useState('')
  const [suggestions, setSuggestions] = useState<{
    query: string
    token: string
    items: Pick<CatalogItem, 'id' | 'name'>[]
    loading: boolean
    error: string
  } | null>(null)
  useEffect(() => {
    const query = search.trim()
    if (!query) { setSuggestions(null); return }
    let active = true
    const controller = new AbortController()
    setSuggestions({ query, token, items: [], loading: true, error: '' })
    const timeout = window.setTimeout(() => {
      void apiRequest<{ items: Pick<CatalogItem, 'id' | 'name'>[] }>(
        `/catalog/suggestions?search=${encodeURIComponent(query)}&limit=5`,
        { signal: controller.signal }, token,
      ).then((result) => {
        if (active) setSuggestions({ query, token, items: result.items, loading: false, error: '' })
      }).catch((caught: unknown) => {
        if (active) setSuggestions({ query, token, items: [], loading: false, error: caught instanceof Error ? caught.message : 'No se pudieron cargar las sugerencias' })
      })
    }, 300)
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [search, token])
  const currentSuggestions = suggestions?.query === search.trim() && suggestions.token === token ? suggestions : null
  async function load(term = search) { try { const result = await apiRequest<{ items: CatalogItem[] }>(`/catalog${term ? `?search=${encodeURIComponent(term)}` : ''}`, {}, token); setItems(result.items) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  useEffect(() => { void load('') }, [])
  async function create(event: FormEvent) { event.preventDefault(); setError(''); setSuccess(''); try { await apiRequest('/catalog', { method: 'POST', body: JSON.stringify({ name }) }, token); setName(''); setSuccess('Producto creado'); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function add(id: string) { setError(''); try { await apiRequest('/shopping-list/items', { method: 'POST', body: JSON.stringify({ catalogItemId: id }) }, token); setSuccess('Producto agregado a la lista'); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function rename(id: string, currentName: string) { const nextName = window.prompt('Nuevo nombre', currentName); if (!nextName) return; try { await apiRequest(`/catalog/${id}`, { method: 'PATCH', body: JSON.stringify({ name: nextName }) }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function remove(id: string) { if (!window.confirm('¿Eliminar producto del catálogo?')) return; try { await apiRequest(`/catalog/${id}`, { method: 'DELETE' }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  return <section><h2>Catálogo</h2><Message error={error} success={success} /><form className="inline" onSubmit={(event) => { event.preventDefault(); void load() }}><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar" /><button>Buscar</button></form>{search.trim() && <div aria-label="Sugerencias de productos" aria-live="polite">{(!currentSuggestions || currentSuggestions.loading) ? <p>Cargando sugerencias...</p> : currentSuggestions.error ? <p className="message error">{currentSuggestions.error}</p> : currentSuggestions.items.length === 0 ? <p>No hay sugerencias para esta búsqueda.</p> : <ul>{currentSuggestions.items.map((item) => <li key={item.id}><span>{item.name}</span> <button type="button" onClick={() => void add(item.id)}>Agregar a lista</button></li>)}</ul>}</div>}<form className="inline" onSubmit={create}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuevo producto" required /><button>Crear</button></form><div className="list">{items.map((item) => <div className="list-row" key={item.id}><div><strong>{item.name}</strong><small>{item.inShoppingList ? 'Ya está en la lista' : 'No está en la lista'}</small></div><div className="actions"><button onClick={() => void add(item.id)}>Agregar a lista</button>{role === 'ADMIN' && <><button className="secondary" onClick={() => void rename(item.id, item.name)}>Renombrar</button><button className="danger" onClick={() => void remove(item.id)}>Eliminar</button></>}</div></div>)}</div></section>
}
