import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../src/App'

const token = 'local-test-token'
const password = 'test-password'
let hasHousehold = true
let role: 'ADMIN' | 'MEMBER' = 'ADMIN'
const remove = vi.fn<(options: RequestInit) => Promise<Response>>()

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('listafacil_token', token)
  hasHousehold = true; role = 'ADMIN'
  remove.mockReset().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async (input, options = {}) => {
    const path = String(input)
    if (path === '/api/auth/me' && options.method === 'DELETE') return remove(options)
    if (path === '/api/auth/me') return json({ user: { id: 'self', name: 'Test user', email: 'self@example.invalid', role, householdId: hasHousehold ? 'home' : null, createdAt: '2026-01-01' } })
    if (path === '/api/households/current') return json({ household: hasHousehold ? { id: 'home', name: 'Test home', joinCode: 'ABC123', role, memberCount: 1, createdAt: '2026-01-01' } : null })
    if (path === '/api/households/members' || path === '/api/shopping-list' || path === '/api/catalog') return json(path.endsWith('/members') ? { members: [] } : { items: [] })
    if (path === '/api/purchases/active') return json({ purchase: null })
    throw new Error(`Unexpected test request: ${path}`)
  }))
})
afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

async function mount() {
  render(<App />)
  if (hasHousehold) fireEvent.click(await screen.findByRole('button', { name: 'Hogar', exact: true }))
  await screen.findByRole('button', { name: 'Eliminar cuenta', exact: true })
}

function open() {
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar cuenta', exact: true }))
  return screen.getByRole('form', { name: 'Eliminar cuenta' })
}

function fillPassword(value = password) {
  fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value } })
}

describe('eliminación de cuenta desde la interfaz', () => {
  it.each([
    { household: true, userRole: 'ADMIN' as const },
    { household: true, userRole: 'MEMBER' as const },
    { household: false, userRole: 'MEMBER' as const },
  ])('ofrece eliminación con hogar=$household y rol=$userRole', async ({ household, userRole }) => {
    hasHousehold = household; role = userRole
    await mount()
    const button = screen.getByRole('button', { name: 'Eliminar cuenta', exact: true })
    expect(button).toBeTruthy()
    if (household) {
      const leave = screen.getByRole('button', { name: 'Abandonar hogar' })
      expect(leave.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
    expect(remove).not.toHaveBeenCalled()
  })

  it('explica consecuencias y permite cancelar descartando contraseña sin hacer solicitudes', async () => {
    await mount(); open()
    expect(screen.getByText(/permanente y no se puede deshacer/)).toBeTruthy()
    expect(screen.getByText(/Si quedan integrantes/)).toBeTruthy()
    expect(screen.getByText('¿Qué pasará con tu hogar?')).toBeTruthy()
    fillPassword()
    expect(Object.keys(localStorage)).toEqual(['listafacil_token'])
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('form', { name: 'Eliminar cuenta' })).toBeNull()
    expect(remove).not.toHaveBeenCalled()
    expect(localStorage.getItem('listafacil_token')).toBe(token)
    open()
    expect((screen.getByLabelText('Contraseña actual') as HTMLInputElement).value).toBe('')
  })

  it('exige contraseña mediante validación HTML y también antes de enviar', async () => {
    await mount(); const form = open()
    const input = screen.getByLabelText('Contraseña actual') as HTMLInputElement
    expect(input.required).toBe(true)
    expect(input.checkValidity()).toBe(false)
    fireEvent.submit(form)
    expect(screen.getByRole('alert').textContent).toBe('Ingresá tu contraseña actual')
    expect(remove).not.toHaveBeenCalled()
  })

  it.each([true, false])('impide doble envío y sólo limpia sesión después de recibir 204 (con hogar: %s)', async (household) => {
    hasHousehold = household
    let resolve!: (response: Response) => void
    remove.mockReturnValue(new Promise<Response>((done) => { resolve = done }))
    await mount(); const form = open(); fillPassword()
    act(() => { fireEvent.submit(form); fireEvent.submit(form) })
    expect(remove).toHaveBeenCalledOnce()
    const options = remove.mock.calls[0][0]
    expect(options.method).toBe('DELETE')
    expect(options.body).toBe(JSON.stringify({ currentPassword: password }))
    expect(new Headers(options.headers).get('Authorization')).toBe(`Bearer ${token}`)
    expect((screen.getByRole('button', { name: 'Eliminando cuenta...' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Cancelar' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByLabelText('Contraseña actual') as HTMLInputElement).value).toBe('')
    expect(localStorage.getItem('listafacil_token')).toBe(token)
    await act(async () => { resolve(new Response(null, { status: 204 })) })
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
    expect(localStorage.getItem('listafacil_token')).toBeNull()
  })

  it.each([
    { status: 403, message: 'La contraseña actual es incorrecta', expected: 'La contraseña actual es incorrecta' },
    { status: 409, message: 'El responsable debe liberar la compra programada antes de salir del hogar', expected: 'El responsable debe liberar la compra programada antes de salir del hogar' },
    { status: 409, message: 'El responsable debe finalizar la compra en curso antes de salir del hogar', expected: 'El responsable debe finalizar la compra en curso antes de salir del hogar' },
    { status: 429, message: 'Demasiados intentos', expected: 'Demasiados intentos. Esperá unos minutos y volvé a intentarlo.' },
    { status: 500, message: 'Error interno del servidor', expected: 'Error interno del servidor' },
    { status: 0, message: 'Failed to fetch', expected: 'No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.' },
  ])('muestra error $status y permite reintentar sin perder la sesión', async ({ status, message, expected }) => {
    if (status) remove.mockResolvedValueOnce(json({ message }, status))
    else remove.mockRejectedValueOnce(new TypeError(message))
    await mount(); open(); fillPassword()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(expected))
    expect(localStorage.getItem('listafacil_token')).toBe(token)
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).toBeNull()
    expect((screen.getByRole('button', { name: 'Eliminar mi cuenta' }) as HTMLButtonElement).disabled).toBe(false)
    fillPassword('corrected-password')
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar mi cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
    expect(remove).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('listafacil_token')).toBeNull()
  })
})
