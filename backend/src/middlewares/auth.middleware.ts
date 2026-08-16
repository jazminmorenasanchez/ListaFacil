import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import { findSafeUserById, verifyToken } from '../services/auth.service'

export async function authenticate(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const authorization = request.header('Authorization')

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(401, 'Token de autenticación requerido')
    }

    const token = authorization.slice(7).trim()

    if (!token) {
      throw new AppError(401, 'Token de autenticación requerido')
    }

    const userId = verifyToken(token)
    const user = await findSafeUserById(userId)

    if (!user) {
      throw new AppError(401, 'Token inválido o expirado')
    }

    request.authenticatedUser = user
    next()
  } catch (error) {
    next(error)
  }
}
