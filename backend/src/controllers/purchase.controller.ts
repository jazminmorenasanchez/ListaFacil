import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import * as purchaseService from '../services/purchase.service'

function userId(request: Request): string {
  if (!request.authenticatedUser) throw new AppError(401, 'Usuario no autenticado')
  return request.authenticatedUser.id
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new AppError(400, message)
  return value.trim()
}

export async function schedule(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const responsibleUserId = requiredString(request.body?.responsibleUserId, 'El responsable es obligatorio')
    const scheduledFor = requiredString(request.body?.scheduledFor, 'La fecha programada es obligatoria')
    response.status(201).json({ purchase: await purchaseService.schedulePurchase(userId(request), responsibleUserId, scheduledFor) })
  } catch (error) {
    next(error)
  }
}

export async function active(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ purchase: await purchaseService.getActivePurchase(userId(request)) })
  } catch (error) {
    next(error)
  }
}

export async function changeResponsible(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const responsibleUserId = requiredString(request.body?.responsibleUserId, 'El responsable es obligatorio')
    response.json({ purchase: await purchaseService.changeResponsible(userId(request), responsibleUserId) })
  } catch (error) {
    next(error)
  }
}

export async function postpone(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const scheduledFor = requiredString(request.body?.scheduledFor, 'La fecha programada es obligatoria')
    response.json({ purchase: await purchaseService.postponePurchase(userId(request), scheduledFor) })
  } catch (error) {
    next(error)
  }
}

export async function release(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await purchaseService.releasePurchase(userId(request))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function start(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ purchase: await purchaseService.startPurchase(userId(request)) })
  } catch (error) {
    next(error)
  }
}

export async function updateItem(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = requiredString(request.params.itemId, 'El item es obligatorio')
    response.json({
      item: await purchaseService.updatePurchasedQuantity(userId(request), itemId, request.body?.purchasedQuantity),
    })
  } catch (error) {
    next(error)
  }
}

export async function finish(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ result: await purchaseService.finishPurchase(userId(request)) })
  } catch (error) {
    next(error)
  }
}
