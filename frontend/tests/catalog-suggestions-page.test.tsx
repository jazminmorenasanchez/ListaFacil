import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { CatalogPage } from '../src/pages/CatalogPage'
import { apiRequest } from '../src/services/api'

vi.mock('../src/services/api', () => ({ apiRequest: vi.fn() }))
const request = vi.mocked(apiRequest)
const token = 'test-token'
const item = { id: 'product-1', name: 'Café molido' }
const suggestionCalls = () => request.mock.calls.filter(([path]) => path.startsWith('/catalog/suggestions?'))
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
async function mount() {
  const view = render(<CatalogPage token={token} role="MEMBER" />)
  await act(async () => {})
  return view
}
const typeQuery = (value: string) => fireEvent.change(screen.getByPlaceholderText('Buscar'), { target: { value } })
async function advance(ms: number) { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
beforeEach(() => {
  vi.useFakeTimers()
  request.mockReset().mockImplementation(async (path, options = {}) => {
    if (path.startsWith('/catalog/suggestions?')) return { items: [item] }
    if (path.startsWith('/catalog') && !options.method) return { items: [] }
    if (path === '/shopping-list/items' && options.method === 'POST') return undefined
    throw new Error(`Solicitud inesperada: ${path}`)
  })
})
afterEach(() => { cleanup(); vi.useRealTimers(); request.mockReset() })

describe('sugerencias automáticas del catálogo', () => {
  it('no consulta con búsqueda vacía o whitespace', async () => {
    await mount()
    await advance(300)
    typeQuery('  ')
    await advance(300)
    expect(suggestionCalls()).toHaveLength(0)
    expect(screen.queryByLabelText('Sugerencias de productos')).toBeNull()
  })
  it('espera 300 ms desde la última pulsación y conserva orden y nombres', async () => {
    const items = [item, { id: '2', name: 'Café' }]
    await mount()
    request.mockResolvedValue({ items })
    typeQuery('c')
    await advance(200)
    typeQuery(' cafe ')
    await advance(299)
    expect(suggestionCalls()).toHaveLength(0)
    expect(screen.getByText('Cargando sugerencias...')).toBeTruthy()
    await advance(1)
    expect(suggestionCalls()).toHaveLength(1)
    expect(suggestionCalls()[0]).toEqual(['/catalog/suggestions?search=cafe&limit=5', { signal: expect.any(AbortSignal) }, token])
    const rows = within(screen.getByLabelText('Sugerencias de productos')).getAllByRole('listitem')
    expect(rows.map((row) => row.querySelector('span')?.textContent)).toEqual(items.map((value) => value.name))
  })
  it('muestra resultado vacío', async () => {
    await mount()
    request.mockResolvedValue({ items: [] })
    typeQuery('inexistente')
    await advance(300)
    expect(screen.getByText('No hay sugerencias para esta búsqueda.')).toBeTruthy()
  })
  it.each([new Error('No se pudieron obtener productos'), 'fallo sin Error'])('muestra error de sugerencias sin interferir con Buscar: %s', async (error) => {
    await mount()
    request.mockRejectedValueOnce(error)
    typeQuery('cafe')
    await advance(300)
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las sugerencias'
    expect(within(screen.getByLabelText('Sugerencias de productos')).getByText(message)).toBeTruthy()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Buscar' })) })
    expect(request).toHaveBeenCalledWith('/catalog?search=cafe', {}, token)
    expect(screen.getByText(message)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Ver sugerencias' })).toBeNull()
  })
  it('agrega la sugerencia por el flujo existente y recarga búsqueda tradicional', async () => {
    await mount()
    typeQuery('café')
    await advance(300)
    await act(async () => { fireEvent.click(within(screen.getByLabelText('Sugerencias de productos')).getByRole('button', { name: 'Agregar a lista' })) })
    expect(request).toHaveBeenCalledWith('/shopping-list/items', { method: 'POST', body: JSON.stringify({ catalogItemId: item.id }) }, token)
    expect(request).toHaveBeenCalledWith('/catalog?search=caf%C3%A9', {}, token)
    expect(screen.getByText('Producto agregado a la lista')).toBeTruthy()
  })
  it.each(['resolve', 'reject'] as const)('ignora respuesta anterior que llega tarde: %s', async (outcome) => {
    await mount()
    const old = deferred<{ items: typeof item[] }>()
    request.mockReturnValueOnce(old.promise)
    typeQuery('cafe')
    await advance(300)
    const signal = suggestionCalls()[0][1]?.signal
    typeQuery('leche')
    expect(signal?.aborted).toBe(true)
    expect(screen.queryByText(item.name)).toBeNull()
    request.mockResolvedValueOnce({ items: [{ id: 'new', name: 'Leche' }] })
    await advance(300)
    await act(async () => { if (outcome === 'resolve') old.resolve({ items: [item] }); else old.reject(new Error('Error viejo')) })
    expect(screen.getByText('Leche')).toBeTruthy()
    expect(screen.queryByText(item.name)).toBeNull()
    expect(screen.queryByText('Error viejo')).toBeNull()
  })
  it('vaciar consulta oculta resultados y cancela solicitud pendiente', async () => {
    await mount()
    const pending = deferred<{ items: typeof item[] }>()
    request.mockReturnValueOnce(pending.promise)
    typeQuery('cafe')
    await advance(300)
    const signal = suggestionCalls()[0][1]?.signal
    typeQuery('')
    expect(signal?.aborted).toBe(true)
    await act(async () => { pending.resolve({ items: [item] }) })
    expect(screen.queryByLabelText('Sugerencias de productos')).toBeNull()
  })
  it('desmontar antes del debounce cancela timer', async () => {
    const view = await mount()
    typeQuery('cafe')
    view.unmount()
    await advance(300)
    expect(suggestionCalls()).toHaveLength(0)
  })
  it('desmontar aborta una solicitud activa y permite su rechazo tardío', async () => {
    const view = await mount()
    const pending = deferred<{ items: typeof item[] }>()
    request.mockReturnValueOnce(pending.promise)
    typeQuery('cafe')
    await advance(300)
    const signal = suggestionCalls()[0][1]?.signal
    view.unmount()
    expect(signal?.aborted).toBe(true)
    await act(async () => { pending.reject(new DOMException('Cancelado', 'AbortError')) })
    expect(screen.queryByLabelText('Sugerencias de productos')).toBeNull()
  })
})
