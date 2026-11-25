import { useCallback, useEffect, useState } from 'react'

import { searchDocumentPassages } from '../../api/documents'
import type { DocumentPassage } from '../../types/documents'

export const MIN_SEARCH_LENGTH = 2
const PASSAGE_LIMIT = 10
const DOCUMENT_PASSAGE_LIMIT = 50
const MIN_PASSAGE_SCORE = 0.5
const DEBOUNCE_MS = 400

type SearchResult = {
  key: string
  passages: DocumentPassage[]
  nextOffset: number
  hasMore: boolean
  notIndexedCount: number
  isLoadingMore: boolean
  error: unknown
}

export default function useDocumentSearch(businessId: string, keyword: string, documentId?: string) {
  const limit = documentId ? DOCUMENT_PASSAGE_LIMIT : PASSAGE_LIMIT
  const query = keyword.trim()
  const active = query.length >= MIN_SEARCH_LENGTH
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<SearchResult | null>(null)
  const key = `${businessId}|${documentId ?? ''}|${query}|${attempt}`

  useEffect(() => {
    if (!active) return
    let stale = false
    const timer = window.setTimeout(() => {
      searchDocumentPassages(businessId, query, 0, limit).then(
        (data) => {
          if (stale) return
          const passages = data.results.filter(
            (passage) => passage.score >= MIN_PASSAGE_SCORE && (!documentId || passage.documentId === documentId),
          )
          setResult({
            key,
            passages,
            nextOffset: limit,
            hasMore: !documentId && data.hasMore && passages.length === data.results.length,
            notIndexedCount: data.notIndexedDocumentIds.length,
            isLoadingMore: false,
            error: undefined,
          })
        },
        (error: unknown) => {
          if (stale) return
          setResult({ key, passages: [], nextOffset: 0, hasMore: false, notIndexedCount: 0, isLoadingMore: false, error })
        },
      )
    }, DEBOUNCE_MS)
    return () => {
      stale = true
      window.clearTimeout(timer)
    }
  }, [active, businessId, documentId, limit, query, key])

  const current = active && result?.key === key ? result : null
  const shown = current ?? (active ? result : null)

  const loadMore = useCallback(() => {
    if (!current) return
    const { nextOffset } = current
    setResult({ ...current, isLoadingMore: true, error: undefined })
    searchDocumentPassages(businessId, query, nextOffset, limit).then(
      (data) => {
        const passages = data.results.filter((passage) => passage.score >= MIN_PASSAGE_SCORE)
        setResult((latest) =>
          latest?.key === key
            ? {
                ...latest,
                passages: [...latest.passages, ...passages],
                nextOffset: latest.nextOffset + limit,
                hasMore: data.hasMore && passages.length === data.results.length,
                isLoadingMore: false,
              }
            : latest,
        )
      },
      (error: unknown) => {
        setResult((latest) => (latest?.key === key ? { ...latest, isLoadingMore: false, error } : latest))
      },
    )
  }, [businessId, current, key, limit, query])

  return {
    active,
    query,
    isLoading: active && current === null,
    passages: shown?.passages ?? [],
    hasMore: current?.hasMore ?? false,
    notIndexedCount: shown?.notIndexedCount ?? 0,
    isLoadingMore: current?.isLoadingMore ?? false,
    error: current?.error,
    retry: () => setAttempt((value) => value + 1),
    loadMore,
  }
}
