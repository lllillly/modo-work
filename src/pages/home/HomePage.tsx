import { lazy } from 'react'

import { useAuth } from '../../providers/AuthContext'

const AssigneeHomePage = lazy(() => import('./AssigneeHomePage'))
const LeaderHomePage = lazy(() => import('./LeaderHomePage'))

export default function HomePage() {
  const { user } = useAuth()
  if (!user) return null

  // 유저 role 대로
  return user.roles.some((role) => role.role === 'LEADER' || role.role === 'ADMIN')
    ? <LeaderHomePage key={user.id} user={user} />
    : <AssigneeHomePage key={user.id} />
}
