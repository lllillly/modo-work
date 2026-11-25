import { useState } from 'react'
import { App, Button, Checkbox, Drawer, Tag } from 'antd'

import { isConflict } from '../../../../api/client'
import { grantUserRoles } from '../../../../api/users'
import type { ManagedUser, UserRoleRequest } from '../../../../types/adminUsers'
import { getRoleLabels } from '../usersData'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import { formatDateTime } from '../../../../utils/date'

type LeaderRoleDrawerProps = {
  user: ManagedUser
  isMobile: boolean
  onClose: () => void
  onSaved: () => void
}

const base = { scopeType: 'ORG_UNIT', viewerTargetRole: null, areaId: null } as const

export default function LeaderRoleDrawer({ user, isMobile, onClose, onSaved }: LeaderRoleDrawerProps) {
  const { message } = App.useApp()
  const { showError } = useApiErrorHandler()
  const [assignee, setAssignee] = useState(false)
  const [orgLeader, setOrgLeader] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const hasAssignee = user.roles.some((role) => role.role === 'ASSIGNEE')
  const hasOrgLeader = user.roles.some((role) => role.role === 'LEADER' && role.leaderType === 'ORG_UNIT')
  const canAddAssignee = !hasAssignee && user.areas.length === 1

  async function save() {
    const roles: UserRoleRequest[] = []
    if (assignee) roles.push({ ...base, role: 'ASSIGNEE', leaderType: null })
    if (orgLeader) roles.push({ ...base, role: 'LEADER', leaderType: 'ORG_UNIT' })
    if (roles.length === 0) {
      message.warning('추가할 역할을 골라 주세요.')
      return
    }

    setIsSaving(true)
    try {
      await grantUserRoles(user.id, { version: user.version, roles })
      message.success(`${user.name} 님에게 역할을 추가했어요.`)
      onSaved()
    } catch (error) {
      showError(error)
      if (isConflict(error)) onSaved()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      title="역할 추가"
      size={isMobile ? '100%' : 480}
      closable={{ placement: 'end' }}
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button type="primary" onClick={() => void save()} loading={isSaving}>
            추가
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-md">
        <div className="flex flex-col gap-xxs rounded-lg bg-(--ant-color-fill-quaternary) px-md py-sm">
          <span className="text-body font-medium">{user.name}</span>
          <span className="text-caption text-(--ant-color-text-secondary)">
            {user.email} · 처음 로그인 {formatDateTime(user.createdAt)}
          </span>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="text-body font-medium">현재 역할</span>
          <span className="flex flex-wrap gap-xxs">
            {user.roles.length
              ? getRoleLabels(user).map((item) => (
                  <Tag key={item.key} variant="outlined" color={item.color} className="m-0 text-caption">
                    {item.label}
                  </Tag>
                ))
              : '-'}
          </span>
        </div>

        <div className="flex flex-col gap-xs">
          <span className="text-body font-medium">추가할 역할</span>
          <span className="text-caption text-(--ant-color-text-tertiary)">기존 역할은 그대로 두고 고른 역할만 더해요.</span>
          <Checkbox
            checked={hasAssignee || assignee}
            disabled={!canAddAssignee}
            onChange={(event) => setAssignee(event.target.checked)}
          >
            담당자
          </Checkbox>
          {!hasAssignee && user.areas.length !== 1 && (
            <span className="ml-lg text-caption text-(--ant-color-text-tertiary)">
              영역이 한 개 지정된 사용자에게만 추가할 수 있어요.
            </span>
          )}
          <Checkbox
            checked={hasOrgLeader || orgLeader}
            disabled={hasOrgLeader}
            onChange={(event) => setOrgLeader(event.target.checked)}
          >
            조직 단위 리더
          </Checkbox>
        </div>
      </div>
    </Drawer>
  )
}
