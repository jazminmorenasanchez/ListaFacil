import { describe, expect, it } from 'vitest'
import { suggestCatalogItems } from '../src/lib/catalog-suggestions'
import { AppError } from '../src/lib/app-error'

describe('suggestCatalogItems', () => {
  it.each(['', ' \t\n '])('consulta vacía %j devuelve []', (query) => {
    expect(suggestCatalogItems([{ id: '1', name: 'Leche' }], query)).toEqual([])
  })
  it('catálogo vacío devuelve []', () => { expect(suggestCatalogItems([], 'leche')).toEqual([]) })
  it('omite productos sin coincidencias o con palabras faltantes', () => {
    expect(suggestCatalogItems([{ id: '1', name: 'Café' }], 'molido cafe')).toEqual([])
  })
  it.each([
    { query: 'cafe molido', name: 'Café molido' },
    { query: 'caf', name: 'Café molido' },
    { query: 'molido cafe', name: 'Café molido' },
    { query: 'afe', name: 'Café molido' },
    { query: '  CAFE\tMOLIDO\n', name: 'Café molido' },
  ])('reconoce $query y conserva $name', ({ query, name }) => {
    expect(suggestCatalogItems([{ id: '1', name }], query)).toEqual([{ id: '1', name }])
  })
  it('ordena exacto, prefijo, palabras y fragmento por relevancia', () => {
    const items = [
      { id: 'fragment', name: 'Descafe molido especial' },
      { id: 'words', name: 'Molido de café' },
      { id: 'prefix', name: 'Café molido especial' },
      { id: 'exact', name: 'Café molido' },
    ]
    expect(suggestCatalogItems(items, 'cafe molido').map((item) => item.id)).toEqual(['exact', 'prefix', 'words', 'fragment'])
  })
  it('desempata por nombre normalizado y luego ID sin mutar candidatos', () => {
    const items = Object.freeze([
      Object.freeze({ id: 'z', name: 'Leche z' }),
      Object.freeze({ id: 'b', name: 'Leche A' }),
      Object.freeze({ id: 'a', name: 'LECHE a' }),
    ])
    expect(suggestCatalogItems(items, 'leche').map((item) => item.id)).toEqual(['a', 'b', 'z'])
    expect(items.map((item) => item.id)).toEqual(['z', 'b', 'a'])
    expect(items[2].name).toBe('LECHE a')
  })
  it('candidatos idénticos mantienen su orden', () => {
    const first = { id: 'a', name: 'Leche' }, second = { id: 'a', name: 'LECHE' }
    expect(suggestCatalogItems([first, second], 'leche')).toEqual([first, second])
  })
  it('limita a cinco por defecto', () => {
    const items = Array.from({ length: 7 }, (_, index) => ({ id: String(index), name: `Leche ${index}` }))
    expect(suggestCatalogItems(items, 'leche')).toEqual(items.slice(0, 5))
  })
  it.each([1, 2, 20])('respeta límite explícito %s', (limit) => {
    const items = Array.from({ length: 21 }, (_, index) => ({ id: String(index), name: `Leche ${String(index).padStart(2, '0')}` }))
    expect(suggestCatalogItems(items, 'leche', limit)).toEqual(items.slice(0, limit))
  })
  it.each([0, -1, 1.5, 21, NaN, Infinity])('rechaza límite inválido %s', (limit) => {
    const run = () => suggestCatalogItems([], '', limit)
    expect(run).toThrow(AppError)
    expect(run).toThrow(expect.objectContaining({ statusCode: 400, message: 'El límite debe ser un entero entre 1 y 20' }))
  })
})
