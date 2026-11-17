import { DownOutlined, MenuOutlined } from '@ant-design/icons'
import { Badge, Button, Dropdown, Empty, Layout, Popover } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation } from 'react-router'

import ThemeToggle from '../common/ThemeToggle'

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
}

const avatarSrc = `${import.meta.env.BASE_URL}images/avatar-placeholder.svg`

const pageTitles: Record<string, string> = {
  '/': '홈',
  '/tasks': '과정별 할 일',
  '/ask': '물어보기',
  '/admin/courses': '과정·담당 배정',
  '/admin/courses/import': '과정 가져오기',
  '/admin/users': '사용자와 승인',
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
}: AppHeaderProps) {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname]
    ?? (pathname.startsWith('/admin/courses/') ? '과정·담당 배정' : null)
    ?? (pathname.startsWith('/documents/') ? '문서' : null)
    ?? '페이지를 찾을 수 없습니다'
  const userMenuItems: MenuProps['items'] = [
    { key: 'account', label: `${userName} - ${userRole}`, disabled: true },
    { type: 'divider' },
    { key: 'logout', label: '로그아웃', disabled: isLoggingOut },
  ]

  function handleUserMenuClick({ key }: { key: string }) {
    if (key === 'logout') {
      void onLogout()
    }
  }

  return (
    <Layout.Header
      className={`flex shrink-0 items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) leading-normal ${isMobile ? 'h-14 px-md' : 'h-16 px-lg'}`}
    >
      <div className="flex min-w-0 items-center gap-sm">
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
        <h1
          className={`m-0 truncate font-bold ${isMobile ? 'text-[18px] leading-[27px]' : 'text-section-title'}`}
          title={pageTitle}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-sm">
        <ThemeToggle isDark={isDark} onThemeChange={onThemeChange} />
        <Popover
          title="알림"
          trigger="click"
          placement="bottomRight"
          content={
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="알림 목록이 없습니다"
            />
          }
        >
          <Button
            type="text"
            aria-label={`알림 ${notificationCount}건`}
            className="flex items-center gap-[6px] px-0 font-regular"
          >
            알림
            <Badge count={notificationCount} size="small" />
          </Button>
        </Popover>

        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          trigger={['click']}
          placement="bottomRight"
          autoFocus
        >
          <Button
            type={isMobile ? 'text' : 'default'}
            aria-label={`사용자 메뉴: ${userName}, ${userRole}`}
            aria-haspopup="menu"
            loading={isLoggingOut}
            className={
              isMobile
                ? 'h-auto border-0 bg-transparent p-0 shadow-none'
                : 'h-[38px] gap-xs border-(--ant-color-border-secondary) bg-transparent py-[6px] pr-sm pl-xs font-regular shadow-none'
            }
          >
            <span className="flex items-center gap-xs">
              <img
                src={avatarSrc}
                alt=""
                width={24}
                height={24}
                className={`shrink-0 ${isDark ? 'invert' : ''}`}
              />
              {!isMobile && (
                <>
                  <span>{userName} - {userRole}</span>
                  <DownOutlined className="text-[10px] text-(--ant-color-text-tertiary)" />
                </>
              )}
            </span>
          </Button>
        </Dropdown>
      </div>
    </Layout.Header>
  )
}
