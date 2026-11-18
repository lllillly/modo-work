import { useCallback, useState } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { Button, Card, Skeleton, Tabs, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import { getAllPages } from '../../../api/pagination'
import { getManagedUsers, getUserAreas } from '../../../api/users'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import type { AuthUser } from '../../../types/auth'
import type { ManagedUser } from '../../../types/adminUsers'
import AllUsers from './components/AllUsers'
import LeaderApprovalDrawer from './components/LeaderApprovalDrawer'
import LeaderRoleDrawer from './components/LeaderRoleDrawer'
import PendingUsers from './components/PendingUsers'
import { getSameNameUsers } from './usersData'

type UsersTab = 'pending' | 'all'

type Selected = { user: ManagedUser; mode: 'approve' | 'role' }

type LeaderUsersPageProps = { user: AuthUser; orgUnit: NonNullable<AuthUser['orgUnit']> }

export default function LeaderUsersPage({ user, orgUnit }: LeaderUsersPageProps) {
  const { isMobile } = useOutletContext<AppLayoutContext>()
  const [tab, setTab] = useState<UsersTab>('pending')
  const [selected, setSelected] = useState<Selected | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loadPending = useCallback(
    (signal: AbortSignal) => getAllPages((page) => getManagedUsers(page, { status: 'PENDING' }, signal, 100)),
    [],
  )
  const loadAreas = useCallback((signal: AbortSignal) => getUserAreas(signal), [])
  const pending = useApiQuery('leader-pending-users', loadPending)
  const areas = useApiQuery('user-areas', loadAreas)
  const pendingUsers = pending.data ?? []

  const pendingNames = [...new Set(pendingUsers.map((item) => item.name))].join('\n')
  const loadSameNames = useCallback(
    async (signal: AbortSignal) => {
      const names = pendingNames.split('\n')
      const pages = await Promise.all(
        names.map((name) => getManagedUsers(0, { q: name, status: 'ACTIVE' }, signal, 100)),
      )
      const users = pages.flatMap((page) => page.items).filter((item) => names.includes(item.name))
      return [...new Map(users.map((item) => [item.id, item])).values()]
    },
    [pendingNames],
  )
  const sameNames = useApiQuery(
    pendingNames ? `leader-same-names:${refreshKey}:${pendingNames}` : null,
    loadSameNames,
  )
  const activeUsers = sameNames.data ?? []

  function refresh() {
    setSelected(null)
    setRefreshKey((key) => key + 1)
    pending.reload()
  }

  const pendingContent = pending.error ? (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'px-lg py-[48px]' }}>
      <div role="alert" className="flex flex-col items-center gap-sm text-center">
        <WarningOutlined aria-hidden className="text-[36px] text-(--ant-color-error)" />
        <h3 className="m-0 text-card-title font-medium">승인 대기 목록을 불러오지 못했어요</h3>
        <p className="m-0 text-caption text-(--ant-color-text-secondary)">잠시 후 다시 시도해 주세요.</p>
        <Button className="h-7" onClick={pending.reload}>
          다시 시도
        </Button>
      </div>
    </Card>
  ) : pending.isLoading ? (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }} aria-busy="true">
      <Skeleton active title={false} paragraph={{ rows: 3, width: '100%' }} />
    </Card>
  ) : (
    <PendingUsers
      users={pendingUsers}
      activeUsers={activeUsers}
      getBlockReason={(item) =>
        item.orgUnit && item.orgUnit.id !== orgUnit.id ? `다른 조직 소속(${item.orgUnit.name})이라 승인할 수 없어요` : null
      }
      onApprove={(item) => setSelected({ user: item, mode: 'approve' })}
    />
  )

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h2 className="m-0 text-section-title">사용자와 승인</h2>
        {!isMobile && (
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">
            승인 대기자를 {orgUnit.name} 소속으로 승인하고, 소속 사용자에게 역할을 추가해요.
          </p>
        )}
      </div>
      <Tabs
        activeKey={tab}
        onChange={(key) => setTab(key as UsersTab)}
        items={[
          {
            key: 'pending',
            label: (
              <span>
                승인 대기
                {pendingUsers.length > 0 && (
                  <Tag variant="outlined" color="warning" className="ml-xs text-caption">
                    {pendingUsers.length}
                  </Tag>
                )}
              </span>
            ),
            children: pendingContent,
          },
          {
            key: 'all',
            label: '우리 조직 사용자',
            children: (
              <AllUsers
                orgUnits={[]}
                refreshKey={refreshKey}
                loadUsers={getManagedUsers}
                editLabel="역할 추가"
                canEdit={(item) => item.status === 'ACTIVE' && item.id !== user.id}
                onEdit={(item) => setSelected({ user: item, mode: 'role' })}
              />
            ),
          },
        ]}
      />
      {selected?.mode === 'approve' && (
        <LeaderApprovalDrawer
          key={selected.user.id}
          user={selected.user}
          orgUnit={orgUnit}
          sameNameUsers={getSameNameUsers(selected.user, activeUsers)}
          areas={areas.data?.items ?? []}
          areasStatus={areas.error ? 'error' : areas.isLoading ? 'loading' : 'ready'}
          isMobile={isMobile}
          onRetryAreas={areas.reload}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}
      {selected?.mode === 'role' && (
        <LeaderRoleDrawer
          key={selected.user.id}
          user={selected.user}
          isMobile={isMobile}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
