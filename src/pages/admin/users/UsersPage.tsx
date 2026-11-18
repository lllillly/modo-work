import { lazy } from 'react'
import { Button } from 'antd'
import { Link } from 'react-router'

import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import { useAuth } from '../../../providers/AuthContext'

const AdminUsersPage = lazy(() => import('./AdminUsersPage'))
const LeaderUsersPage = lazy(() => import('./LeaderUsersPage'))

export default function UsersPage() {
  const { user } = useAuth()
  if (!user) return null

  if (user.roles.some((role) => role.role === 'ADMIN')) return <AdminUsersPage />
  if (user.orgUnit && user.roles.some((role) => role.role === 'LEADER' && role.leaderType === 'ORG_UNIT')) {
    return <LeaderUsersPage key={user.id} user={user} orgUnit={user.orgUnit} />
  }

  return (
    <NoticeCard
      icon={<ErrorTriangle />}
      title="이 화면에 접근할 권한이 없어요"
      description="필요하면 관리자에게 권한을 요청해 주세요."
      action={
        <Link to="/">
          <Button className="h-7">홈으로</Button>
        </Link>
      }
    />
  )
}
