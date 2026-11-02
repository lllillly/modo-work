import { useState } from 'react'
import { Card, Grid, Layout } from 'antd'
import { Outlet } from 'react-router'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'

type AppLayoutProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppLayout({ isDark, onThemeChange }: AppLayoutProps) {
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.lg
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Layout hasSider={!isMobile} className="min-h-svh">
      {/* 인증 연동 전에는 관리자 메뉴 표시 */}
      <AppSidebar
        isMobile={isMobile}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        role="ADMIN"
      />
      <Layout className="min-w-0">
        <AppHeader
          isDark={isDark}
          onThemeChange={onThemeChange}
          isMobile={isMobile}
          isMenuOpen={isMenuOpen}
          onMenuOpen={() => setIsMenuOpen(true)}
        />
        <Layout.Content
          className={`flex min-w-0 flex-col ${isMobile ? 'p-md' : 'p-lg'}`}
        >
          <main className="flex flex-1 flex-col">
            <Card className="flex-1">
              <Outlet />
            </Card>
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
