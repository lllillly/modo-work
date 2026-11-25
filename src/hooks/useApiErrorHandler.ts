import { useCallback } from 'react'
import { App } from 'antd'

import { getApiErrorMessage, isAuthStateError } from '../api/client'
import { useAuth } from '../providers/AuthContext'

export default function useApiErrorHandler() {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()

  const checkLogin = useCallback(
    (error: unknown) => {
      if (isAuthStateError(error)) void refreshUser()
    },
    [refreshUser],
  )

  const showError = useCallback(
    (error: unknown, text?: string) => {
      message.error(text ?? getApiErrorMessage(error))
      checkLogin(error)
    },
    [message, checkLogin],
  )

  return { showError, checkLogin }
}
