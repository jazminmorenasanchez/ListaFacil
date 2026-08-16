import { AppError } from './app-error'

export function normalizeProductName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ')

  if (!normalized || normalized.length > 120) {
    throw new AppError(400, 'El nombre es obligatorio y debe tener hasta 120 caracteres')
  }

  return normalized
}

export function comparableProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
}
