import { Layout, Menu } from 'antd'
import { Link, useLocation } from 'react-router'

const menuItems = [
  { key: '/', label: <Link to="/">홈</Link> },
  { key: '/login', label: <Link to="/login">로그인</Link> },
]

export default function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Layout.Sider theme="light">
      <nav aria-label="페이지 이동">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          className="border-e-0"
        />
      </nav>
    </Layout.Sider>
  )
}
