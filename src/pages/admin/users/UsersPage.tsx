import { lazy } from 'react'
import { Button, Result } from 'antd'
import { Link } from 'react-router'

import { useAuth } from '../../../providers/AuthContext'

const AdminUsersPage = lazy(() => import('./AdminUsersPage'))
const LeaderUsersPage = lazy(() => import('./LeaderUsersPage'))

export default function UsersPage() {
  const { user } = useAuth()
  if (!user) return null

  if (user.roles.some((role) => role.role === 'ADMIN')) return <AdminUsersPage />
  if (user.roles.some((role) => role.role === 'LEADER') && user.orgUnit) {
    return <LeaderUsersPage key={user.id} user={user} />
  }

  return (
    <Result
      status="403"
      title="이 화면에 접근할 권한이 없어요"
      subTitle="사용자와 승인은 관리자와 리더만 볼 수 있어요."
      extra={
        <Link to="/">
          <Button type="primary">홈으로</Button>
        </Link>
      }
    />
  )
}
