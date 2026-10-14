import express, { type NextFunction, type Request, type Response } from 'express'
import type { Server } from 'node:http'
import jwt from 'jsonwebtoken'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/lib/app-error'

const { findUnique, deleteOwnAccount } = vi.hoisted(() => ({ findUnique: vi.fn(), deleteOwnAccount: vi.fn() }))
vi.mock('../src/lib/prisma', () => ({ prisma: { user: { findUnique } } }))
vi.mock('../src/services/account.service', () => ({ deleteOwnAccount }))
import { authRouter } from '../src/routes/auth.routes'

// Real Express routing/JWT middleware over loopback; database and deletion are doubles.
let server: Server
let baseUrl: string
let token: string
beforeAll(async () => {
  vi.stubEnv('JWT_SECRET', 'local-test-secret-not-a-deployed-credential')
  token = jwt.sign({ userId: 'self' }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRouter)
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof AppError) response.status(error.statusCode).json({ message: error.message })
    else response.status(500).json({ message: 'Error interno del servidor' })
  })
  await new Promise<void>((resolve) => { server = app.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected loopback listener')
  baseUrl = `http://127.0.0.1:${address.port}`
})
afterAll(async () => {
  await new Promise<void>((resolve, reject) => { server.close((error) => error ? reject(error) : resolve()) })
  vi.unstubAllEnvs()
})
beforeEach(() => {
  vi.resetAllMocks()
  findUnique.mockResolvedValue({ id: 'self', name: 'Self', role: 'MEMBER', householdId: null })
  deleteOwnAccount.mockResolvedValue(undefined)
})
function remove(authorization?: string, body: object = { currentPassword: 'test-password' }) {
  return fetch(`${baseUrl}/api/auth/me`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  })
}

describe('DELETE /api/auth/me', () => {
  it.each([undefined, 'Bearer invalid-token'])('rechaza token ausente o inválido: %s', async (authorization) => {
    const response = await remove(authorization)
    expect(response.status).toBe(401)
    expect(findUnique).not.toHaveBeenCalled()
    expect(deleteOwnAccount).not.toHaveBeenCalled()
  })
  it('rechaza JWT válido de usuario eliminado sin ejecutar eliminación', async () => {
    findUnique.mockResolvedValue(null)
    const response = await remove(`Bearer ${token}`)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: 'Token inválido o expirado' })
    expect(deleteOwnAccount).not.toHaveBeenCalled()
  })
  it('usa sólo el ID autenticado, ignora un destino ajeno y responde 204 sin cuerpo', async () => {
    const response = await remove(`Bearer ${token}`, { currentPassword: 'test-password', userId: 'someone-else', id: 'someone-else' })
    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(deleteOwnAccount).toHaveBeenCalledExactlyOnceWith('self', 'test-password')
  })
  it.each([403, 409, 429])('propaga error %s sin responder éxito', async (status) => {
    deleteOwnAccount.mockRejectedValue(new AppError(status, 'Operation rejected'))
    const response = await remove(`Bearer ${token}`)
    expect(response.status).toBe(status)
    expect(await response.json()).toEqual({ message: 'Operation rejected' })
  })
})
