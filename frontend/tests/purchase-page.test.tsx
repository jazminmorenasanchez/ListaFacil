import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PurchasePage } from '../src/pages/PurchasePage'
import type { apiRequest } from '../src/services/api'
import type { HouseholdMember, Purchase, ShoppingListItem, User } from '../src/types'

const token = 'test-token'
const initialTime = new Date('2026-10-06T15:00:00')
const enteredDate = '2026-10-06T15:05'
const expectedIso = new Date(enteredDate).toISOString()

const testUser: User = {
  id: 'user-1', name: 'Ana', email: 'ana@example.com', role: 'MEMBER',
  householdId: 'household-1', createdAt: '2026-10-01T12:00:00.000Z',
}
const member: HouseholdMember = {
  id: testUser.id, name: testUser.name, email: testUser.email,
  role: testUser.role, createdAt: testUser.createdAt,
}
const item: ShoppingListItem = {
  id: 'item-1', catalogItemId: 'product-1', name: 'Leche', quantity: 1,
  purchasedQuantity: 0, urgent: false, addedAt: '2026-10-01T12:00:00.000Z',
}
const scheduledPurchase: Purchase = {
  id: 'purchase-1', householdId: 'household-1', responsibleUserId: member.id,
  scheduledFor: expectedIso, status: 'SCHEDULED',
  createdAt: '2026-10-06T12:00:00.000Z', startedAt: null,
  responsibleUser: { id: member.id, name: member.name, email: member.email },
}

function createRequestMock() {
  let activePurchase: Purchase | null = null
  const requestMock = vi.fn<typeof apiRequest>().mockImplementation(async (path, options = {}) => {
    const method = options.method ?? 'GET'
    if (method === 'GET' && path === '/purchases/active') return { purchase: activePurchase }
    if (method === 'GET' && path === '/households/members') return { members: [member] }
    if (method === 'GET' && path === '/shopping-list') return { items: [item] }
    if (method === 'POST' && path === '/purchases') {
      activePurchase = scheduledPurchase
      return { purchase: scheduledPurchase }
    }
    throw new Error(`Solicitud inesperada: ${method} ${path}`)
  })
  // vi.fn convierte el retorno genérico en Promise<unknown>. Las fixtures tipadas
  // implementan las respuestas de estas rutas; recuperamos la firma en este límite.
  return requestMock as typeof requestMock & typeof apiRequest
}

afterEach(() => {
  vi.useRealTimers()
})

