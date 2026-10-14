import bcrypt from 'bcrypt'
import { AppError } from '../lib/app-error'
import { createAccountDeletionLimiter } from '../lib/account-deletion-attempts'
import { detachFromHousehold, householdTransaction } from '../lib/household-departure'
import { prisma } from '../lib/prisma'

const attempts = createAccountDeletionLimiter()

export async function deleteOwnAccount(userId: string, currentPassword: unknown): Promise<void> {
  if (typeof currentPassword !== 'string' || !currentPassword || Buffer.byteLength(currentPassword, 'utf8') > 72) {
    throw new AppError(400, 'La contraseña actual es obligatoria y debe tener hasta 72 bytes')
  }
  attempts.consume(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(401, 'Usuario no autenticado')
  // Keep the expensive password check outside the database transaction.
  if (!await bcrypt.compare(currentPassword, user.passwordHash)) {
    throw new AppError(403, 'La contraseña actual es incorrecta')
  }
  attempts.clear(userId)
  await householdTransaction(async (transaction) => {
    const current = await transaction.user.findUnique({ where: { id: userId } })
    if (!current) throw new AppError(401, 'Usuario no autenticado')
    if (current.passwordHash !== user.passwordHash) {
      throw new AppError(409, 'La cuenta cambió durante la verificación; intentá nuevamente')
    }
    await detachFromHousehold(transaction, current)
    await transaction.user.delete({ where: { id: userId } })
  })
}
