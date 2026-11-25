import { lazy } from 'react'

import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import { useAuth } from '../../../providers/AuthContext'

const AdminUsersPage = lazy(() => import('./AdminUsersPage'))
const LeaderUsersPage = lazy(() => import('./LeaderUsersPage'))

export default function UsersPage() {
  const { user } = useAuth()
  if (!user) return null

  if (isAdmin(user)) return <AdminUsersPage />
  if (user.orgUnit && user.roles.some((role) => role.role === 'LEADER' && role.leaderType === 'ORG_UNIT')) {
    return <LeaderUsersPage key={user.id} user={user} orgUnit={user.orgUnit} />
  }

  return <NoPermission description="필요하면 관리자에게 권한을 요청해 주세요." />
}
