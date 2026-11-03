import { Suspense, useState } from 'react'
import { Grid, Layout, Spin } from 'antd'
import { Outlet } from 'react-router'

import { businessOptions, currentUser, notificationCount } from '../pages/home/assigneeHomeMockData'

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
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(businessOptions[0]?.value ?? '')

  return (
    <Layout hasSider={!isMobile} className="h-svh overflow-hidden">
      <AppSidebar
        isMobile={isMobile}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        role={currentUser.role}
        businessOptions={businessOptions}
        selectedBusiness={selectedBusiness}
        onBusinessChange={setSelectedBusiness}
      />
      <Layout className="min-h-0 min-w-0">
        <AppHeader
          isDark={isDark}
          onThemeChange={onThemeChange}
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          onMenuOpen={() => setIsMenuOpen(true)}
          userName={currentUser.name}
          userRole={currentUser.roleLabel}
          notificationCount={notificationCount}
        />
        <Layout.Content
          className={`flex min-h-0 min-w-0 flex-col overflow-y-auto ${isMobile ? 'p-md' : 'p-lg'}`}
        >
          <main className="flex flex-1 flex-col">
            <Suspense fallback={<Spin className="m-auto" aria-label="화면 불러오는 중" />}>
              <Outlet
                context={{ isMobile, selectedBusiness, userName: currentUser.name } satisfies AppLayoutContext}
              />
            </Suspense>
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
