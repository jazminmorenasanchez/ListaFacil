import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'
import { AppError } from '../src/lib/app-error'
const { getCatalogSuggestions } = vi.hoisted(() => ({ getCatalogSuggestions: vi.fn() }))
vi.mock('../src/services/catalog.service', () => ({ getCatalogSuggestions }))
import { suggestions } from '../src/controllers/catalog.controller'

// Doubles limitados al contrato que lee este controller; no simulan Express completo.
function setup(query: Request['query'], authenticated = true) {
  const request = { query, authenticatedUser: authenticated ? { id: 'user-1' } : undefined } as unknown as Request
  const json = vi.fn()
  const response = { json } as unknown as Response
  return { request, response, json, next: vi.fn() }
}
beforeEach(() => { getCatalogSuggestions.mockReset().mockResolvedValue([{ id: '1', name: 'Café' }]) })
describe('suggestions controller', () => {
  it.each([
    { query: {}, search: '', limit: undefined },
    { query: { search: 'cafe' }, search: 'cafe', limit: undefined },
    { query: { search: 'cafe', limit: '5' }, search: 'cafe', limit: 5 },
    { query: { limit: '20' }, search: '', limit: 20 },
  ])('acepta parámetros $query y responde items', async ({ query, search, limit }) => {
    const { request, response, json, next } = setup(query)
    await suggestions(request, response, next)
    expect(getCatalogSuggestions).toHaveBeenCalledExactlyOnceWith('user-1', search, limit)
    expect(json).toHaveBeenCalledExactlyOnceWith({ items: [{ id: '1', name: 'Café' }] })
    expect(next).not.toHaveBeenCalled()
  })
  it.each(['', '5abc', '1.5', '-1', '0', '21', 'Infinity', ['5', '6'], { value: '5' }])('rechaza limit %j sin invocar service', async (limit) => {
    const { request, response, json, next } = setup({ limit })
    await suggestions(request, response, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'El límite debe ser un entero entre 1 y 20' }))
    expect(next.mock.calls[0][0]).toBeInstanceOf(AppError)
    expect(getCatalogSuggestions).not.toHaveBeenCalled()
    expect(json).not.toHaveBeenCalled()
  })
  it('rechaza search repetido', async () => {
    const { request, response, next } = setup({ search: ['cafe', 'leche'] })
    await suggestions(request, response, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'La búsqueda debe ser un texto' }))
    expect(getCatalogSuggestions).not.toHaveBeenCalled()
  })
  it('rechaza usuario no autenticado', async () => {
    const { request, response, next } = setup({}, false)
    await suggestions(request, response, next)
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'Usuario no autenticado' }))
    expect(getCatalogSuggestions).not.toHaveBeenCalled()
  })
  it('propaga error del service a next sin enviar JSON', async () => {
    const error = new AppError(403, 'El usuario debe pertenecer a un hogar')
    getCatalogSuggestions.mockRejectedValue(error)
    const { request, response, json, next } = setup({ search: 'cafe' })
    await suggestions(request, response, next)
    expect(next).toHaveBeenCalledExactlyOnceWith(error)
    expect(json).not.toHaveBeenCalled()
  })
})
