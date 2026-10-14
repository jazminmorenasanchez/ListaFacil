import { AppError } from './app-error'

// Per-process protection, not a distributed rate limiter. No passwords stored.
export function createAccountDeletionLimiter(now = Date.now) {
  const entries = new Map<string, { attempts: number; expiresAt: number }>()
  return {
    consume(userId: string): void {
      const time = now()
      for (const [id, entry] of entries) {
        if (entry.expiresAt <= time) entries.delete(id)
      }
      let entry = entries.get(userId)
      if (!entry) {
        if (entries.size >= 10_000) throw new AppError(429, 'Demasiados intentos; intentá más tarde')
        entry = { attempts: 0, expiresAt: time + 15 * 60_000 }
        entries.set(userId, entry)
      }
      if (entry.attempts >= 5) throw new AppError(429, 'Demasiados intentos; intentá nuevamente en 15 minutos')
      entry.attempts += 1
    },
    clear(userId: string): void { entries.delete(userId) },
  }
}
