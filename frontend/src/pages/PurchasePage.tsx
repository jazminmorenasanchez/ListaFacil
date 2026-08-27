import { FormEvent, useEffect, useState } from 'react'
import { Message } from '../components/Message'
import { apiRequest } from '../services/api'
import type { HouseholdMember, Purchase, ShoppingListItem, User } from '../types'

function minimumDateTime(): string {
  const date = new Date(Date.now() + 60_000)
  date.setSeconds(0, 0)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function PurchasePage({ token, user }: { token: string; user: User }) {
  const [purchase, setPurchase] = useState<Purchase | null>(null), [members, setMembers] = useState<HouseholdMember[]>([]), [list, setList] = useState<ShoppingListItem[]>([])
  const [responsible, setResponsible] = useState(''), [date, setDate] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true), [postponing, setPostponing] = useState(false)
  async function load() { setLoading(true); setError(''); try { const [p, m, l] = await Promise.all([apiRequest<{ purchase: Purchase | null }>('/purchases/active', {}, token), apiRequest<{ members: HouseholdMember[] }>('/households/members', {}, token), apiRequest<{ items: ShoppingListItem[] }>('/shopping-list', {}, token)]); setPurchase(p.purchase); setMembers(m.members); setList(l.items); setResponsible((current) => current || m.members[0]?.id || '') } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado') } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  async function action(path: string, method = 'POST', body?: object): Promise<boolean> { setError(''); try { await apiRequest(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token); await load(); return true } catch (caught) { setError(caught instanceof Error ? caught.message : 'Error inesperado'); return false } }
  function futureDate(): string | null {
    const scheduledFor = new Date(date)
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= Date.now()) {
      setError('La fecha programada debe ser futura')
      return null
    }
    return scheduledFor.toISOString()
  }
  async function schedule(event: FormEvent) { event.preventDefault(); const scheduledFor = futureDate(); if (scheduledFor) await action('/purchases', 'POST', { responsibleUserId: responsible, scheduledFor }) }
  async function postpone() { const scheduledFor = futureDate(); if (scheduledFor && await action('/purchases/postpone', 'POST', { scheduledFor })) { setPostponing(false); setDate('') } }
  function cancelPostpone() { setPostponing(false); setDate(''); setError('') }
  if (loading) return <p>Cargando...</p>
  if (!purchase) return <section><h2>Compra</h2><Message error={error} />{list.length === 0 ? <p>Agregá productos a la lista antes de programar una compra.</p> : <form className="card" onSubmit={schedule}><label>Responsable<select value={responsible} onChange={(e) => setResponsible(e.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Fecha y hora<input type="datetime-local" value={date} min={minimumDateTime()} onChange={(e) => setDate(e.target.value)} required /></label><button>Programar compra</button></form>}</section>
  const isResponsible = purchase.responsibleUserId === user.id
  if (purchase.status === 'SCHEDULED') return <section><h2>Compra programada</h2><Message error={error} /><p>Responsable: {purchase.responsibleUser.name}</p><p>Fecha: {new Date(purchase.scheduledFor).toLocaleString()}</p><div className="card"><label>Cambiar responsable<select value={responsible} disabled={postponing} onChange={(e) => setResponsible(e.target.value)}>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><button disabled={postponing} onClick={() => void action('/purchases/responsible', 'PATCH', { responsibleUserId: responsible })}>Cambiar</button>{postponing ? <><label>Nueva fecha y hora<input type="datetime-local" value={date} min={minimumDateTime()} onChange={(e) => setDate(e.target.value)} /></label><button disabled={!date} onClick={() => void postpone()}>Guardar</button><button className="secondary" onClick={cancelPostpone}>Cancelar</button></> : <button onClick={() => { setError(''); setPostponing(true) }}>Posponer</button>}<button className="danger" disabled={postponing} onClick={() => void action('/purchases/release')}>Liberar compra</button>{isResponsible && <button disabled={postponing} onClick={() => void action('/purchases/start')}>Iniciar compra</button>}</div></section>
  return <section><h2>Compra en curso</h2><Message error={error} /><p>Responsable: {purchase.responsibleUser.name}</p><div className="list">{(purchase.items || []).map((item) => <div className="list-row" key={item.id}><div><strong>{item.name}</strong><small>Cantidad necesaria: {item.quantity}</small></div>{isResponsible ? <input type="number" min="0" max={item.quantity} defaultValue={item.purchasedQuantity} onBlur={(e) => void action(`/purchases/items/${item.id}`, 'PATCH', { purchasedQuantity: Number(e.target.value) })} /> : <span>Comprado: {item.purchasedQuantity}</span>}</div>)}</div>{isResponsible && <button onClick={() => void action('/purchases/finish')}>Finalizar compra</button>}</section>
}
