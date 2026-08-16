import { useEffect, useState } from 'react'
import { apiRequest } from './services/api'
import type { Household, User } from './types'
import { AuthPage } from './pages/AuthPage'
import { NoHouseholdPage } from './pages/NoHouseholdPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { CatalogPage } from './pages/CatalogPage'
import { PurchasePage } from './pages/PurchasePage'
import { HouseholdPage } from './pages/HouseholdPage'

type View = 'list' | 'catalog' | 'purchase' | 'household'
const TOKEN_KEY = 'listafacil_token'
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [user, setUser] = useState<User | null>(null), [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(Boolean(token)), [view, setView] = useState<View>('list')
  function logout() { localStorage.removeItem(TOKEN_KEY); setToken(''); setUser(null); setHousehold(null) }
  async function refresh(currentToken = token) { try { const me = await apiRequest<{ user: User }>('/auth/me', {}, currentToken); const current = await apiRequest<{ household: Household | null }>('/households/current', {}, currentToken); setUser(me.user); setHousehold(current.household) } catch { logout() } finally { setLoading(false) } }
  useEffect(() => { if (token) void refresh(token) }, [])
  function authenticated(nextToken: string, nextUser: User) { localStorage.setItem(TOKEN_KEY, nextToken); setToken(nextToken); setUser(nextUser); setLoading(true); void refresh(nextToken) }
  if (loading) return <main><p>Cargando...</p></main>
  if (!token || !user) return <AuthPage onAuthenticated={authenticated} />
  if (!household) return <NoHouseholdPage token={token} onChanged={() => refresh()} onLogout={logout} />
  return <main><header><div><h1>ListaFácil</h1><small>{household.name} · {user.name} ({user.role})</small></div><nav>{([['list', 'Lista'], ['catalog', 'Catálogo'], ['purchase', 'Compra'], ['household', 'Hogar']] as const).map(([id, label]) => <button className={view === id ? 'active' : 'secondary'} key={id} onClick={() => setView(id)}>{label}</button>)}<button className="secondary" onClick={logout}>Cerrar sesión</button></nav></header>{view === 'list' && <ShoppingListPage token={token} />}{view === 'catalog' && <CatalogPage token={token} role={user.role} />}{view === 'purchase' && <PurchasePage token={token} user={user} />}{view === 'household' && <HouseholdPage token={token} user={user} household={household} onLeft={() => refresh()} />}</main>
}
