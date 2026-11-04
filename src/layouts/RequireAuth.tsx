import { useEffect, useRef, useState } from 'react'
import { Button, Result, Spin } from 'antd'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuth } from '../providers/AuthContext'

export default function RequireAuth() {
  const { user, isLoading, error, refreshUser } = useAuth()
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname
      void refreshUser()
    }
  }, [pathname, refreshUser])

  async function retry() {
    setIsRetrying(true)
    await refreshUser()
    setIsRetrying(false)
  }

  if (isLoading) return <Spin fullscreen aria-label="로그인 상태 확인 중" />

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center px-md">
        <Result
          status="warning"
          title="로그인 상태를 확인하지 못했어요"
          subTitle={error}
          extra={<Button type="primary" loading={isRetrying} onClick={retry}>다시 시도</Button>}
        />
      </main>
    )
  }

  if (!user || user.status !== 'ACTIVE') return <Navigate to="/login" replace />

  return <Outlet />
}
