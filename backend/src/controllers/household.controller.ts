import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../lib/app-error'
import * as householdService from '../services/household.service'

function authenticatedUserId(request: Request): string {
  if (!request.authenticatedUser) {
    throw new AppError(401, 'Usuario no autenticado')
  }

  return request.authenticatedUser.id
}

export async function create(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof request.body?.name !== 'string') {
      throw new AppError(400, 'El nombre del hogar es obligatorio')
    }

    const household = await householdService.createHousehold(authenticatedUserId(request), request.body.name)
    response.status(201).json({ household })
  } catch (error) {
    next(error)
  }
}

export async function join(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    if (typeof request.body?.joinCode !== 'string') {
      throw new AppError(400, 'El código del hogar es obligatorio')
    }

    const household = await householdService.joinHousehold(authenticatedUserId(request), request.body.joinCode)
    response.json({ household })
  } catch (error) {
    next(error)
  }
}

export async function current(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const result = await householdService.getCurrentHousehold(authenticatedUserId(request))
    response.json(result)
  } catch (error) {
    next(error)
  }
}

export async function members(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const result = await householdService.getHouseholdMembers(authenticatedUserId(request))
    response.json({ members: result })
  } catch (error) {
    next(error)
  }
}

export async function leave(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    await householdService.leaveHousehold(authenticatedUserId(request))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function removeMember(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const targetUserId = request.params.userId

    if (typeof targetUserId !== 'string' || !targetUserId) {
      throw new AppError(400, 'El usuario es obligatorio')
    }

    await householdService.removeMember(authenticatedUserId(request), targetUserId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function regenerateCode(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const joinCode = await householdService.regenerateJoinCode(authenticatedUserId(request))
    response.json({ joinCode })
  } catch (error) {
    next(error)
  }
}
