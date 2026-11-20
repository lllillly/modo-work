import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Card, Table } from 'antd'
import type { TableColumnsType } from 'antd'

import type { ManagedUser } from '../../../../types/adminUsers'
import { formatDateTime, getSameNameUsers } from '../usersData'

type PendingUsersProps = {
  users: ManagedUser[]
  activeUsers: ManagedUser[]
  getBlockReason?: (user: ManagedUser) => string | null
  isMobile: boolean
  onApprove: (user: ManagedUser) => void
}

export default function PendingUsers({ users, activeUsers, getBlockReason, isMobile, onApprove }: PendingUsersProps) {
  function renderNotice(user: ManagedUser) {
    const blockReason = getBlockReason?.(user)
    const hasSameName = getSameNameUsers(user, activeUsers).length > 0
    if (!blockReason && !hasSameName) return null
    return (
      <span className="flex flex-col">
        {blockReason && <span className="text-(--ant-color-text-secondary)">{blockReason}</span>}
        {hasSameName && (
          <span className="text-(--ant-color-warning-text)">같은 이름의 활성 사용자가 있어요 · 이메일로 확인</span>
        )}
      </span>
    )
  }

  function renderActions(user: ManagedUser) {
    return (
      <span className="flex shrink-0 items-center justify-end gap-xs">
        <Button size="small" disabled>
          거절
        </Button>
        <Button type="primary" size="small" disabled={!!getBlockReason?.(user)} onClick={() => onApprove(user)}>
          승인하기
        </Button>
      </span>
    )
  }

  const columns = [
    {
      title: '사용자',
      key: 'user',
      render: (_, user) => (
        <span className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="break-all text-(--ant-color-text-secondary)">{user.email}</span>
        </span>
      ),
    },
    {
      title: '처음 로그인',
      dataIndex: 'createdAt',
      className: 'whitespace-nowrap',
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '안내',
      key: 'notice',
      className: 'min-w-40',
      render: (_, user) => renderNotice(user) ?? '-',
    },
    {
      title: '',
      key: 'actions',
      className: 'whitespace-nowrap',
      render: (_, user) => renderActions(user),
    },
  ] satisfies TableColumnsType<ManagedUser>

  const empty = (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-sm py-xl text-center">
      <CheckCircleOutlined className="text-[30px] text-(--ant-color-text-tertiary)" />
      <h3 className="m-0 text-card-title font-medium">승인을 기다리는 사람이 없어요</h3>
      <p className="m-0 text-caption text-(--ant-color-text-secondary)">
        회사 Google 계정으로 처음 로그인한 사람이 여기에 보여요.
      </p>
    </div>
  )

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-xs' : 'p-lg' }}>
      {isMobile ? (
        users.length === 0 ? (
          empty
        ) : (
          <ul className="m-0 list-none p-0">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex flex-col gap-xxs border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm text-caption last:border-b-0"
              >
                <span className="flex items-center justify-between gap-xs">
                  <span className="text-body font-medium">{user.name}</span>
                  {renderActions(user)}
                </span>
                <span className="break-all text-(--ant-color-text-secondary)">{user.email}</span>
                <span className="text-(--ant-color-text-tertiary)">처음 로그인 {formatDateTime(user.createdAt)}</span>
                {renderNotice(user)}
              </li>
            ))}
          </ul>
        )
      ) : (
        <Table<ManagedUser>
          rowKey="id"
          columns={columns}
          dataSource={users}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
          locale={{ emptyText: empty }}
          classNames={{
            header: { cell: 'text-caption font-medium' },
            body: { cell: 'px-sm py-xs text-caption' },
          }}
        />
      )}
      {users.length > 0 && (
        <p className={`text-caption text-(--ant-color-text-tertiary) ${isMobile ? 'mt-0 mb-sm' : 'mt-sm mb-0'}`}>
          승인하기를 누르면 조직 단위, 영역, 역할을 정하는 패널이 열려요. 승인 전에는 로그인해도 &apos;승인 대기&apos;
          화면만 보여요.
        </p>
      )}
    </Card>
  )
}
