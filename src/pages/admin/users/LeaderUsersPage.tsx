import { useState } from 'react'
import { useOutletContext } from 'react-router'

import { getManagedUsers } from '../../../api/users'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import type { AuthUser } from '../../../types/auth'
import type { ManagedUser } from '../../../types/adminUsers'
import AllUsers from './components/AllUsers'
import LeaderRoleDrawer from './components/LeaderRoleDrawer'

export default function LeaderUsersPage({ user }: { user: AuthUser }) {
  const { isMobile } = useOutletContext<AppLayoutContext>()
  const [selected, setSelected] = useState<ManagedUser | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  function refresh() {
    setSelected(null)
    setRefreshKey((key) => key + 1)
  }

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h2 className="m-0 text-section-title">사용자와 승인</h2>
        {!isMobile && (
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">
            {user.orgUnit?.name ?? '소속 조직'} 사용자에게 담당자나 조직 단위 리더 역할을 추가해요.
          </p>
        )}
      </div>
      <AllUsers
        orgUnits={[]}
        refreshKey={refreshKey}
        loadUsers={getManagedUsers}
        editLabel="역할 추가"
        canEdit={(item) => item.status === 'ACTIVE' && item.id !== user.id}
        onEdit={setSelected}
      />
      {selected && (
        <LeaderRoleDrawer
          key={selected.id}
          user={selected}
          isMobile={isMobile}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
