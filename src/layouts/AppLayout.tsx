import { Suspense, useCallback, useState } from 'react'
import { Alert, App, Grid, Layout, Spin } from 'antd'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'

import { resetAskSession } from '../pages/ask/askSession'

import { getBusinesses } from '../api/courses'
import useApiQuery from '../hooks/useApiQuery'

import { useAuth } from '../providers/AuthContext'
import type { OptionItem } from '../types/courseApi'
import { userRoleLabels } from '../types/user'

import LoadingError from '../components/common/LoadingError'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'
import { HeaderTitleSlot } from '../components/layout/headerTitleSlot'

type AppLayoutProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export type AppLayoutContext = {
  isMobile: boolean
  selectedBusiness: string
  selectedBusinessId?: string
  userName: string
  reloadBusinesses: () => void
}

function saveBusinessSelection(key: string, business: string) {
  try {
    localStorage.setItem(key, business)
  } catch {
    return
  }
}

export default function AppLayout({ isDark, onThemeChange }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg
  const [searchParams, setSearchParams] = useSearchParams()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null)
  const businessStorageKey = `portal-business:${user?.id ?? ''}`
  const [businessSelection, setBusinessSelection] = useState(() => {
    try {
      return localStorage.getItem(businessStorageKey) ?? ''
    } catch {
      return ''
    }
  })
  const loadBusinesses = useCallback((signal: AbortSignal) => getBusinesses(signal), [])
  const businesses = useApiQuery(user ? `businesses:${user.id}` : null, loadBusinesses)
  const [shownBusinesses, setShownBusinesses] = useState<OptionItem[]>()
  if (businesses.data && businesses.data.items !== shownBusinesses) setShownBusinesses(businesses.data.items)
  const businessOptions = (shownBusinesses ?? []).map((item) => ({ value: item.id, label: item.name }))
  const selectedOption =
    businessOptions.find((item) => item.value === businessSelection) ?? businessOptions[0]
  const selectedBusiness = selectedOption?.label ?? ''
  const selectedBusinessId = selectedOption?.value
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function handleBusinessChange(business: string) {
    const next = new URLSearchParams(searchParams)
    next.delete('courseId')
    next.delete('taskId')
    next.delete('preview')
    next.delete('jobId')
    for (const key of ['q', 'type', 'orgUnitId', 'status', 'review', 'page']) next.delete(key)

    setSearchParams(next, { replace: true })
    setBusinessSelection(business)
    saveBusinessSelection(businessStorageKey, business)
    resetAskSession()
    if (pathname.startsWith('/admin/courses/') && pathname !== '/admin/courses/import') {
      navigate({ pathname: '/admin/courses', search: next.toString() }, { replace: true })
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
    } catch {
      message.error('로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user) return null
  if (!shownBusinesses && businesses.isLoading) return <Spin fullscreen aria-label="사업 목록 불러오는 중" />
  if (!shownBusinesses && businesses.error) {
    return (
      <main className="flex min-h-svh items-center justify-center px-md">
        <div className="w-full max-w-[400px]">
          <LoadingError title="사업 목록을 불러오지 못했어요" error={businesses.error} onRetry={businesses.reload} />
        </div>
      </main>
    )
  }

  const roles = user.roles.map((item) => item.role)
  const primaryRole = (['ADMIN', 'LEADER', 'ASSIGNEE', 'VIEWER'] as const).find((role) =>
    roles.includes(role),
  )
  const roleLabel = [...new Set(roles)].map((role) => userRoleLabels[role]).join(', ') || '역할 미지정'
  const isOrgLeader = !!user.orgUnit && user.roles.some((item) => item.role === 'LEADER' && item.leaderType === 'ORG_UNIT')

  return (
    <Layout hasSider={!isMobile} className="h-svh overflow-hidden">
      <AppSidebar
        isMobile={isMobile}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        role={primaryRole}
        isOrgLeader={isOrgLeader}
        businessOptions={businessOptions}
        selectedBusiness={selectedOption?.value ?? ''}
        onBusinessChange={handleBusinessChange}
      />
      <Layout className="min-h-0 min-w-0">
        <AppHeader
          isDark={isDark}
          onThemeChange={onThemeChange}
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          onMenuOpen={() => setIsMenuOpen(true)}
          userName={user.name}
          userRole={roleLabel}
          businessId={selectedBusinessId}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
          titleSlotRef={setTitleSlot}
        />
        <Layout className="min-h-0 min-w-0">
          <Layout.Content
            className={`flex min-h-0 min-w-0 flex-col overflow-y-auto ${isMobile ? 'p-md' : 'p-lg'}`}
          >
            <main className="flex flex-1 flex-col">
              {primaryRole === 'VIEWER' && (
                <Alert
                  type="info"
                  showIcon
                  className="mb-md"
                  title="열람 전용 계정이에요. 화면은 볼 수 있지만 완료나 확인 같은 처리는 할 수 없어요."
                />
              )}
              <HeaderTitleSlot.Provider value={titleSlot}>
              <Suspense fallback={<Spin className="m-auto" aria-label="화면 불러오는 중" />}>
                <Outlet
                  context={
                    {
                      isMobile,
                      selectedBusiness,
                      selectedBusinessId,
                      userName: user.name,
                      reloadBusinesses: businesses.reload,
                    } satisfies AppLayoutContext
                  }
                />
              </Suspense>
              </HeaderTitleSlot.Provider>
            </main>
          </Layout.Content>
        </Layout>
      </Layout>
    </Layout>
  )
}
