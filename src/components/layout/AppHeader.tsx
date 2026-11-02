import { DownOutlined } from '@ant-design/icons'
import { Badge, Button, Dropdown, Empty, Layout, Popover, Switch } from 'antd'
import type { MenuProps } from 'antd'
import { useLocation } from 'react-router'

type AppHeaderProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

// 사용자 정보와 알림은 API 연동 전까지 예시로
const userName = '담당자 A'
const userRole = '관리자'
const notificationCount = 0
const avatarSrc = `${import.meta.env.BASE_URL}images/avatar-placeholder.svg`

const userMenuItems: MenuProps['items'] = [
  { key: 'account', label: `${userName} - ${userRole}`, disabled: true },
  { type: 'divider' },
  { key: 'logout', label: '로그아웃', disabled: true },
]

const pageTitles: Record<string, string> = {
  '/': '홈',
}

export default function AppHeader({
  isDark,
  onThemeChange,
}: AppHeaderProps) {
  const { pathname } = useLocation()
  const pageTitle = pageTitles[pathname] ?? '페이지를 찾을 수 없습니다'


  return (
    <Layout.Header
      className="flex h-16 shrink-0 items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-lg leading-normal"
    >
      <div className="flex min-w-0 items-center gap-sm">

        <h1
          className="m-0 truncate text-section-title font-bold"
          title={pageTitle}
        >
          {pageTitle}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-sm">
        <Switch aria-label="다크 모드" checked={isDark} onChange={onThemeChange} />
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
            <Badge count={notificationCount} showZero size="small" />
          </Button>
        </Popover>

        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
          autoFocus
        >
          <Button
            type="default"
            aria-label={`사용자 메뉴: ${userName}, ${userRole}`}
            aria-haspopup="menu"
            className="h-[38px] gap-xs border-(--ant-color-border-secondary) bg-transparent py-[6px] pr-sm pl-xs font-regular shadow-none"
          >
            <span className="flex items-center gap-xs">
              <img
                src={avatarSrc}
                alt=""
                width={24}
                height={24}
                className={`shrink-0 ${isDark ? 'invert' : ''}`}
              />
              <span>{userName} - {userRole}</span>
              <DownOutlined className="text-[10px] text-(--ant-color-text-tertiary)" />
            </span>
          </Button>
        </Dropdown>
      </div>
    </Layout.Header>
  )
}
