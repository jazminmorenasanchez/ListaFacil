import { randomInt } from 'node:crypto'
import { Prisma, PurchaseStatus, UserRole } from '../generated/prisma/client'
import { AppError } from '../lib/app-error'
import { prisma } from '../lib/prisma'

const JOIN_CODE_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const JOIN_CODE_LENGTH = 6
const JOIN_CODE_ATTEMPTS = 8

const householdSelect = {
  id: true,
  name: true,
  joinCode: true,
  createdAt: true,
} satisfies Prisma.HouseholdSelect

const memberSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

function generateJoinCode(): string {
  return Array.from(
    { length: JOIN_CODE_LENGTH },
    () => JOIN_CODE_CHARACTERS[randomInt(JOIN_CODE_CHARACTERS.length)],
  ).join('')
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

function normalizeHouseholdName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

async function getUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw new AppError(401, 'Usuario no autenticado')
  }

  return user
}

function activePurchaseMessage(status: PurchaseStatus): string {
  return status === PurchaseStatus.SCHEDULED
    ? 'El responsable debe liberar la compra programada antes de salir del hogar'
    : 'El responsable debe finalizar la compra en curso antes de salir del hogar'
}

export async function createHousehold(userId: string, requestedName: string) {
  const name = normalizeHouseholdName(requestedName)

  if (!name || name.length > 100) {
    throw new AppError(400, 'El nombre del hogar es obligatorio y debe tener hasta 100 caracteres')
  }

  for (let attempt = 0; attempt < JOIN_CODE_ATTEMPTS; attempt += 1) {
    const joinCode = generateJoinCode()

    try {
      return await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.findUnique({ where: { id: userId } })

        if (!user) {
          throw new AppError(401, 'Usuario no autenticado')
        }

        if (user.householdId) {
          throw new AppError(409, 'El usuario ya pertenece a un hogar')
        }

        const household = await transaction.household.create({
          data: { name, joinCode },
          select: householdSelect,
        })

        const assignment = await transaction.user.updateMany({
          where: { id: userId, householdId: null },
          data: { householdId: household.id, role: UserRole.ADMIN },
        })

        if (assignment.count !== 1) {
          throw new AppError(409, 'El usuario ya pertenece a un hogar')
        }

        return { ...household, role: UserRole.ADMIN, memberCount: 1 }
      })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue
      }

      throw error
    }
  }

  throw new AppError(500, 'No se pudo generar un código único para el hogar')
}

export async function joinHousehold(userId: string, requestedCode: string) {
  const joinCode = requestedCode.trim().toUpperCase()

  if (!joinCode) {
    throw new AppError(400, 'El código del hogar es obligatorio')
  }

  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new AppError(401, 'Usuario no autenticado')
    }

    if (user.householdId) {
      throw new AppError(409, 'El usuario ya pertenece a un hogar')
    }

    const household = await transaction.household.findUnique({
      where: { joinCode },
      select: householdSelect,
    })

    if (!household) {
      throw new AppError(404, 'Código de hogar no encontrado')
    }

    const assignment = await transaction.user.updateMany({
      where: { id: userId, householdId: null },
      data: { householdId: household.id, role: UserRole.MEMBER },
    })

    if (assignment.count !== 1) {
      throw new AppError(409, 'El usuario ya pertenece a un hogar')
    }

    return { ...household, role: UserRole.MEMBER }
  })
}

export async function getCurrentHousehold(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      household: {
        select: {
          ...householdSelect,
          _count: { select: { users: true } },
        },
      },
    },
  })

  if (!user) {
    throw new AppError(401, 'Usuario no autenticado')
  }

  if (!user.household) {
    return { household: null }
  }

  const { _count, ...household } = user.household
  return { household: { ...household, role: user.role, memberCount: _count.users } }
}

export async function getHouseholdMembers(userId: string) {
  const user = await getUserOrThrow(userId)

  if (!user.householdId) {
    throw new AppError(404, 'El usuario no pertenece a un hogar')
  }

  return prisma.user.findMany({
    where: { householdId: user.householdId },
    select: memberSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
}

export async function leaveHousehold(userId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new AppError(401, 'Usuario no autenticado')
    }

    if (!user.householdId) {
      throw new AppError(409, 'El usuario no pertenece a un hogar')
    }

    const purchase = await transaction.purchase.findUnique({ where: { householdId: user.householdId } })

    if (purchase?.responsibleUserId === user.id) {
      throw new AppError(409, activePurchaseMessage(purchase.status))
    }

    if (user.role === UserRole.ADMIN) {
      const nextAdmin = await transaction.user.findFirst({
        where: { householdId: user.householdId, id: { not: user.id } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      })

      if (nextAdmin) {
        await transaction.user.update({ where: { id: nextAdmin.id }, data: { role: UserRole.ADMIN } })
        await transaction.user.update({
          where: { id: user.id },
          data: { householdId: null, role: UserRole.MEMBER },
        })
        return
      }

      await transaction.user.update({
        where: { id: user.id },
        data: { householdId: null, role: UserRole.MEMBER },
      })

      try {
        await transaction.household.delete({ where: { id: user.householdId } })
      } catch (error) {
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
          throw new AppError(409, 'El hogar tiene datos asociados y no puede eliminarse todavía')
        }
        throw error
      }
      return
    }

    await transaction.user.update({
      where: { id: user.id },
      data: { householdId: null, role: UserRole.MEMBER },
    })
  })
}

export async function removeMember(adminUserId: string, targetUserId: string): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    const admin = await transaction.user.findUnique({ where: { id: adminUserId } })

    if (!admin || !admin.householdId) {
      throw new AppError(403, 'Se requiere ser administrador de un hogar')
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Solo un administrador puede expulsar integrantes')
    }

    if (admin.id === targetUserId) {
      throw new AppError(400, 'El administrador debe usar la opción de abandonar el hogar')
    }

    const target = await transaction.user.findUnique({ where: { id: targetUserId } })

    if (!target || target.householdId !== admin.householdId) {
      throw new AppError(404, 'Integrante no encontrado en el hogar')
    }

    const purchase = await transaction.purchase.findUnique({ where: { householdId: admin.householdId } })

    if (purchase?.responsibleUserId === target.id) {
      throw new AppError(409, activePurchaseMessage(purchase.status))
    }

    await transaction.user.update({
      where: { id: target.id },
      data: { householdId: null, role: UserRole.MEMBER },
    })
  })
}

export async function regenerateJoinCode(userId: string): Promise<string> {
  const user = await getUserOrThrow(userId)

  if (!user.householdId || user.role !== UserRole.ADMIN) {
    throw new AppError(403, 'Solo un administrador puede regenerar el código')
  }

  for (let attempt = 0; attempt < JOIN_CODE_ATTEMPTS; attempt += 1) {
    const joinCode = generateJoinCode()

    if (joinCode === (await prisma.household.findUnique({ where: { id: user.householdId }, select: { joinCode: true } }))?.joinCode) {
      continue
    }

    try {
      await prisma.household.update({ where: { id: user.householdId }, data: { joinCode } })
      return joinCode
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue
      }
      throw error
    }
  }

  throw new AppError(500, 'No se pudo generar un código único para el hogar')
}
