import { Card, Layout } from 'antd'
import { Outlet } from 'react-router'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'

type AppLayoutProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppLayout({ isDark, onThemeChange }: AppLayoutProps) {
  return (
    <Layout hasSider className="min-h-svh">
      <AppSidebar />
      <Layout className="min-w-0">
        <AppHeader isDark={isDark} onThemeChange={onThemeChange} />
        <Layout.Content className="flex min-w-0 flex-col p-lg">
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
