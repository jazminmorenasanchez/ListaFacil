export type UserRole = 'ADMIN' | 'MEMBER'
export interface User { id: string; name: string; email: string; role: UserRole; householdId: string | null; createdAt: string }
export interface Household { id: string; name: string; joinCode: string; createdAt: string; role: UserRole; memberCount: number }
export interface HouseholdMember { id: string; name: string; email: string; role: UserRole; createdAt: string }
export interface ShoppingListItem { id: string; catalogItemId: string; name: string; quantity: number; purchasedQuantity: number; urgent: boolean; addedAt: string }
export interface CatalogItem { id: string; name: string; householdId: string; createdAt: string; inShoppingList: boolean; shoppingListItem: { id: string; quantity: number; purchasedQuantity: number; urgent: boolean } | null }
export interface Purchase { id: string; householdId: string; responsibleUserId: string; scheduledFor: string; status: 'SCHEDULED' | 'IN_PROGRESS'; createdAt: string; startedAt: string | null; responsibleUser: Pick<User, 'id' | 'name' | 'email'>; items?: ShoppingListItem[] }
