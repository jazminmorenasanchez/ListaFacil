import type { ShoppingListItem } from '../types'

export type ExportScope = 'pending' | 'all'
type CsvItem = Pick<ShoppingListItem, 'name' | 'quantity' | 'purchasedQuantity' | 'urgent'>

export interface ExportRow extends CsvItem {
  pendingQuantity: number
}

export function prepareShoppingListRows(items: readonly CsvItem[], scope: ExportScope): ExportRow[] {
  return items
    .map((item) => ({ ...item, pendingQuantity: item.quantity - item.purchasedQuantity }))
    .filter((item) => scope === 'all' || item.pendingQuantity > 0)
}

function escapeField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function shoppingListCsv(items: readonly ExportRow[]): string {
  const rows = ['Producto,Cantidad necesaria,Cantidad comprada,Cantidad pendiente,Urgente']
  for (const item of items) {
    rows.push([
      escapeField(item.name),
      item.quantity,
      item.purchasedQuantity,
      item.pendingQuantity,
      item.urgent ? 'Sí' : 'No',
    ].join(','))
  }
  return rows.join('\r\n') + '\r\n'
}
