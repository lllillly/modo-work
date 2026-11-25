import { useSearchParams } from 'react-router'

export default function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  function getFilter(key: string, fallback = '') {
    return params.get(key) ?? fallback
  }

  function getPage() {
    return Math.max(0, (Number.parseInt(params.get('page') ?? '', 10) || 1) - 1)
  }

  function setFilters(values: Record<string, string | null>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(values)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )
  }

  return { getFilter, getPage, setFilters }
}
