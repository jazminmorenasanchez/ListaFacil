import { describe, expect, it } from 'vitest'
import { AppError } from '../src/lib/app-error'
import { comparableProductName, normalizeProductName } from '../src/lib/product-name'

describe('normalizeProductName', () => {
  it.each([
    { caso: 'conserva un nombre normal', entrada: 'Leche', esperado: 'Leche' },
    { caso: 'elimina espacios exteriores', entrada: '  Leche  ', esperado: 'Leche' },
    { caso: 'agrupa espacios interiores', entrada: 'Leche   entera', esperado: 'Leche entera' },
    { caso: 'normaliza tabs y saltos de línea', entrada: '\tArroz\nintegral  ', esperado: 'Arroz integral' },
    { caso: 'conserva los acentos', entrada: ' Café   molido ', esperado: 'Café molido' },
  ])('$caso', ({ entrada, esperado }) => {
    expect(normalizeProductName(entrada)).toBe(esperado)
  })

  it('rechaza un nombre vacío con AppError 400 y el mensaje de validación', () => {
    const normalize = () => normalizeProductName('')

    expect(normalize).toThrow(AppError)
    expect(normalize).toThrowError(expect.objectContaining({
      statusCode: 400,
      message: 'El nombre es obligatorio y debe tener hasta 120 caracteres',
    }))
  })

  it('rechaza un nombre compuesto solo por whitespace con AppError 400 y el mensaje de validación', () => {
    const normalize = () => normalizeProductName('  \t\n  ')

    expect(normalize).toThrow(AppError)
    expect(normalize).toThrowError(expect.objectContaining({
      statusCode: 400,
      message: 'El nombre es obligatorio y debe tener hasta 120 caracteres',
    }))
  })

  it('rechaza un nombre de 121 caracteres con AppError 400 y el mensaje de validación', () => {
    const normalize = () => normalizeProductName('a'.repeat(121))

    expect(normalize).toThrow(AppError)
    expect(normalize).toThrowError(expect.objectContaining({
      statusCode: 400,
      message: 'El nombre es obligatorio y debe tener hasta 120 caracteres',
    }))
  })

  it('acepta un nombre de exactamente 120 caracteres', () => {
    const name = 'a'.repeat(120)

    expect(normalizeProductName(name)).toBe(name)
  })
})

describe('comparableProductName', () => {
  it('considera equivalentes nombres que solo difieren en mayúsculas y minúsculas', () => {
    expect(comparableProductName('LECHE')).toBe(comparableProductName('leche'))
  })

  it('considera equivalentes nombres con espacios exteriores e interiores diferentes', () => {
    expect(comparableProductName('  Leche   entera  ')).toBe(comparableProductName('Leche entera'))
  })

  it('considera equivalentes CAFÉ y cafe pese a los acentos, mayúsculas y espacios', () => {
    expect(comparableProductName('CAFÉ')).toBe(comparableProductName(' cafe '))
  })

  it('considera equivalentes nombres que combinan acentos, mayúsculas y whitespace', () => {
    expect(comparableProductName('  CAFÉ\tMOLIDO\n')).toBe(comparableProductName('cafe molido'))
  })

  it('considera equivalentes piñón y pinon al eliminar las marcas de acentuación', () => {
    expect(comparableProductName('piñón')).toBe(comparableProductName('pinon'))
  })

  it('distingue productos con nombres diferentes como leche entera y leche descremada', () => {
    expect(comparableProductName('Leche entera')).not.toBe(comparableProductName('Leche descremada'))
  })
})
