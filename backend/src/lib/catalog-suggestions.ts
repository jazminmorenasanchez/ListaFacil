import { AppError } from './app-error'
import { comparableProductName } from './product-name'

export interface CatalogCandidate {
  readonly id: string
  readonly name: string
}

export function suggestCatalogItems(items: readonly CatalogCandidate[], query: string, limit = 5): CatalogCandidate[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    throw new AppError(400, 'El límite debe ser un entero entre 1 y 20')
  }
  const search = comparableProductName(query)
  if (!search) return []
  const words = search.split(' ')
  const matches: { item: CatalogCandidate; name: string; rank: number }[] = []
  for (const item of items) {
    const name = comparableProductName(item.name)
    let rank: number
    if (name === search) rank = 0
    else if (name.startsWith(search)) rank = 1
    else if (words.every((word) => name.split(' ').includes(word))) rank = 2
    else if (name.includes(search)) rank = 3
    else continue
    matches.push({ item, name, rank })
  }
  matches.sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank
    if (left.name !== right.name) return left.name < right.name ? -1 : 1
    if (left.item.id === right.item.id) return 0
    return left.item.id < right.item.id ? -1 : 1
  })
  return matches.slice(0, limit).map(({ item }) => item)
}
