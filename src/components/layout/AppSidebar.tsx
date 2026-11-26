import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiOutlined, CalendarOutlined, CarryOutOutlined, CloseOutlined, CloudUploadOutlined, CommentOutlined, FileTextOutlined, HomeOutlined, ImportOutlined, MessageOutlined, SnippetsOutlined, SolutionOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons'
import { PanelLeft } from 'lucide-react'
import { Badge, Button, ConfigProvider, Drawer, Layout, Menu, Select } from 'antd'
import type { ThemeConfig } from 'antd'
import { Link, useLocation } from 'react-router'

import HintTooltip from '../common/HintTooltip'
import { getAdminUsers, getManagedUsers } from '../../api/users'
import useApiQuery from '../../hooks/useApiQuery'

import type { UserRole } from '../../types/user'

type AppSidebarProps = {
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  role?: UserRole
  isOrgLeader: boolean
  selectedBusiness: string
  onBusinessChange: (business: string) => void
  businessOptions: { value: string; label: string }[]
}

type NavItem = {
  key: string
  to: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { key: '/', to: '/', label: '홈', icon: <HomeOutlined /> },
  { key: '/tasks', to: '/tasks', label: '과정별 할 일', icon: <CarryOutOutlined /> },
  { key: '/ask', to: '/ask', label: '물어보기', icon: <MessageOutlined /> },
  { key: '/documents', to: '/documents', label: '문서', icon: <FileTextOutlined /> },
]

const adminNavItems: NavItem[] = [
  { key: '/admin/courses', to: '/admin/courses', label: '과정·담당 배정', icon: <SolutionOutlined /> },
  { key: '/admin/users', to: '/admin/users', label: '사용자와 승인', icon: <TeamOutlined /> },
  { key: '/admin/task-templates', to: '/admin/task-templates', label: '할 일 템플릿', icon: <SnippetsOutlined /> },
  { key: '/admin/documents', to: '/admin/documents', label: '문서 업로드', icon: <CloudUploadOutlined /> },
  { key: '/admin/questions', to: '/admin/questions', label: '물어보기 관리', icon: <CommentOutlined /> },
  { key: '/admin/import', to: '/admin/courses/import', label: '과정 가져오기', icon: <ImportOutlined /> },
  { key: '/admin/service-tokens', to: '/admin/service-tokens', label: '서비스 토큰 관리', icon: <ApiOutlined /> },
  { key: '/admin/config', to: '/admin/config', label: '설정 내보내기 & 가져오기', icon: <SwapOutlined /> },
  { key: '/admin/settings', to: '/admin/settings', label: '휴무일 설정', icon: <CalendarOutlined /> },
]

function toMenuItems(items: NavItem[], counts: Record<string, number> = {}) {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: (
      <Link to={item.to} className="flex items-center justify-between gap-xs">
        {item.label}
        {!!counts[item.key] && <Badge count={counts[item.key]} size="small" title={`승인 대기 ${counts[item.key]}명`} />}
      </Link>
    ),
  }))
}

function RailItem({ item, selected, count = 0 }: { item: NavItem; selected: boolean; count?: number }) {
  const className = 'flex h-10 w-10 items-center justify-center rounded-lg text-lg'

  return (
    <HintTooltip title={item.label} placement="right">
      <Link
        to={item.to}
        aria-label={item.label}
        aria-current={selected ? 'page' : undefined}
        className={`${className} transition-colors focus-visible:outline-2 focus-visible:outline-(--ant-color-primary) ${
          selected
            ? 'bg-(--nav-selected-bg) text-(--nav-selected-text)'
            : 'text-(--ant-color-text-secondary) hover:bg-(--ant-color-fill-tertiary) hover:text-(--ant-color-text)'
        }`}
      >
        <Badge count={count} size="small" offset={[4, -2]} title={`승인 대기 ${count}명`}>
          <span className="text-lg text-inherit">{item.icon}</span>
        </Badge>
      </Link>
    </HintTooltip>
  )
}

const sidebarTheme: ThemeConfig = {
  components: {
    Menu: {
      itemHeight: 39,
      itemMarginInline: 0,
      itemMarginBlock: 2,
      itemPaddingInline: 12,
      itemBorderRadius: 8,
    },
    Select: { controlHeight: 37 },
  },
}