describe('PurchasePage', () => {
  it('programa una compra enviando responsable, fecha ISO y token mediante el cliente inyectado', async () => {
    vi.setSystemTime(initialTime)
    const requestMock = createRequestMock()
    const user = userEvent.setup()
    render(<PurchasePage token={token} user={testUser} request={requestMock} />)

    const dateInput = await screen.findByLabelText<HTMLInputElement>('Fecha y hora')
    await user.selectOptions(screen.getByLabelText('Responsable'), member.id)
    fireEvent.change(dateInput, { target: { value: enteredDate } })
    expect(dateInput.checkValidity()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Programar compra' }))

    await waitFor(() => {
      expect(requestMock).toHaveBeenCalledWith('/purchases', {
        method: 'POST',
        body: JSON.stringify({ responsibleUserId: member.id, scheduledFor: expectedIso }),
      }, token)
    })
    const heading = await screen.findByRole('heading', { name: 'Compra programada' })
    expect(document.body.contains(heading)).toBe(true)
    const schedulingCalls = requestMock.mock.calls.filter(
      ([path, options]) => path === '/purchases' && options?.method === 'POST',
    )
    expect(schedulingCalls).toHaveLength(1)
  })

  it('no programa la compra y muestra un error si la fecha deja de ser futura antes del envío', async () => {
    vi.setSystemTime(initialTime)
    const requestMock = createRequestMock()
    const user = userEvent.setup()
    render(<PurchasePage token={token} user={testUser} request={requestMock} />)

    const dateInput = await screen.findByLabelText<HTMLInputElement>('Fecha y hora')
    await user.selectOptions(screen.getByLabelText('Responsable'), member.id)
    fireEvent.change(dateInput, { target: { value: enteredDate } })
    const renderedMinimum = dateInput.min
    expect(dateInput.checkValidity()).toBe(true)

    // Cambiar el reloj no renderiza React: el min HTML conserva el valor anterior.
    vi.setSystemTime(new Date('2026-10-06T15:06:00'))
    expect(dateInput.min).toBe(renderedMinimum)
    expect(dateInput.checkValidity()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Programar compra' }))

    const message = await screen.findByText('La fecha programada debe ser futura', { exact: true })
    expect(document.body.contains(message)).toBe(true)
    const schedulingCalls = requestMock.mock.calls.filter(
      ([path, options]) => path === '/purchases' && options?.method === 'POST',
    )
    expect(schedulingCalls).toHaveLength(0)
  })

  it.each([true, false])('sólo el responsable registra cantidades y finaliza una compra en curso (responsable: %s)', async (isResponsible) => {
    let activePurchase: Purchase | null = { ...scheduledPurchase, status: 'IN_PROGRESS', startedAt: initialTime.toISOString(), items: [{ ...item, quantity: 3 }] }
    const unexpected: string[] = []
    const requestMock = vi.fn<typeof apiRequest>().mockImplementation(async (path, options = {}) => {
      const method = options.method ?? 'GET'
      if (method === 'GET' && path === '/purchases/active') return { purchase: activePurchase }
      if (method === 'GET' && path === '/households/members') return { members: [member] }
      if (method === 'GET' && path === '/shopping-list') return { items: [item] }
      if (method === 'PATCH' && path === `/purchases/items/${item.id}`) {
        if (activePurchase) activePurchase = { ...activePurchase, items: [{ ...item, quantity: 3, purchasedQuantity: 2 }] }
        return undefined
      }
      if (method === 'POST' && path === '/purchases/finish') { activePurchase = null; return undefined }
      unexpected.push(`${method} ${path}`)
      throw new Error(`Solicitud inesperada: ${method} ${path}`)
    })
    // El mock genérico devuelve Promise<unknown>; las respuestas por ruta están respaldadas por fixtures tipadas.
    const request = requestMock as typeof requestMock & typeof apiRequest
    const user = userEvent.setup()
    render(<PurchasePage token={token} user={isResponsible ? testUser : { ...testUser, id: 'user-2' }} request={request} />)
    await screen.findByRole('heading', { name: 'Compra en curso' })
    if (isResponsible) {
      const quantity = screen.getByRole('spinbutton')
      await user.clear(quantity)
      await user.type(quantity, '2')
      await user.tab()
      await waitFor(() => expect(requestMock.mock.calls.filter(([path]) => path === '/purchases/active')).toHaveLength(2))
      await screen.findByRole('button', { name: 'Finalizar compra' })
      await user.click(screen.getByRole('button', { name: 'Finalizar compra' }))
      await screen.findByRole('button', { name: 'Programar compra' })
      expect(requestMock.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toEqual([
        [`/purchases/items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ purchasedQuantity: 2 }) }, token],
      ])
      expect(requestMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toEqual([
        ['/purchases/finish', { method: 'POST' }, token],
      ])
    } else {
      expect(screen.queryByRole('spinbutton')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Finalizar compra' })).toBeNull()
      expect(screen.getByText('Comprado: 0')).toBeTruthy()
      expect(requestMock.mock.calls.filter(([, options]) => options?.method && options.method !== 'GET')).toHaveLength(0)
    }
    expect(unexpected).toEqual([])
  })

  it.each(['success', 'http-error', 'expired'] as const)('la postergación valida la fecha y sólo cierra tras éxito (resultado: %s)', async (outcome) => {
    vi.setSystemTime(initialTime)
    let activePurchase: Purchase = { ...scheduledPurchase, scheduledFor: initialTime.toISOString() }
    const unexpected: string[] = []
    const requestMock = vi.fn<typeof apiRequest>().mockImplementation(async (path, options = {}) => {
      const method = options.method ?? 'GET'
      if (method === 'GET' && path === '/purchases/active') return { purchase: activePurchase }
      if (method === 'GET' && path === '/households/members') return { members: [member] }
      if (method === 'GET' && path === '/shopping-list') return { items: [item] }
      if (method === 'POST' && path === '/purchases/postpone') {
        if (outcome === 'http-error') throw new Error('No se pudo posponer la compra')
        activePurchase = { ...activePurchase, scheduledFor: expectedIso }
        return { purchase: activePurchase }
      }
      unexpected.push(`${method} ${path}`)
      throw new Error(`Solicitud inesperada: ${method} ${path}`)
    })
    // Recuperamos la firma genérica sólo en el límite de inyección del mock, como en los tests existentes.
    const request = requestMock as typeof requestMock & typeof apiRequest
    const user = userEvent.setup()
    render(<PurchasePage token={token} user={testUser} request={request} />)
    await user.click(await screen.findByRole('button', { name: 'Posponer' }))
    const dateInput = screen.getByLabelText<HTMLInputElement>('Nueva fecha y hora')
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Guardar' }).disabled).toBe(true)
    fireEvent.change(dateInput, { target: { value: enteredDate } })
    if (outcome === 'expired') vi.setSystemTime(new Date('2026-10-06T15:06:00'))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    if (outcome === 'success') {
      await screen.findByRole('button', { name: 'Posponer' })
      expect(screen.queryByLabelText('Nueva fecha y hora')).toBeNull()
      expect(screen.getByText(`Fecha: ${new Date(expectedIso).toLocaleString()}`)).toBeTruthy()
    } else {
      await screen.findByText(outcome === 'expired' ? 'La fecha programada debe ser futura' : 'No se pudo posponer la compra', { exact: true })
      expect(screen.getByLabelText<HTMLInputElement>('Nueva fecha y hora').value).toBe(enteredDate)
      expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy()
    }
    expect(requestMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toEqual(outcome === 'expired' ? [] : [
      ['/purchases/postpone', { method: 'POST', body: JSON.stringify({ scheduledFor: expectedIso }) }, token],
    ])
    expect(unexpected).toEqual([])
  })
})
