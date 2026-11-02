import { useState } from 'react'
import { ConfigProvider, Layout, Menu, Select } from 'antd'
import type { MenuProps, ThemeConfig } from 'antd'
import { Link, useLocation } from 'react-router'

type AppSidebarProps = {
  role?: 'ADMIN' | 'LEADER' | 'ASSIGNEE' | 'VIEWER'
}

const menuItems = [
  { key: '/', label: <Link to="/">홈</Link> },
  { key: '/tasks', label: '과정별 할 일', disabled: true },
  { key: '/ask', label: '물어보기', disabled: true },
  { key: '/documents', label: '문서', disabled: true },
  { key: '/notices', label: '공지', disabled: true },
  { key: '/education', label: '교육', disabled: true },
] satisfies MenuProps['items']

const adminMenuItems = [
  { key: '/admin/courses', label: '과정 & 담당 배정', disabled: true },
  { key: '/admin/users', label: '사용자와 승인', disabled: true },
  { key: '/admin/task-templates', label: '할 일 템플릿', disabled: true },
  { key: '/admin/documents', label: '문서 업로드', disabled: true },
  { key: '/admin/questions', label: '물어보기 관리', disabled: true },
  { key: '/admin/import', label: '과정 가져오기', disabled: true },
  { key: '/admin/service-tokens', label: '서비스 토큰 관리', disabled: true },
  { key: '/admin/config', label: '설정 내보내기 & 가져오기', disabled: true },
  { key: '/admin/settings', label: '설정', disabled: true },
] satisfies MenuProps['items']

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
  role,
}: AppSidebarProps) {
  const { pathname } = useLocation()
  const [selectedBusiness, setSelectedBusiness] = useState('business-1')

  const visibleAdminItems = adminMenuItems.filter((item) => {
    if (role === 'ADMIN') return true
    if (role === 'LEADER') return item.key === '/admin/users'
    return false
  })

  const sidebarContent = (
    <ConfigProvider theme={sidebarTheme}>
      <div className="flex flex-col gap-[2px] px-md py-5">
        <div className="relative flex items-start">
          <Link
            to="/"
            className="flex min-w-0 flex-1 items-center justify-center gap-[10px] pt-xxs pb-sm text-(--ant-color-text)"
          >
            <span aria-hidden="true" className="size-6 shrink-0 rounded-md bg-brand-accent" />
            <span className="text-[18px] leading-[27px] font-bold">MODO WORK AX</span>
          </Link>

        </div>
        <label
          htmlFor="sidebar-business"
          className="pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)"
        >
          사업
        </label>
        {/* 사업 목록은 API 연동 전까지 예시로 표시 */}
        <Select
          id="sidebar-business"
          aria-label="사업 선택"
          className="w-full"
          value={selectedBusiness}
          onChange={setSelectedBusiness}
          options={[
            { value: 'business-1', label: '사업 1' },
            { value: 'business-2', label: '사업 2' },
          ]}
        />
        <nav aria-label="페이지 이동">
          <div className="pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)">
            메뉴
          </div>
          <Menu
            mode="inline"
            inlineIndent={12}
            selectedKeys={[pathname]}
            items={menuItems}
            className="border-e-0"
          />
          {visibleAdminItems.length > 0 && (
            <>
              <div className="mt-[2px] border-0 border-t border-solid border-(--ant-color-border-secondary) pt-xs pl-xs text-caption font-medium text-(--ant-color-text-tertiary)">
                관리자
              </div>
              <Menu
                mode="inline"
                inlineIndent={12}
                selectedKeys={[pathname]}
                items={visibleAdminItems}
                    className="border-e-0"
              />
            </>
          )}
        </nav>
      </div>
    </ConfigProvider>
  )

  return (
    <Layout.Sider
      width={256}
      theme="light"
      className="max-h-svh overflow-y-auto border-0 border-e border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container)"
    >
      {sidebarContent}
    </Layout.Sider>
  )
}
