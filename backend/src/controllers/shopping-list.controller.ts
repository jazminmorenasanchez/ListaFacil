import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import * as shoppingListService from '../services/shopping-list.service'

function userId(request: Request): string {
  if (!request.authenticatedUser) throw new AppError(401, 'Usuario no autenticado')
  return request.authenticatedUser.id
}

function itemId(request: Request): string {
  const value = request.params.itemId
  if (typeof value !== 'string' || !value) throw new AppError(400, 'El item es obligatorio')
  return value
}

export async function list(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({ items: await shoppingListService.getShoppingList(userId(request)) })
  } catch (error) {
    next(error)
  }
}

export async function add(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof request.body?.catalogItemId !== 'string') throw new AppError(400, 'El producto es obligatorio')
    const item = await shoppingListService.addShoppingListItem(
      userId(request),
      request.body.catalogItemId,
      request.body.quantity,
    )
    response.status(201).json({ item })
  } catch (error) {
    next(error)
  }
}

export async function update(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    response.json({
      item: await shoppingListService.updateShoppingListItem(userId(request), itemId(request), request.body),
    })
  } catch (error) {
    next(error)
  }
}

export async function remove(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await shoppingListService.deleteShoppingListItem(userId(request), itemId(request))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
