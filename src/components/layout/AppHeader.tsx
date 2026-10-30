import { useId } from 'react'
import { Layout, Switch } from 'antd'
import { Link } from 'react-router'

type AppHeaderProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppHeader({
  isDark,
  onThemeChange,
}: AppHeaderProps) {
  const switchId = useId()

  return (
    <Layout.Header className="flex items-center justify-between gap-md bg-(--ant-color-bg-container) px-lg leading-normal">
      <Link to="/" className="text-section-title font-bold text-brand-accent">
        MODO WORK AX
      </Link>
      <div className="flex items-center gap-xs">
        <label htmlFor={switchId}>다크 모드</label>
        <Switch id={switchId} checked={isDark} onChange={onThemeChange} />
      </div>
    </Layout.Header>
  )
}
