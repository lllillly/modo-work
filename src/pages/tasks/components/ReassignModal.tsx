import { useCallback, useState } from 'react'
import { Alert, App, Modal, Spin, Tag } from 'antd'

import { isAuthStateError, isConflict } from '../../../api/client'
import { getAssignmentContext, replaceAssignees } from '../../../api/courses'
import useApiQuery from '../../../hooks/useApiQuery'
import useApiErrorHandler from '../../../hooks/useApiErrorHandler'
import type { AssigneeCandidate } from '../../../types/courseApi'

import AssigneeSearch from '../../admin/courses/components/AssigneeSearch'
import LoadingError from '../../../components/common/LoadingError'

type ReassignModalProps = {
  courseId: string
  areaId: string
  orgUnitName: string
  onClose: () => void
  onSaved: () => void
}

export default function ReassignModal({ courseId, areaId, orgUnitName, onClose, onSaved }: ReassignModalProps) {
  const { message } = App.useApp()
  const { showError } = useApiErrorHandler()
  const loadContext = useCallback((signal: AbortSignal) => getAssignmentContext(courseId, signal), [courseId])
  const context = useApiQuery(`assignment-context:${courseId}`, loadContext)
  const [picked, setPicked] = useState<AssigneeCandidate[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const course = context.data?.course
  const area = course?.assignees.find((item) => item.areaId === areaId)
  const activeUsers = area?.users.filter((user) => user.status !== 'INACTIVE') ?? []
  const inactiveUsers = area?.users.filter((user) => user.status === 'INACTIVE') ?? []
  const canReplace = !!context.data?.permissions.canReplaceAssignments && inactiveUsers.length > 0

  async function save() {
    if (!course || !area || picked.length === 0 || isSaving) return
    setIsSaving(true)
    try {
      const assignees = Object.fromEntries(course.assignees.map((item) => [item.areaId, item.userIds]))
      assignees[areaId] = [...activeUsers.map((user) => user.id), ...picked.map((user) => user.id)]
      await replaceAssignees(courseId, course.version, assignees)
      message.success(`${area.areaName ?? '영역'} 담당자를 바꿨어요.`)
      onSaved()
    } catch (error) {
      showError(error, isConflict(error) ? '다른 사람이 먼저 배정을 바꿨어요. 최신 배정을 다시 불러왔어요.' : undefined)
      if (!isAuthStateError(error)) {
        setPicked([])
        context.reload()
      }
    } finally {
      setIsSaving(false)
    }
  }

  let content
  if (context.error) {
    content = <LoadingError plain title="배정 정보를 불러오지 못했어요" error={context.error} onRetry={context.reload} />
  } else if (!course) {
    content = <Spin className="flex justify-center py-lg" aria-label="배정 정보 불러오는 중" />
  } else if (!area || !canReplace) {
    content = <Alert type="info" showIcon title="지금은 이 영역의 담당자를 바꿀 수 없어요. 비활성 담당자가 없거나 종료된 과정이에요." />
  } else {
    content = (
      <div className="flex flex-col gap-md">
        <div>
          <p className="m-0 mb-xs text-caption text-(--ant-color-text-secondary)">{area.areaName} 현재 담당자</p>
          <div className="flex flex-wrap gap-xs">
            {area.users.map((user) => (
              <Tag key={user.id} color={user.status === 'INACTIVE' ? 'warning' : undefined} className="m-0">
                {user.name}{user.status === 'INACTIVE' && ' (비활성)'}
              </Tag>
            ))}
          </div>
        </div>
        <div>
          <p className="m-0 mb-xs text-caption text-(--ant-color-text-secondary)">비활성 담당자 대신 맡을 사람</p>
          <div className="flex flex-wrap items-center gap-xs">
            {picked.map((user) => (
              <Tag
                key={user.id}
                closable={!isSaving}
                onClose={() => setPicked(picked.filter((item) => item.id !== user.id))}
                className="m-0"
              >
                {user.name} <span className="text-(--ant-color-text-tertiary)">{user.email}</span>
              </Tag>
            ))}
            <AssigneeSearch
              businessId={course.businessId}
              orgUnitId={course.orgUnitId}
              orgUnitName={orgUnitName}
              areaId={areaId}
              areaName={area.areaName ?? ''}
              courseId={courseId}
              excludedIds={[...area.userIds, ...picked.map((user) => user.id)]}
              disabled={isSaving}
              onSelect={(user) => setPicked([...picked, user])}
            />
          </div>
        </div>
        <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
          바꾸면 비활성 담당자는 빠지고 미완료 할 일이 새 담당자에게 보여요. 완료 기록은 그대로 남아요.
        </p>
      </div>
    )
  }

  return (
    <Modal
      open
      title="담당자 바꾸기"
      width={500}
      centered
      className="max-w-[calc(100vw-32px)]"
      mask={{ blur: false, closable: !isSaving }}
      destroyOnHidden
      okText="바꾸기"
      cancelText="취소"
      confirmLoading={isSaving}
      okButtonProps={{ disabled: !canReplace || picked.length === 0 }}
      closable={!isSaving}
      cancelButtonProps={{ disabled: isSaving }}
      onOk={save}
      onCancel={onClose}
    >
      {content}
    </Modal>
  )
}
