import { useCallback, useState } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { Button, Card, Result, Skeleton, Tabs, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import { getCourseOptions } from '../../../api/courses'
import { getAdminUsers } from '../../../api/users'
import { getAllPages } from '../../../api/pagination'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import type { ManagedUser } from '../../../types/adminUsers'
import AllUsers from './components/AllUsers'
import PendingUsers from './components/PendingUsers'
import UserDrawer from './components/UserDrawer'
import { getSameNameUsers } from './usersData'

type UsersTab = 'pending' | 'all'

type UsersContentProps = { businessId: string; isMobile: boolean }

function UsersContent({ businessId, isMobile }: UsersContentProps) {
  const [tab, setTab] = useState<UsersTab>('pending')
  const [selected, setSelected] = useState<ManagedUser | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const loadPending = useCallback(
    (signal: AbortSignal) => getAllPages((page) => getAdminUsers(page, { status: 'PENDING' }, signal, 100)),
    [],
  )
  const loadActive = useCallback(
    (signal: AbortSignal) => getAllPages((page) => getAdminUsers(page, { status: 'ACTIVE' }, signal, 100)),
    [],
  )
  const loadTotal = useCallback((signal: AbortSignal) => getAdminUsers(0, {}, signal, 1), [])
  const loadOptions = useCallback((signal: AbortSignal) => getCourseOptions(businessId, signal), [businessId])
  const pending = useApiQuery('pending-users', loadPending)
  const active = useApiQuery('active-users', loadActive)
  const total = useApiQuery('total-users', loadTotal)
  const options = useApiQuery(businessId, loadOptions)
  const pendingUsers = pending.data ?? []
  const orgUnits = options.data?.orgUnits ?? []

  function refresh() {
    setSelected(null)
    setRefreshKey((key) => key + 1)
    pending.reload()
    active.reload()
    total.reload()
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
    <PendingUsers users={pendingUsers} activeUsers={active.data ?? []} onApprove={setSelected} />
  )

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h2 className="m-0 text-section-title">사용자와 승인</h2>
        {!isMobile && (
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">
            처음 로그인한 사람을 승인하고, 조직 단위·영역·역할을 정해요.
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
            label: (
              <span>
                전체 사용자
                {total.data && (
                  <span className="ml-xs text-caption text-(--ant-color-text-tertiary)">{total.data.totalElements}</span>
                )}
              </span>
            ),
            children: (
              <AllUsers
                orgUnits={orgUnits}
                refreshKey={refreshKey}
                loadUsers={getAdminUsers}
                editLabel="수정"
                canEdit={(user) => user.status !== 'PENDING'}
                onEdit={setSelected}
              />
            ),
          },
          { key: 'lists', label: '목록 관리', disabled: true },
        ]}
      />
      {selected && (
        <UserDrawer
          key={selected.id}
          user={selected}
          orgUnits={orgUnits}
          areas={options.data?.areas ?? []}
          optionsStatus={options.error ? 'error' : options.isLoading ? 'loading' : 'ready'}
          onRetryOptions={options.reload}
          sameNameUsers={getSameNameUsers(selected, active.data ?? [])}
          isMobile={isMobile}
          onClose={() => setSelected(null)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const { isMobile, selectedBusinessId } = useOutletContext<AppLayoutContext>()

  if (!selectedBusinessId) {
    return <Result status="info" title="선택할 수 있는 사업이 없어요" />
  }

  return <UsersContent key={selectedBusinessId} businessId={selectedBusinessId} isMobile={isMobile} />
}
