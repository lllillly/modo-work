import { Layout } from 'antd'
import { Outlet } from 'react-router'
import AppHeader from '../components/layout/AppHeader'
import AppSidebar from '../components/layout/AppSidebar'

type AppLayoutProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppLayout({ isDark, onThemeChange }: AppLayoutProps) {
  return (
    <Layout className="min-h-svh">
      <AppHeader isDark={isDark} onThemeChange={onThemeChange} />
      <Layout hasSider>
        <AppSidebar />
        <Layout.Content className="min-w-0 p-lg">
          <main>
            <Outlet />
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
