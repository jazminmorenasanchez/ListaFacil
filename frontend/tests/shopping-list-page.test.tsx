import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShoppingListPage } from '../src/pages/ShoppingListPage'
import { apiRequest } from '../src/services/api'
import type { CatalogItem, Purchase, ShoppingListItem } from '../src/types'

vi.mock('../src/services/api', () => ({ apiRequest: vi.fn() }))
const requestMock = vi.mocked(apiRequest)
const token = 'test-token'
const item: ShoppingListItem = { id: 'item-1', catalogItemId: 'product-1', name: 'Leche', quantity: 2, purchasedQuantity: 0, urgent: false, addedAt: '2026-10-01T12:00:00Z' }
const catalogItem: CatalogItem = { id: item.catalogItemId, name: item.name, householdId: 'household-1', createdAt: item.addedAt, inShoppingList: true, shoppingListItem: { id: item.id, quantity: item.quantity, purchasedQuantity: 0, urgent: false } }

function setupRequest(status: Purchase['status'] | null) {
  let currentItem = { ...item }
  const unexpected: string[] = []
  const purchase: Purchase | null = status === null ? null : { id: 'purchase-1', householdId: 'household-1', responsibleUserId: 'user-1', scheduledFor: item.addedAt, status, createdAt: item.addedAt, startedAt: status === 'IN_PROGRESS' ? item.addedAt : null, responsibleUser: { id: 'user-1', name: 'Ana', email: 'ana@example.com' } }
  requestMock.mockImplementation(async (path, options = {}, receivedToken) => {
    expect(receivedToken).toBe(token)
    const method = options.method ?? 'GET'
    if (method === 'GET' && path === '/shopping-list') return { items: [currentItem] }
    if (method === 'GET' && path === '/catalog') return { items: [catalogItem] }
    if (method === 'GET' && path === '/purchases/active') return { purchase }
    if (method === 'PATCH' && path === `/shopping-list/items/${item.id}`) {
      expect(options.body).toBe(JSON.stringify({ quantity: 3 }))
      currentItem = { ...currentItem, quantity: 3 }
      return undefined
    }
    unexpected.push(`${method} ${path}`)
    throw new Error(`Solicitud inesperada: ${method} ${path}`)
  })
  return unexpected
}

afterEach(() => { requestMock.mockReset() })

describe('ShoppingListPage', () => {
  it.each(['IN_PROGRESS', null, 'SCHEDULED'] as const)('sólo una compra en curso bloquea la edición (estado: %s)', async (status) => {
    const unexpected = setupRequest(status)
    const user = userEvent.setup()
    render(<ShoppingListPage token={token} />)
    const quantity = await screen.findByRole<HTMLInputElement>('spinbutton', { name: 'Cantidad de Leche' })
    const urgent = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Urgente' })
    const select = screen.getByRole<HTMLSelectElement>('combobox')
    const remove = screen.getByRole<HTMLButtonElement>('button', { name: 'Quitar' })
    const add = screen.getByRole<HTMLButtonElement>('button', { name: 'Agregar' })
    const locked = status === 'IN_PROGRESS'
    for (const control of [quantity, urgent, select, remove]) expect(control.disabled).toBe(locked)
    expect(add.disabled).toBe(true)
    if (locked) {
      await user.click(urgent)
      await user.click(remove)
      await user.click(add)
      expect(quantity.value).toBe('2')
    } else {
      await user.selectOptions(select, catalogItem.id)
      expect(add.disabled).toBe(false)
    }
    expect(requestMock.mock.calls.filter(([, options]) => options?.method && options.method !== 'GET')).toHaveLength(0)
    expect(unexpected).toEqual([])
    for (const path of ['/shopping-list', '/catalog', '/purchases/active']) expect(requestMock).toHaveBeenCalledWith(path, {}, token)
  })

  it.each([false, true])('sólo actualiza al perder foco si cambia la cantidad (cambio: %s)', async (changed) => {
    const unexpected = setupRequest(null)
    const user = userEvent.setup()
    render(<ShoppingListPage token={token} />)
    const quantity = await screen.findByRole<HTMLInputElement>('spinbutton', { name: 'Cantidad de Leche' })
    await user.click(quantity)
    if (changed) { await user.clear(quantity); await user.type(quantity, '3') }
    await user.tab()
    if (changed) {
      await waitFor(() => expect(screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Cantidad de Leche' }).value).toBe('3'))
      await waitFor(() => expect(requestMock.mock.calls.filter(([path]) => path === '/shopping-list')).toHaveLength(2))
    }
    const patches = requestMock.mock.calls.filter(([, options]) => options?.method === 'PATCH')
    expect(patches).toEqual(changed ? [[`/shopping-list/items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ quantity: 3 }) }, token]] : [])
    expect(unexpected).toEqual([])
  })
})
