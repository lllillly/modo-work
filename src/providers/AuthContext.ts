import { createContext, useContext } from 'react'

import type { AuthUser, TestLoginRequest } from '../types/auth'

export type AuthNotice = 'expired' | 'inactive' | null

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  notice: AuthNotice
  login: (data: TestLoginRequest) => Promise<AuthUser>
  logout: () => Promise<void>
  refreshUser: (signal?: AbortSignal) => Promise<AuthUser | null>
  clearNotice: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) throw new Error('AuthProvider 안에서 사용해 주세요.')

  return context
}
