import { useEffect, useState } from 'react'

import { isAuthStateError } from '../api/client'
import { useAuth } from '../providers/AuthContext'

export default function useApiQuery<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const { refreshUser } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    key: string | null
    attempt: number
    data?: T
    error?: unknown
  }>({ key: null, attempt: 0 })

  useEffect(() => {
    if (key === null) return

    const controller = new AbortController()
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ key, attempt, data })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setResult({ key, attempt, error })
        if (isAuthStateError(error)) {
          void refreshUser()
        }
      },
    )

    return () => controller.abort()
  }, [key, attempt, load, refreshUser])

  const current = key !== null && result.key === key && result.attempt === attempt

  return {
    data: current ? result.data : undefined,
    error: current ? result.error : undefined,
    isLoading: key !== null && (!current || (!result.data && !result.error)),
    reload: () => setAttempt((value) => value + 1),
  }
}
