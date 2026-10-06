export function futureDateIso(timestamp: number, now: number): string | null {
  if (Number.isNaN(timestamp) || timestamp <= now) {
    return null
  }

  return new Date(timestamp).toISOString()
}
