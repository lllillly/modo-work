import { useEffect, useEffectEvent } from 'react'

export default function usePageInRange(page: number, totalPages: number | undefined, setPage: (page: number) => void) {
  const moveToLastPage = useEffectEvent((lastPage: number) => setPage(lastPage))

  useEffect(() => {
    if (totalPages === undefined) return
    const lastPage = Math.max(0, totalPages - 1)
    if (page > lastPage) moveToLastPage(lastPage)
  }, [page, totalPages])
}
