import { useCallback, useEffect, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { AuthApiError, getCurrentUser, logout as requestLogout, testLogin } from '../api/auth'
import type { AuthUser, TestLoginRequest } from '../types/auth'
import { AuthContext } from './AuthContext'
import type { AuthNotice } from './AuthContext'

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  notice: AuthNotice
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
    notice: null,
  })
  const requestId = useRef(0)
  const isLoggingOut = useRef(false)

  const refreshUser = useCallback(async (signal?: AbortSignal) => {
    if (isLoggingOut.current) return null

    const currentRequest = ++requestId.current

    try {
      const user = await getCurrentUser(signal)
      if (signal?.aborted || currentRequest !== requestId.current) return null

      setAuth({ user, isLoading: false, error: null, notice: null })
      return user
    } catch (error) {
      if (signal?.aborted || currentRequest !== requestId.current) return null

      if (error instanceof AuthApiError && error.code === 'UNAUTHENTICATED') {
        setAuth((previous) => ({
          user: null,
          isLoading: false,
          error: null,
          notice: previous.user ? 'expired' : previous.notice,
        }))
      } else if (error instanceof AuthApiError && error.code === 'ACCOUNT_INACTIVE') {
        setAuth({ user: null, isLoading: false, error: null, notice: 'inactive' })
      } else {
        setAuth((previous) => ({
          ...previous,
          isLoading: false,
          error: error instanceof AuthApiError
            ? error.message
            : '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.',
        }))
      }

      return null
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void refreshUser(controller.signal)

    return () => controller.abort()
  }, [refreshUser])

  useEffect(() => {
    if (auth.user?.status !== 'ACTIVE') return

    function checkSession() {
      if (document.visibilityState === 'visible') void refreshUser()
    }

    window.addEventListener('focus', checkSession)
    return () => window.removeEventListener('focus', checkSession)
  }, [auth.user?.status, refreshUser])

  async function login(data: TestLoginRequest) {
    const currentRequest = ++requestId.current

    try {
      const user = await testLogin(data)
      if (currentRequest === requestId.current) {
        setAuth({ user, isLoading: false, error: null, notice: null })
      }
      return user
    } catch (error) {
      if (currentRequest === requestId.current && error instanceof AuthApiError && error.code === 'ACCOUNT_INACTIVE') {
        setAuth({ user: null, isLoading: false, error: null, notice: 'inactive' })
      }
      throw error
    }
  }

  async function logout() {
    if (isLoggingOut.current) return

    isLoggingOut.current = true
    const currentRequest = ++requestId.current

    try {
      await requestLogout()

      if (currentRequest === requestId.current) {
        setAuth({ user: null, isLoading: false, error: null, notice: null })
      }
    } finally {
      isLoggingOut.current = false
    }
  }

  function clearNotice() {
    setAuth((previous) => ({ ...previous, notice: null }))
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, refreshUser, clearNotice }}>
      {children}
    </AuthContext.Provider>
  )
}
