import { useEffect, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'
import type { Household, HouseholdMember, User } from '../types'

export function HouseholdPage({ token, user, household, onLeft }: { token: string; user: User; household: Household; onLeft: () => Promise<void> }) {
  const [members, setMembers] = useState<HouseholdMember[]>([]), [code, setCode] = useState(household.joinCode), [error, setError] = useState('')
  async function load() { try { const result = await apiRequest<{ members: HouseholdMember[] }>('/households/members', {}, token); setMembers(result.members) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  useEffect(() => { void load() }, [])
  async function leave() { if (!window.confirm('¿Abandonar el hogar?')) return; try { await apiRequest('/households/leave', { method: 'POST' }, token); await onLeft() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function regenerate() { try { const result = await apiRequest<{ joinCode: string }>('/households/regenerate-code', { method: 'POST' }, token); setCode(result.joinCode) } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  async function remove(id: string) { if (!window.confirm('¿Expulsar integrante?')) return; try { await apiRequest(`/households/members/${id}`, { method: 'DELETE' }, token); await load() } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } }
  return <section><h2>Hogar</h2><Message error={error} /><div className="card"><p><strong>{household.name}</strong></p><p>Código para unirse: <code>{code}</code></p>{user.role === 'ADMIN' && <button onClick={() => void regenerate()}>Regenerar código</button>}</div><h3>Integrantes</h3><div className="list">{members.map((member) => <div className="list-row" key={member.id}><div><strong>{member.name}</strong><small>{member.email} · {member.role}</small></div>{user.role === 'ADMIN' && member.id !== user.id && member.role === 'MEMBER' && <button className="danger" onClick={() => void remove(member.id)}>Expulsar</button>}</div>)}</div><button className="danger" onClick={() => void leave()}>Abandonar hogar</button></section>
}
