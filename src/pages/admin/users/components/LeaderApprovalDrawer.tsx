import { useState } from 'react'
import { Alert, App, Button, Checkbox, Drawer, Radio, Skeleton } from 'antd'

import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { approveUser } from '../../../../api/users'
import { useAuth } from '../../../../providers/AuthContext'
import type { ManagedUser, UserRoleRequest } from '../../../../types/adminUsers'
import type { OptionItem } from '../../../../types/courseApi'
import { formatDateTime } from '../usersData'

type LeaderApprovalDrawerProps = {
  user: ManagedUser
  orgUnit: OptionItem
  sameNameUsers: ManagedUser[]
  areas: OptionItem[]
  areasStatus: 'loading' | 'error' | 'ready'
  isMobile: boolean
  onRetryAreas: () => void
  onClose: () => void
  onSaved: () => void
}

const base = { scopeType: 'ORG_UNIT', viewerTargetRole: null, areaId: null } as const

export default function LeaderApprovalDrawer({
  user,
  orgUnit,
  sameNameUsers,
  areas,
  areasStatus,
  isMobile,
  onRetryAreas,
  onClose,
  onSaved,
}: LeaderApprovalDrawerProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const [assignee, setAssignee] = useState(false)
  const [orgLeader, setOrgLeader] = useState(false)
  const [areaId, setAreaId] = useState(user.areas.length === 1 ? user.areas[0].id : undefined)
  const [isSaving, setIsSaving] = useState(false)
  const isReady = areasStatus === 'ready'

  async function save() {
    const roles: UserRoleRequest[] = []
    if (assignee) roles.push({ ...base, role: 'ASSIGNEE', leaderType: null })
    if (orgLeader) roles.push({ ...base, role: 'LEADER', leaderType: 'ORG_UNIT' })
    if (roles.length === 0) {
      message.warning('역할을 하나 이상 골라 주세요.')
      return
    }
    if (assignee && !areaId) {
      message.warning('담당자는 담당/열람 영역을 한 개 골라 주세요.')
      return
    }

    setIsSaving(true)
    try {
      await approveUser(user.id, { version: user.version, orgUnitId: orgUnit.id, areaIds: areaId ? [areaId] : [], roles })
      message.success(`${user.name} 님을 승인했어요.`)
      onSaved()
    } catch (error) {
      message.error(getApiErrorMessage(error))
      if (isAuthStateError(error)) void refreshUser()
      if (error instanceof ApiError && error.status === 409) onSaved()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      title="승인하기"
      size={isMobile ? '100%' : 480}
      closable={{ placement: 'end' }}
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <Button type="primary" onClick={() => void save()} loading={isSaving} disabled={!isReady}>
            승인
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

        {sameNameUsers.length > 0 && (
          <Alert
            type="warning"
            showIcon
            title={`같은 이름의 활성 사용자가 있어요: ${sameNameUsers
              .map((item) => `${item.name}(${item.email})`)
              .join(', ')}. 같은 사람인지 확인해 주세요.`}
          />
        )}

        <div className="flex items-center gap-sm">
          <span className="w-24 shrink-0 text-caption text-(--ant-color-text-secondary)">조직 단위</span>
          <span className="text-body">{orgUnit.name}</span>
        </div>

        {areasStatus === 'error' && (
          <Alert
            type="error"
            showIcon
            title="영역 목록을 불러오지 못했어요."
            action={
              <Button size="small" onClick={onRetryAreas}>
                다시 시도
              </Button>
            }
          />
        )}
        {areasStatus === 'loading' && <Skeleton active title={false} paragraph={{ rows: 3, width: '100%' }} />}

        {isReady && (
          <div className="flex flex-col gap-xs">
            <span className="text-body font-medium">
              역할 <span className="text-(--ant-color-error-text)">*</span>
            </span>
            <Checkbox checked={assignee} onChange={(event) => setAssignee(event.target.checked)}>
              담당자
            </Checkbox>
            {assignee && (
              <div className="ml-lg flex flex-col gap-xs">
                <span className="text-caption text-(--ant-color-text-secondary)">
                  담당/열람 영역 <span className="text-(--ant-color-error-text)">*</span>
                </span>
                <Radio.Group
                  value={areaId}
                  onChange={(event) => setAreaId(event.target.value)}
                  options={areas.map((area) => ({ value: area.id, label: area.name }))}
                />
              </div>
            )}
            <Checkbox checked={orgLeader} onChange={(event) => setOrgLeader(event.target.checked)}>
              조직 단위 리더
            </Checkbox>
          </div>
        )}
      </div>
    </Drawer>
  )
}
