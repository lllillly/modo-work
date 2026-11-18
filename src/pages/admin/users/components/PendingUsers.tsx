import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Card, Table } from 'antd'
import type { TableColumnsType } from 'antd'

import type { ManagedUser } from '../../../../types/adminUsers'
import { formatDateTime, getSameNameUsers } from '../usersData'

type PendingUsersProps = {
  users: ManagedUser[]
  activeUsers: ManagedUser[]
  getBlockReason?: (user: ManagedUser) => string | null
  onApprove: (user: ManagedUser) => void
}

export default function PendingUsers({ users, activeUsers, getBlockReason, onApprove }: PendingUsersProps) {
  const columns = [
    { title: '이름', dataIndex: 'name', width: 128 },
    { title: '이메일', dataIndex: 'email', width: 232 },
    {
      title: '처음 로그인',
      dataIndex: 'createdAt',
      width: 172,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '안내',
      key: 'notice',
      render: (_, user) => {
        const blockReason = getBlockReason?.(user)
        const hasSameName = getSameNameUsers(user, activeUsers).length > 0
        if (!blockReason && !hasSameName) return '-'
        return (
          <span className="flex flex-col">
            {blockReason && <span className="text-(--ant-color-text-secondary)">{blockReason}</span>}
            {hasSameName && (
              <span className="text-(--ant-color-warning-text)">같은 이름의 활성 사용자가 있어요 · 이메일로 확인</span>
            )}
          </span>
        )
      },
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, user) => (
        <span className="flex items-center justify-end gap-xs">
          <Button size="small" disabled>
            거절
          </Button>
          <Button
            type="primary"
            size="small"
            disabled={!!getBlockReason?.(user)}
            onClick={() => onApprove(user)}
          >
            승인하기
          </Button>
        </span>
      ),
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
    <div className="flex flex-col gap-sm">
      <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
        <Table<ManagedUser>
          rowKey="id"
          columns={columns}
          dataSource={users}
          pagination={false}
          size="small"
          scroll={{ x: 720 }}
          locale={{ emptyText: empty }}
          classNames={{
            header: { cell: 'text-caption font-medium' },
            body: { cell: 'px-sm py-xs text-caption' },
          }}
        />
      </Card>
      {users.length > 0 && (
        <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
          승인하기를 누르면 조직 단위, 영역, 역할을 정하는 패널이 열려요. 승인 전에는 로그인해도 &apos;승인 대기&apos;
          화면만 보여요.
        </p>
      )}
    </div>
  )
}
