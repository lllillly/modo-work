import type { PageResponse } from '../types/courseApi'

export async function getAllPages<T>(load: (page: number) => Promise<PageResponse<T>>) {
  const first = await load(0)
  const items = [...first.items]

  for (let page = 1; page < first.totalPages; page++) {
    const next = await load(page)
    items.push(...next.items)
  }

  return items
}