export default function AppSidebar({
  isMobile,
  isOpen,
  onClose,
  role,
  isOrgLeader,
  selectedBusiness,
  onBusinessChange,
  businessOptions,
}: AppSidebarProps) {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('portal-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const isRail = !isMobile && collapsed
  const canApprove = role === 'ADMIN' || isOrgLeader
  const loadPendingCount = useCallback(
    (signal: AbortSignal) =>
      (role === 'ADMIN' ? getAdminUsers : getManagedUsers)(0, { status: 'PENDING' }, signal, 1).then((page) => page.totalElements),
    [role],
  )
  const pendingQuery = useApiQuery(canApprove ? `pending-user-count:${role}:${pathname}` : null, loadPendingCount)
  const [pendingCount, setPendingCount] = useState(0)
  if (pendingQuery.data !== undefined && pendingQuery.data !== pendingCount) setPendingCount(pendingQuery.data)
  const adminCounts = { '/admin/users': pendingCount }

  function changeCollapsed(collapsed: boolean) {
    setCollapsed(collapsed)
    try {
      localStorage.setItem('portal-sidebar-collapsed', String(collapsed))
    } catch {
      return
    }
  }

  function openBusinessSelect() {
    changeCollapsed(false)
    requestAnimationFrame(() => document.getElementById('sidebar-business')?.focus())
  }

  const selectedMenuKey = pathname.startsWith('/documents') ? '/documents' : pathname
  const selectedAdminKey = pathname === '/admin/courses/import' ? '/admin/import'
    : pathname.startsWith('/admin/courses') ? '/admin/courses'
    : pathname.startsWith('/admin/task-templates') ? '/admin/task-templates' : pathname

  const visibleAdminItems = adminNavItems.filter((item) => {
    if (role === 'ADMIN') return true
    if (isOrgLeader) return item.key === '/admin/users'
    return false
  })

  const sidebarContent = (
    <ConfigProvider theme={sidebarTheme}>
      <div className={`flex flex-col gap-[2px] px-md ${isMobile ? 'pt-5 pb-5' : 'pt-xs pb-xs'}`}>
        {isMobile && (
          <div className="relative flex items-start">
            <Link
              to="/"
              onClick={onClose}
              className="flex min-w-0 flex-1 items-center pt-xxs pb-sm pl-xs"
            >
              <img
                src={`${import.meta.env.BASE_URL}images/logo.png`}
                alt="MODO WORK 홈"
                width={104}
                height={28}
                className="h-7 w-auto dark:hidden"
              />
              <img
                src={`${import.meta.env.BASE_URL}images/logo-dark.png`}
                alt="MODO WORK 홈"
                width={104}
                height={28}
                className="hidden h-7 w-auto dark:block"
              />
            </Link>
            <Button
              type="text"
              aria-label="메뉴 닫기"
              className="absolute top-0 right-0"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </div>
        )}
        <label
          htmlFor="sidebar-business"
          className="pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)"
        >
          사업
        </label>
        <Select
          id="sidebar-business"
          aria-label="사업 선택"
          className="w-full"
          value={selectedBusiness}
          onChange={onBusinessChange}
          options={businessOptions}
        />
        <nav aria-label="페이지 이동">
          <div className="pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)">
            메뉴
          </div>
          <Menu
            mode="inline"
            inlineIndent={12}
            selectedKeys={[selectedMenuKey]}
            items={toMenuItems(navItems)}
            onClick={onClose}
            className="border-e-0"
          />
          {visibleAdminItems.length > 0 && (
            <>
              <div className="mt-[2px] border-0 border-t border-solid border-(--ant-color-border-secondary) pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)">
                {role === 'ADMIN' ? '관리자' : '리더'}
              </div>
              <Menu
                mode="inline"
                inlineIndent={12}
                selectedKeys={[selectedAdminKey]}
                items={toMenuItems(visibleAdminItems, adminCounts)}
                onClick={onClose}
                className="border-e-0"
              />
            </>
          )}
        </nav>
      </div>
    </ConfigProvider>
  )

  const selectedBusinessLabel = businessOptions.find((option) => option.value === selectedBusiness)?.label ?? '사업'

  const railContent = (
    <nav aria-label="페이지 이동" className="flex flex-col items-center gap-xxs px-xs pt-xs pb-md">
      <HintTooltip title={`사업: ${selectedBusinessLabel}`} placement="right">
        <button
          type="button"
          onClick={openBusinessSelect}
          aria-label={`사업 ${selectedBusinessLabel}, 눌러서 바꾸기`}
          className="mb-xxs h-7 w-12 cursor-pointer truncate rounded-md border border-solid border-(--ant-color-border) bg-transparent px-xxs text-caption text-(--ant-color-text-secondary) transition-colors hover:border-(--ant-color-primary-hover) hover:text-(--ant-color-text) focus-visible:outline-2 focus-visible:outline-(--ant-color-primary)"
        >
          {selectedBusinessLabel}
        </button>
      </HintTooltip>
      {navItems.map((item) => <RailItem key={item.key} item={item} selected={item.key === selectedMenuKey} />)}
      {visibleAdminItems.length > 0 && (
        <>
          <div className="my-xxs w-8 border-0 border-t border-solid border-(--ant-color-border-secondary)" />
          {visibleAdminItems.map((item) => <RailItem key={item.key} item={item} selected={item.key === selectedAdminKey} count={adminCounts[item.key as keyof typeof adminCounts]} />)}
        </>
      )}
    </nav>
  )

  return (
    <>
      {!isMobile && (
        <Layout.Sider
          width={240}
          collapsedWidth={64}
          collapsed={collapsed}
          trigger={null}
          theme="light"
          className="border-0 border-e border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container)"
        >
          <div className="flex h-full flex-col">
            {isRail ? (
              <div className="flex h-16 shrink-0 items-center justify-center">
                <HintTooltip title="메뉴 펼치기" placement="right">
                  <button
                    type="button"
                    aria-label="메뉴 펼치기"
                    aria-expanded={false}
                    onClick={() => changeCollapsed(false)}
                    className="group relative flex h-10 w-10 cursor-ew-resize items-center justify-center rounded-lg border-0 bg-transparent transition-colors hover:bg-(--ant-color-fill-tertiary) focus-visible:outline-2 focus-visible:outline-(--ant-color-primary)"
                  >
                    <img src={`${import.meta.env.BASE_URL}images/logo-mark.png`} alt="" width={28} height={28} className="h-7 w-7 group-hover:invisible group-focus-visible:invisible" />
                    <PanelLeft size={18} aria-hidden className="invisible absolute text-(--ant-color-text-secondary) group-hover:visible group-focus-visible:visible" />
                  </button>
                </HintTooltip>
              </div>
            ) : (
              <div className="relative flex h-16 shrink-0 items-center justify-center pr-4">
                <Link to="/" className="flex items-center">
                  <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="MODO WORK 홈" width={104} height={28} className="h-7 w-auto dark:hidden" />
                  <img src={`${import.meta.env.BASE_URL}images/logo-dark.png`} alt="MODO WORK 홈" width={104} height={28} className="hidden h-7 w-auto dark:block" />
                </Link>
                <HintTooltip title="메뉴 접기" placement="right">
                  <Button type="text" aria-label="메뉴 접기" aria-expanded icon={<PanelLeft size={18} aria-hidden />} onClick={() => changeCollapsed(true)} className="absolute top-1/2 right-xs -translate-y-1/2 cursor-ew-resize text-(--ant-color-text-secondary)" />
                </HintTooltip>
              </div>
            )}
            <div className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">{isRail ? railContent : sidebarContent}</div>
          </div>
        </Layout.Sider>
      )}
      <Drawer
        title="메뉴"
        placement="left"
        size={296}
        open={isMobile && isOpen}
        onClose={onClose}
        closeIcon={false}
        afterOpenChange={(open) => {
          if (!open) onClose()
        }}
        classNames={{
          header: 'sr-only',
          body: 'bg-(--ant-color-bg-container) p-0',
          wrapper: 'max-w-full',
        }}
      >
        {isMobile && sidebarContent}
      </Drawer>
    </>
  )
}
