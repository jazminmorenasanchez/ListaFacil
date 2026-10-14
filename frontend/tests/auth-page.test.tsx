import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPage } from '../src/pages/AuthPage'

const fetchMock = vi.fn<typeof fetch>()
const onAuthenticated = vi.fn()
const user = { id: 'new-user', name: 'Test', email: 'test@example.invalid', role: 'MEMBER', householdId: null, createdAt: '2026-01-01' }

beforeEach(() => {
  onAuthenticated.mockReset()
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ user, token: 'test-token' }), { status: 201 }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function mountRegister() {
  render(<AuthPage onAuthenticated={onAuthenticated} />)
  fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }))
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: user.name } })
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
}

function enterPasswords(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText('Contraseña', { exact: true }), { target: { value: password } })
  fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: confirmation } })
}

describe('confirmación de contraseña en el registro', () => {
  it('muestra dos campos ocultos y conserva required y minLength=8', () => {
    mountRegister()
    for (const label of ['Contraseña', 'Confirmar contraseña']) {
      const input = screen.getByLabelText(label, { exact: true }) as HTMLInputElement
      expect(input.type).toBe('password')
      expect(input.required).toBe(true)
      expect(input.minLength).toBe(8)
      expect(input.checkValidity()).toBe(false)
    }
    const name = screen.getByLabelText('Nombre') as HTMLInputElement
    const email = screen.getByLabelText('Email') as HTMLInputElement
    expect(name.required).toBe(true)
    expect(email.required).toBe(true)
    expect(email.type).toBe('email')
    fireEvent.change(email, { target: { value: 'invalid-email' } })
    expect(email.checkValidity()).toBe(false)
  })

  it.each([
    ['Password123', 'password123'],
    ['Password123', 'Password123 '],
    ['Password123', 'Different123'],
  ])('rechaza coincidencia no exacta: %j / %j sin HTTP', (password, confirmation) => {
    mountRegister(); enterPasswords(password, confirmation)
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: 'Registrarme' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('permite corregir la confirmación y envía sólo name, email y password', async () => {
    mountRegister(); enterPasswords('Password123', 'Different123')
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    expect(fetchMock).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledExactlyOnceWith('test-token', user))
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/register')
    expect(options?.method).toBe('POST')
    expect(JSON.parse(String(options?.body))).toEqual({ name: user.name, email: user.email, password: 'Password123' })
    expect(screen.queryByText('Las contraseñas no coinciden')).toBeNull()
  })

  it('no envía con confirmación vacía', () => {
    mountRegister(); enterPasswords('Password123', '')
    fireEvent.click(screen.getByRole('button', { name: 'Registrarme' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(onAuthenticated).not.toHaveBeenCalled()
  })

  it('mantiene el login sin confirmación ni cambios en su payload', async () => {
    render(<AuthPage onAuthenticated={onAuthenticated} />)
    expect(screen.queryByLabelText('Confirmar contraseña')).toBeNull()
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Password123' } })
    const form = screen.getByRole('heading', { name: 'Iniciar sesión' }).closest('form')!
    fireEvent.click(within(form).getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(JSON.parse(String(options?.body))).toEqual({ email: user.email, password: 'Password123' })
  })
})
