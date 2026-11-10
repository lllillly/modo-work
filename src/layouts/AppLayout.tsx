import { Suspense, useState } from 'react'
import { App, Grid, Layout, Spin } from 'antd'
import { Outlet, useSearchParams } from 'react-router'

import { businessOptions, notificationCount } from '../pages/home/assigneeHomeMockData'

import { useAuth } from '../providers/AuthContext'
import { userRoleLabels } from '../types/user'

import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'

type AppLayoutProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export type AppLayoutContext = {
  isMobile: boolean
  selectedBusiness: string
  userName: string
}

export default function AppLayout({ isDark, onThemeChange }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg
  const [searchParams, setSearchParams] = useSearchParams()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(businessOptions[0]?.value ?? '')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  function handleBusinessChange(business: string) {
    const next = new URLSearchParams(searchParams)
    next.delete('courseId')
    next.delete('taskId')
    next.delete('preview')

    setSearchParams(next, { replace: true })
    setSelectedBusiness(business)
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

  const roles = user.roles.map((item) => item.role)
  const primaryRole = (['ADMIN', 'LEADER', 'ASSIGNEE', 'VIEWER'] as const).find((role) => roles.includes(role))
  const roleLabel = [...new Set(roles)].map((role) => userRoleLabels[role]).join(', ') || '역할 미지정'

  return (
    <Layout hasSider={!isMobile} className="h-svh overflow-hidden">
      <AppSidebar
        isMobile={isMobile}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        role={primaryRole}
        businessOptions={businessOptions}
        selectedBusiness={selectedBusiness}
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
          notificationCount={notificationCount}
          onLogout={handleLogout}
          isLoggingOut={isLoggingOut}
        />
        <Layout.Content
          className={`flex min-h-0 min-w-0 flex-col overflow-y-auto ${isMobile ? 'p-md' : 'p-lg'}`}
        >
          <main className="flex flex-1 flex-col">
            <Suspense fallback={<Spin className="m-auto" aria-label="화면 불러오는 중" />}>
              <Outlet
                context={{ isMobile, selectedBusiness, userName: user.name } satisfies AppLayoutContext}
              />
            </Suspense>
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
