export function Message({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="message error">{error}</p>
  if (success) return <p className="message success">{success}</p>
  return null
}
