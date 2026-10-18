import { FormEvent, useEffect, useRef, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'
import type { CatalogItem, Purchase, ShoppingListItem } from '../types'
import { prepareShoppingListRows, shoppingListCsv, type ExportScope, type ExportRow } from '../lib/shopping-list-csv'
import { downloadCsv } from '../lib/download-csv'

export function ShoppingListPage({ token }: { token: string }) {
  const [items, setItems] = useState<ShoppingListItem[]>([]), [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [selected, setSelected] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true), [locked, setLocked] = useState(false)
  const [exportScope, setExportScope] = useState<ExportScope>('pending')
  const [preparing, setPreparing] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [preview, setPreview] = useState<{ scope: ExportScope; rows: ExportRow[]; emptyList: boolean } | null>(null)
  const preparationInFlight = useRef(false)
  function changeExportScope(scope: ExportScope) {
    setExportScope(scope)
    setPreview(null)
    setDownloadError('')
  }
  async function prepareCsv() {
    if (preparationInFlight.current) return
    preparationInFlight.current = true
    setPreparing(true)
    setPreview(null)
    setDownloadError('')
    try {
      const result = await apiRequest<{ items: ShoppingListItem[] }>('/shopping-list', {}, token)
      setPreview({ scope: exportScope, rows: prepareShoppingListRows(result.items, exportScope), emptyList: result.items.length === 0 })
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : 'No se pudo preparar la lista')
    } finally {
      preparationInFlight.current = false
      setPreparing(false)
    }
  }
  function confirmCsv() {
    if (!preview || preview.scope !== exportScope) return
    setDownloadError('')
    try {
      downloadCsv(shoppingListCsv(preview.rows))
      setPreview(null)
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : 'No se pudo descargar la lista')
    }
  }
  async function load() { setLoading(true); setError(''); try { const [listResult, catalogResult, purchaseResult] = await Promise.all([apiRequest<{ items: ShoppingListItem[] }>('/shopping-list', {}, token), apiRequest<{ items: CatalogItem[] }>('/catalog', {}, token), apiRequest<{ purchase: Purchase | null }>('/purchases/active', {}, token)]); setItems(listResult.items); setCatalog(catalogResult.items); setLocked(purchaseResult.purchase?.status === 'IN_PROGRESS') } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  async function add(event: FormEvent) { event.preventDefault(); if (!selected) return; try { await apiRequest('/shopping-list/items', { method: 'POST', body: JSON.stringify({ catalogItemId: selected }) }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function patch(id: string, update: object) { try { await apiRequest(`/shopping-list/items/${id}`, { method: 'PATCH', body: JSON.stringify(update) }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function remove(id: string) { try { await apiRequest(`/shopping-list/items/${id}`, { method: 'DELETE' }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  if (loading) return <p>Cargando...</p>
  return <section><h2>Lista de compras</h2><Message error={error} /><div className="card">
    <fieldset disabled={preparing}>
      <legend>Productos a exportar</legend>
      <label className="check"><input type="radio" name="export-scope" checked={exportScope === 'pending'} onChange={() => changeExportScope('pending')} />Pendientes</label>
      <label className="check"><input type="radio" name="export-scope" checked={exportScope === 'all'} onChange={() => changeExportScope('all')} />Todos</label>
    </fieldset>
    <button type="button" disabled={preparing} onClick={() => void prepareCsv()}>{preparing ? 'Preparando...' : 'Preparar CSV'}</button>
    <Message error={downloadError} />
    {preview && preview.scope === exportScope && <div aria-label="Vista previa del CSV">
      <p>Alcance: {preview.scope === 'pending' ? 'Pendientes' : 'Todos'} · Productos incluidos: {preview.rows.length}</p>
      {preview.emptyList ? <p>La lista recibida está vacía. El CSV contendrá sólo el encabezado.</p> : preview.rows.length === 0 ? <p>No hay productos pendientes. El CSV contendrá sólo el encabezado.</p> : <table>
        <thead><tr><th>Producto</th><th>Cantidad necesaria</th><th>Cantidad comprada</th><th>Cantidad pendiente</th><th>Urgente</th></tr></thead>
        <tbody>{preview.rows.map((row, index) => <tr key={index}><td>{row.name}</td><td>{row.quantity}</td><td>{row.purchasedQuantity}</td><td>{row.pendingQuantity}</td><td>{row.urgent ? 'Sí' : 'No'}</td></tr>)}</tbody>
      </table>}
      <div className="actions"><button type="button" onClick={confirmCsv}>Descargar CSV</button><button type="button" className="secondary" onClick={() => { setPreview(null); setDownloadError('') }}>Cancelar</button></div>
    </div>}
  </div>{locked && <p className="message">La lista está bloqueada porque hay una compra en curso.</p>}<form className="inline" onSubmit={add}><select value={selected} onChange={(e) => setSelected(e.target.value)} disabled={locked}><option value="">Seleccionar producto</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button disabled={locked || !selected}>Agregar</button></form><div className="list">{items.length === 0 && <p>La lista está vacía.</p>}{items.map((item) => <div className="list-row" key={item.id}><div><strong>{item.name}</strong>{item.urgent && <span className="urgent"> Urgente</span>}<small>Comprado: {item.purchasedQuantity} de {item.quantity}</small></div><div className="actions"><input aria-label={`Cantidad de ${item.name}`} type="number" min="1" defaultValue={item.quantity} disabled={locked} onBlur={(e) => Number(e.target.value) !== item.quantity && void patch(item.id, { quantity: Number(e.target.value) })} /><label className="check"><input type="checkbox" checked={item.urgent} disabled={locked} onChange={(e) => void patch(item.id, { urgent: e.target.checked })} /> Urgente</label><button className="danger" disabled={locked} onClick={() => void remove(item.id)}>Quitar</button></div></div>)}</div></section>
}
