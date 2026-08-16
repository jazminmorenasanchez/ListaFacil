import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import * as catalogService from '../services/catalog.service'

function userId(request: Request): string {
  if (!request.authenticatedUser) throw new AppError(401, 'Usuario no autenticado')
  return request.authenticatedUser.id
}

function itemId(request: Request): string {
  const value = request.params.itemId
  if (typeof value !== 'string' || !value) throw new AppError(400, 'El producto es obligatorio')
  return value
}

export async function list(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const search = typeof request.query.search === 'string' ? request.query.search : undefined
    response.json({ items: await catalogService.listCatalog(userId(request), search) })
  } catch (error) {
    next(error)
  }
}

export async function create(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof request.body?.name !== 'string') throw new AppError(400, 'El nombre es obligatorio')
    response.status(201).json({ item: await catalogService.createCatalogItem(userId(request), request.body.name) })
  } catch (error) {
    next(error)
  }
}

export async function update(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof request.body?.name !== 'string') throw new AppError(400, 'El nombre es obligatorio')
    response.json({ item: await catalogService.updateCatalogItem(userId(request), itemId(request), request.body.name) })
  } catch (error) {
    next(error)
  }
}

export async function remove(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await catalogService.deleteCatalogItem(userId(request), itemId(request))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
