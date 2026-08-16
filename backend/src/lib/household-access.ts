import { UserRole } from '../generated/prisma/client'
import { AppError } from './app-error'
import { prisma } from './prisma'

export async function requireHousehold(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, householdId: true, role: true },
  })

  if (!user) {
    throw new AppError(401, 'Usuario no autenticado')
  }

  if (!user.householdId) {
    throw new AppError(403, 'El usuario debe pertenecer a un hogar')
  }

  return { userId: user.id, householdId: user.householdId, role: user.role }
}

export async function requireHouseholdAdmin(userId: string) {
  const context = await requireHousehold(userId)

  if (context.role !== UserRole.ADMIN) {
    throw new AppError(403, 'Solo un administrador puede realizar esta acción')
  }

  return context
}
