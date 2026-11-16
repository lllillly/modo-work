import { useCallback } from 'react'

import { getDocuments } from '../../api/documents'
import useApiQuery from '../../hooks/useApiQuery'

export default function useDocuments(businessId: string) {
  const load = useCallback((signal: AbortSignal) => getDocuments(businessId, signal), [businessId])
  return useApiQuery(`documents:${businessId}`, load)
}
