import { useState } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { Alert, App, Button, Checkbox, Drawer, Radio, Select, Skeleton } from 'antd'

import { isConflict } from '../../../../api/client'
import { approveUser, updateUserSettings } from '../../../../api/users'
import type { ManagedUser } from '../../../../types/adminUsers'
import type { OptionItem } from '../../../../types/courseApi'
import type { UserDraft, ViewerTarget } from '../usersData'
import {
  getDefaultViewerScope,
  toDraft,
  toSettingsRequest,
  validateDraft,
  viewerTargetOptions,
  withCurrentOptions,
} from '../usersData'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import { formatDateTime } from '../../../../utils/date'

const NONE = 'none'

type UserDrawerProps = {
  user: ManagedUser
  orgUnits: OptionItem[]
  areas: OptionItem[]
  optionsStatus: 'loading' | 'error' | 'ready'
  sameNameUsers: ManagedUser[]
  isMobile: boolean
  onRetryOptions: () => void
  onClose: () => void
  onSaved: () => void
}

export default function UserDrawer({
  user,
  orgUnits,
  areas,
  optionsStatus,
  sameNameUsers,
  isMobile,
  onRetryOptions,
  onClose,
  onSaved,
}: UserDrawerProps) {
  
  const { message, modal } = App.useApp()
  const { showError } = useApiErrorHandler()
  const [draft, setDraft] = useState(() => toDraft(user))
  const [isSaving, setIsSaving] = useState(false)
  const isApproval = user.status === 'PENDING'
  const isActive = user.status === 'ACTIVE'
  const currentOrgUnits = !isApproval && user.orgUnit ? [user.orgUnit] : []
  const currentAreas = isApproval ? [] : user.areas
  const currentLeaderAreas = isApproval
    ? []
    : user.roles.flatMap((role) => (role.leaderType === 'AREA' && role.area ? [role.area] : []))
  
  const orgOptions = withCurrentOptions(orgUnits, currentOrgUnits)
  const areaOptions = withCurrentOptions(areas, currentAreas)
  const leaderAreaOptions = withCurrentOptions(areas, currentLeaderAreas)
  const orgUnitName = orgOptions.find((org) => org.value === draft.orgUnitId)?.label ?? '-'
  const viewerTargets = [...new Set(draft.viewers.map((viewer) => viewer.target))]
  const viewerNeedsOrg = draft.viewer && draft.viewers.some((viewer) => viewer.scope === 'ORG_UNIT')
  const viewerNeedsArea = draft.viewer && draft.viewers.some((viewer) => viewer.target === 'ASSIGNEE')
  const orgPlace = draft.assignee ? 'assignee' : draft.leader ? 'leader' : viewerNeedsOrg ? 'viewer' : null
  const areaPlace = draft.assignee ? 'assignee' : viewerNeedsArea ? 'viewer' : draft.areaIds.length > 1 ? 'bottom' : null
  const hasOtherRole = draft.assignee || draft.leader || draft.admin
  const isReady = optionsStatus === 'ready'
  const keptValues = [
    !orgPlace && draft.orgUnitId ? `소속: ${orgUnitName}` : null,
    !areaPlace && draft.areaIds.length === 1
      ? `영역: ${areaOptions.find((area) => area.value === draft.areaIds[0])?.label ?? '-'}`
      : null,
  ].filter(Boolean)

  function change(values: Partial<UserDraft>) {
    setDraft((current) => ({ ...current, ...values }))
  }

  function checkDraft() {
    const problem = validateDraft(draft)
    if (problem) message.warning(problem)
    return !problem
  }

  function changeViewerTargets(targets: ViewerTarget[]) {
    change({
      viewers: [
        ...draft.viewers.filter((viewer) => targets.includes(viewer.target)),
        ...targets
          .filter((target) => !viewerTargets.includes(target))
          .map((target) => ({ target, scope: getDefaultViewerScope(target) })),
      ],
    })
  }

  async function save(status?: 'ACTIVE' | 'INACTIVE') {
    if (!checkDraft()) return

    setIsSaving(true)
    try {
      const request = toSettingsRequest(user, draft)
      if (isApproval) {
        await approveUser(user.id, request)
        message.success(`${user.name} 님을 승인했어요.`)
      } else {
        await updateUserSettings(user.id, { ...request, status: status ?? (isActive ? 'ACTIVE' : 'INACTIVE') })
        message.success(
          status === 'INACTIVE'
            ? `${user.name} 님을 비활성으로 바꿨어요.`
            : status === 'ACTIVE'
              ? `${user.name} 님을 활성으로 바꿨어요.`
              : '사용자 정보를 저장했어요.',
        )
      }
      onSaved()
    } catch (error) {
      showError(error)
      if (isConflict(error)) onSaved()
    } finally {
      setIsSaving(false)
    }
  }

  function confirmInactive() {
    if (!checkDraft()) return
    modal.confirm({
      icon: <WarningOutlined className="text-(--ant-color-warning-text)" />,
      title: `${user.name} 님을 비활성으로 바꿀까요?`,
      content: '바꾸면 다음 화면 이동부터 로그인이 막혀요. 처리 기록은 그대로 남아요.',
      okText: '비활성으로 바꾸기',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: () => save('INACTIVE'),
    })
  }

  const orgField = (
    <label className="flex items-center gap-sm">
      <span className="w-24 shrink-0 text-caption text-(--ant-color-text-secondary)">
        조직 단위 <span className="text-(--ant-color-error-text)">*</span>
      </span>
      <Select
        className="flex-1"
        aria-label="조직 단위"
        placeholder="조직 단위 선택"
        value={draft.orgUnitId}
        onChange={(value) => change({ orgUnitId: value })}
        options={orgOptions}
      />
    </label>
  )

  const areaField = (
    <div className="flex flex-col gap-xs">
      <span className="text-caption text-(--ant-color-text-secondary)">
        담당/열람 영역 <span className="text-(--ant-color-error-text)">*</span>
      </span>
      {draft.areaIds.length > 1 && (
        <Alert
          type="warning"
          showIcon
          title={`영역이 ${draft.areaIds.length}개 설정되어 있어요. 한 개로 정리해야 저장할 수 있어요.`}
        />
      )}
      <Radio.Group
        value={draft.areaIds.length === 0 ? NONE : draft.areaIds.length === 1 ? draft.areaIds[0] : undefined}
        onChange={(event) => change({ areaIds: event.target.value === NONE ? [] : [event.target.value] })}
        options={[...areaOptions, { value: NONE, label: '선택 안 함' }]}
      />
    </div>
  )

  const footer = (
    <div className="flex justify-end gap-xs">
      {isApproval ? (
        <Button disabled>거절</Button>
      ) : isActive ? (
        <Button danger onClick={confirmInactive} disabled={isSaving || !isReady}>
          비활성으로 바꾸기
        </Button>
      ) : (
        <Button onClick={() => void save('ACTIVE')} loading={isSaving} disabled={!isReady}>
          활성으로 바꾸기
        </Button>
      )}
      <Button type="primary" onClick={() => void save()} loading={isSaving} disabled={!isReady}>
        {isApproval ? '승인' : '저장'}
      </Button>
    </div>
  )

  return (
    <Drawer
      open
      title={isApproval ? '승인하기' : '사용자 수정'}
      size={isMobile ? '100%' : 480}
      closable={{ placement: 'end' }}
      onClose={onClose}
      footer={footer}
    >
      <div className="flex flex-col gap-md">
        <div className="flex flex-col gap-xxs rounded-lg bg-(--ant-color-fill-quaternary) px-md py-sm">
          <span className="text-body font-medium">{user.name}</span>
          <span className="text-caption text-(--ant-color-text-secondary)">
            {user.email} · 처음 로그인 {formatDateTime(user.createdAt)}
          </span>
        </div>

        {isApproval && sameNameUsers.length > 0 && (
          <Alert
            type="warning"
            showIcon
            title={`같은 이름의 활성 사용자가 있어요: ${sameNameUsers
              .map((item) => `${item.name}(${item.email}${item.orgUnit ? `, ${item.orgUnit.name}` : ''})`)
              .join(', ')}. 같은 사람인지 확인해 주세요.`}
          />
        )}

        {optionsStatus === 'error' && (
          <Alert
            type="error"
            showIcon
            title="조직 단위와 영역 목록을 불러오지 못했어요."
            action={
              <Button size="small" onClick={onRetryOptions}>
                다시 시도
              </Button>
            }
          />
        )}
        {optionsStatus === 'loading' && <Skeleton active title={false} paragraph={{ rows: 5, width: '100%' }} />}

        {isReady && (
          <div className="flex flex-col gap-xs">
            <span className="text-body font-medium">
              역할 <span className="text-(--ant-color-error-text)">*</span>
            </span>
            <span className="text-caption text-(--ant-color-text-tertiary)">
              여러 개 고를 수 있어요.
            </span>

            <Checkbox checked={draft.assignee} onChange={(event) => change({ assignee: event.target.checked })}>
              담당자
            </Checkbox>
            {draft.assignee && (
              <div className="ml-lg flex flex-col gap-sm">
                {orgField}
                {areaField}
              </div>
            )}

            <Checkbox
              checked={draft.leader}
              onChange={(event) =>
                change(
                  event.target.checked && !draft.orgLeader && draft.areaLeaderIds.length === 0
                    ? { leader: true, orgLeader: true }
                    : { leader: event.target.checked },
                )
              }
            >
              리더
            </Checkbox>
            {draft.leader && (
              <div className="ml-lg flex flex-col gap-sm">
                {orgPlace === 'leader' && orgField}
                <label className="flex items-center gap-sm">
                  <span className="w-24 shrink-0 text-caption text-(--ant-color-text-secondary)">조직 단위 리더</span>
                  <Select
                    className="flex-1"
                    value={draft.orgLeader ? 'org' : NONE}
                    onChange={(value) => change({ orgLeader: value === 'org' })}
                    options={[
                      { value: 'org', label: draft.orgUnitId ? orgUnitName : '소속 조직 단위' },
                      { value: NONE, label: '선택 안 함' },
                    ]}
                  />
                </label>
                <label className="flex items-center gap-sm">
                  <span className="w-24 shrink-0 text-caption text-(--ant-color-text-secondary)">영역 리더</span>
                  <Select
                    className="flex-1"
                    mode="multiple"
                    placeholder="선택 안 함"
                    value={draft.areaLeaderIds}
                    onChange={(values) => change({ areaLeaderIds: values })}
                    options={leaderAreaOptions}
                  />
                </label>
                <span className="text-caption text-(--ant-color-text-tertiary)">
                  영역 리더는 모든 조직의 해당 영역 할 일을 볼 수 있어요.
                </span>
              </div>
            )}

            <Checkbox
              checked={draft.viewer}
              onChange={(event) =>
                change(
                  event.target.checked && draft.viewers.length === 0
                    ? { viewer: true, viewers: [{ target: 'ADMIN', scope: getDefaultViewerScope('ADMIN') }] }
                    : { viewer: event.target.checked },
                )
              }
            >
              열람 전용
              <span className="ml-xs text-caption text-(--ant-color-text-tertiary)">보기만 가능, 처리 권한 없음</span>
            </Checkbox>
            {draft.viewer && (
              <div className="ml-lg flex flex-col gap-sm">
                <div className="flex flex-col gap-xs">
                  <span className="text-caption text-(--ant-color-text-secondary)">볼 수 있는 화면</span>
                  <Checkbox.Group
                    value={viewerTargets}
                    onChange={(values) => changeViewerTargets(values as ViewerTarget[])}
                    options={viewerTargetOptions}
                  />
                </div>
                {orgPlace === 'viewer' && orgField}
                {areaPlace === 'viewer' && areaField}
                {hasOtherRole && (
                  <span className="text-caption text-(--ant-color-warning-text)">
                    다른 역할이 있으면 처리 권한도 같이 가져요.
                  </span>
                )}
              </div>
            )}

            <Checkbox checked={draft.admin} onChange={(event) => change({ admin: event.target.checked })}>
              관리자
            </Checkbox>
          </div>
        )}

        {isReady && areaPlace === 'bottom' && areaField}

        {isReady && keptValues.length > 0 && (
          <div className="flex flex-col gap-xxs rounded-lg bg-(--ant-color-fill-quaternary) px-md py-sm">
            <span className="text-caption text-(--ant-color-text-secondary)">기존 값은 함께 저장돼요</span>
            <span className="text-body">{keptValues.join(', ')}</span>
          </div>
        )}
      </div>
    </Drawer>
  )
}
