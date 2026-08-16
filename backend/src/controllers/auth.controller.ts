import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import * as authService from '../services/auth.service'

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

export async function register(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const name = readString(request.body?.name)
    const email = readString(request.body?.email)
    const password = readString(request.body?.password)

    if (name === null || email === null || password === null) {
      throw new AppError(400, 'Nombre, email y contraseña son obligatorios')
    }

    const result = await authService.register({ name, email, password })
    response.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export async function login(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const email = readString(request.body?.email)
    const password = readString(request.body?.password)

    if (email === null || password === null) {
      throw new AppError(400, 'Email y contraseña son obligatorios')
    }

    const result = await authService.login({ email, password })
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export function me(request: Request, response: Response): void {
  response.json({ user: request.authenticatedUser })
}
