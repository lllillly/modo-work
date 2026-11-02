import { Layout, Switch } from 'antd'

type AppHeaderProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppHeader({ isDark, onThemeChange }: AppHeaderProps) {
  return (
    <Layout.Header className="flex h-16 items-center justify-between border-0 border-b border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-lg leading-normal">
      <h1 className="m-0 text-section-title">홈</h1>
      <Switch aria-label="다크 모드" checked={isDark} onChange={onThemeChange} />
    </Layout.Header>
  )
}
