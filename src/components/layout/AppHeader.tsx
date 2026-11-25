import { BellOutlined, DownOutlined, MenuOutlined, MoonOutlined, SunOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Dropdown, Layout, Popover } from 'antd'
import type { MenuProps } from 'antd'

import ThemeToggle from '../common/ThemeToggle'
import EmptyData from '../../components/common/EmptyData'

type AppHeaderProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
  isMobile: boolean
  onMenuOpen: () => void
  isMenuOpen: boolean
  userName: string
  userRole: string
  notificationCount: number
  onLogout: () => Promise<void>
  isLoggingOut: boolean
  titleSlotRef: (element: HTMLElement | null) => void
}

export default function AppHeader({
  isDark,
  onThemeChange,
  isMobile,
  onMenuOpen,
  isMenuOpen,
  userName,
  userRole,
  notificationCount,
  onLogout,
  isLoggingOut,
  titleSlotRef,
}: AppHeaderProps) {
  const userMenuItems: MenuProps['items'] = [
    { type: 'group', key: 'account', label: <span className="text-(--ant-color-text)">{userName} - {userRole}</span> },
    { type: 'divider' },
    ...(isMobile
      ? [
          {
            key: 'theme',
            icon: isDark ? <SunOutlined /> : <MoonOutlined />,
            label: isDark ? '라이트 모드로 보기' : '다크 모드로 보기',
          },
          { type: 'divider' as const },
        ]
      : []),
    { key: 'logout', label: '로그아웃', danger: true, disabled: isLoggingOut },
  ]

  function handleUserMenuClick({ key }: { key: string }) {
    if (key === 'logout') void onLogout()
    if (key === 'theme') onThemeChange(!isDark)
  }

  return (
    <Layout.Header
      className={`flex shrink-0 items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) leading-normal ${isMobile ? 'h-14 px-md' : 'h-16 px-lg'}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-xs">
        {isMobile && (
          <Button
            type="text"
            aria-label="메뉴 열기"
            aria-expanded={isMenuOpen}
            icon={<MenuOutlined />}
            onClick={onMenuOpen}
            className="shrink-0"
          />
        )}
        <span ref={titleSlotRef} className="min-w-0 flex-1" />
      </div>

      <div className="flex shrink-0 items-center gap-xs">
        {!isMobile && <ThemeToggle isDark={isDark} onThemeChange={onThemeChange} />}
        <Popover
          title="알림"
          trigger="click"
          placement="bottomRight"
          content={
<EmptyData plain compact title="새 알림이 없어요" />
          }
        >
          <Button
            type="text"
            aria-label={`알림 ${notificationCount}건`}
            icon={
              <Badge count={notificationCount} size="small">
                <BellOutlined className="text-[18px]" />
              </Badge>
            }
          />
        </Popover>

        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
          autoFocus
        >
          {isMobile ? (
            <Button
              type="text"
              aria-label={`사용자 메뉴: ${userName}, ${userRole}`}
              aria-haspopup="menu"
              loading={isLoggingOut}
              icon={<UserOutlined className="text-[18px]" />}
            />
          ) : (
            <Button
              type="text"
              aria-label={`사용자 메뉴: ${userName}, ${userRole}`}
              aria-haspopup="menu"
              loading={isLoggingOut}
              className="gap-xs px-sm font-regular"
            >
              {userName}
              <DownOutlined className="text-[10px] text-(--ant-color-text-tertiary)" />
            </Button>
          )}
        </Dropdown>
      </div>
    </Layout.Header>
  )
}
