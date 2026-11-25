import { useEffect, useEffectEvent, useState } from 'react'

export default function useSearchDraft(search: string, onCommit: (value: string) => void, delay = 300) {
  const [draft, setDraft] = useState(search)
  const [shownSearch, setShownSearch] = useState(search)
  const commit = useEffectEvent(onCommit)

  if (search !== shownSearch) {
    setShownSearch(search)
    setDraft(search)
  }

  useEffect(() => {
    if (draft === search) return
    const timer = setTimeout(() => commit(draft), delay)
    return () => clearTimeout(timer)
  }, [draft, search, delay])

  return [draft, setDraft] as const
}
