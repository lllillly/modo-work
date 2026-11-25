import type { PageResponse } from '../types/courseApi'

export const PAGE_SIZE = 20

export async function withRestPages<T>(first: PageResponse<T>, load: (page: number) => Promise<PageResponse<T>>) {
  const items = [...first.items]

  for (let page = 1; page < first.totalPages; page++) {
    const next = await load(page)
    items.push(...next.items)
  }

  return { ...first, items }
}

export async function getAllPages<T>(load: (page: number) => Promise<PageResponse<T>>) {
  const pages = await withRestPages(await load(0), load)
  return pages.items
}
