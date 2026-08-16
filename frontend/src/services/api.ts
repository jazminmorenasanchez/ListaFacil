const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export class ApiError extends Error { constructor(message: string, public readonly status: number) { super(message) } }
export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = 'No se pudo completar la operación'
    try { const error = await response.json() as { message?: string }; if (error.message) message = error.message } catch { /* Respuesta sin JSON. */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
