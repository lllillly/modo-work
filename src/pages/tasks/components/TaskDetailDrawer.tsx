import { useState } from 'react'
import { ArrowRightOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, App, Button, Drawer, Input, Tag, Timeline } from 'antd'
import { Link } from 'react-router'

import type { AuthUser } from '../../../types/auth'
import type { CourseTasksCourse, CourseTaskView, TaskActionType } from '../../../types/courseTasks'

import { getApiErrorMessage } from '../../../api/client'

import DeadlineTag from '../../home/components/DeadlineTag'
import { getCompletionMemo, getTaskPermissions } from '../courseTasksData'

import DeadlineChange from './DeadlineChange'
import ReassignModal from './ReassignModal'
import { formatDateWithDay, formatShortDateTime } from '../../../utils/date'

type TaskDetailDrawerProps = {
  task: CourseTaskView
  course: CourseTasksCourse
  user: AuthUser
  isMobile: boolean
  onClose: () => void
  onAction: (type: TaskActionType, memo: string) => void | Promise<void>
  isProcessing?: boolean
  onReload?: () => void
  onResolveMismatch?: () => Promise<void>
}

const actionLabels: Record<TaskActionType, string> = {
  COMPLETE: '완료', REVIEW: '확인', CANCEL_COMPLETION: '완료 취소', CANCEL_REVIEW: '확인 취소',
  UPDATE_MEMO: '메모 수정', MEMO: '메모',
}

const sectionClassName = 'mb-md border-0 border-b border-solid border-(--ant-color-border-secondary) pb-md'

export default function TaskDetailDrawer({
  task,
  course,
  user,
  isMobile,
  onClose,
  onAction,
  isProcessing = false,
  onReload,
  onResolveMismatch,
}: TaskDetailDrawerProps) {
  const { modal } = App.useApp()
  const [actionError, setActionError] = useState('')
  const [memo, setMemo] = useState(() => getCompletionMemo(task))
  const [isReassigning, setIsReassigning] = useState(false)

  const permissions = getTaskPermissions(user, course, task)
  const isAdmin = user.roles.some((role) => role.role === 'ADMIN')
  const canReassign = !task.isCompleted && !course.archived && task.assignees.some((assignee) => assignee.status === 'INACTIVE')
    && (isAdmin || (user.roles.some((role) => role.role === 'LEADER') && !!task.server?.canReviewInArea))
  const processingTitle = isAdmin ? '관리자 처리' : permissions.canManage ? '리더 처리' : '내 처리'
  const isAlways = task.referenceType === 'ALWAYS'
  const showMismatch = task.mismatch && permissions.canManage
  const canWriteMemo = permissions.canComplete || permissions.canEditMemo || permissions.canAddMemo

  const phaseName = course.phases.find((phase) => phase.id === task.phaseId)?.name
  const assigneeNames = task.assignees
    .map((assignee) => {
      const statusLabel = assignee.status === 'INACTIVE' ? ' (비활성)' : ''
      return `${assignee.name}${statusLabel}`
    })
    .join(', ')
  const assigneeLabel = task.assignees.length > 1
    ? `${assigneeNames} (공동 담당)`
    : assigneeNames

  const properties: [string, string][] = [['영역', task.areaName]]

  if (!isAlways) {
    properties.push(['단계', phaseName ?? '없음'])
  }
  if (!showMismatch && task.displayText) {
    properties.push(['표기 문구', task.displayText])
  }

  properties.push(
    ['담당자', assigneeLabel],
    ['리더 확인', task.requiresReview ? '필요' : '필요 없음'],
  )

  const cancelledIds = new Set(
    task.actions
      .filter((action) => action.type === 'CANCEL_COMPLETION' || action.type === 'CANCEL_REVIEW')
      .map((action) => action.targetActionId),
  )
  const timelineItems = task.actions.map((action) => {
    const isCancellation = action.type.startsWith('CANCEL')
    const isCancelled = cancelledIds.has(action.id)
    const proxyLabel = action.proxyFor ? ` (${action.proxyFor} 대신)` : ''

    return {
      color: isCancellation ? 'gray' : 'blue',
      content: (
        <div className="text-caption leading-[18px]">
          <p className="m-0 text-caption leading-[18px] font-medium">
            {action.actor.name}{proxyLabel} · {actionLabels[action.type]} {isCancelled && <Tag className="m-0 text-[11px]">취소됨</Tag>}
          </p>
          <p className="mt-xxs mb-0 text-(--ant-color-text-tertiary)">
            {formatShortDateTime(action.createdAt)}
          </p>
          {action.memo && (
            <p className="mt-xxs mb-0 whitespace-pre-wrap break-words text-(--ant-color-text-secondary)">
              "{action.memo}"
            </p>
          )}
        </div>
      ),
    }
  })

  async function resolveMismatch() {
    if (!onResolveMismatch || isProcessing) return
    setActionError('')
    try {
      await onResolveMismatch()
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }

  async function recordAction(type: TaskActionType, content: string) {
    setActionError('')
    try {
      await onAction(type, content)
      setMemo('')
    } catch (error) {
      setActionError(getApiErrorMessage(error))
      throw error
    }
  }

  function submit(type: TaskActionType) {
    if (isProcessing) return
    if (type === 'UPDATE_MEMO' && (!memo.trim() || memo.trim() === getCompletionMemo(task))) return
    if (type === 'CANCEL_COMPLETION' || type === 'CANCEL_REVIEW') {
      modal.confirm({
        title: `${actionLabels[type]}할까요?`, content: '처리 기록은 유지되고 취소 기록이 추가돼요.',
        okText: actionLabels[type], cancelText: '닫기', okButtonProps: { danger: true },
        onOk: () => recordAction(type, ''),
      })
      return
    }
    if (type === 'REVIEW') {
      modal.confirm({
        title: '확인 처리할까요?',
        content: `${task.title} 완료 내용을 확인한 것으로 기록해요.`,
        okText: '확인 처리',
        cancelText: '닫기',
        onOk: () => recordAction('REVIEW', ''),
      })
      return
    }
    void recordAction(type, memo).catch(() => {})
  }

  const actionButtons = (
    <div className="flex flex-wrap gap-xs [&>button]:h-[34px] [&>button]:px-md [&>button]:shadow-none min-[992px]:[&>button]:h-9">
      {permissions.canComplete && (
        <Button
          disabled={isProcessing}
          block
          type={permissions.canManage ? 'default' : 'primary'}
          onClick={() => submit('COMPLETE')}
        >
          {permissions.canManage ? '담당자 대신 완료' : '완료로 기록'}
        </Button>
      )}
      {permissions.canEditMemo && (
        <Button
          block={isMobile}
          disabled={isProcessing || !memo.trim() || memo.trim() === getCompletionMemo(task)}
          onClick={() => submit('UPDATE_MEMO')}
        >
          메모 저장
        </Button>
      )}
      {permissions.canAddMemo && (
        <Button
          type="primary"
          block
          onClick={() => submit('MEMO')}
          disabled={isProcessing || !memo.trim()}
        >
          메모 남기기
        </Button>
      )}
      {permissions.canReview && (
        <Button
          disabled={isProcessing}
          type="primary"
          className="min-w-0 flex-1"
          onClick={() => submit('REVIEW')}
        >
          확인
        </Button>
      )}
      {permissions.canCancelReview && (
        <Button disabled={isProcessing} danger onClick={() => submit('CANCEL_REVIEW')}>
          확인 취소
        </Button>
      )}
      {permissions.canCancelCompletion && (
        <Button disabled={isProcessing} danger onClick={() => submit('CANCEL_COMPLETION')}>
          완료 취소
        </Button>
      )}
    </div>
  )

  const hasActions = permissions.canComplete || permissions.canEditMemo || permissions.canAddMemo || permissions.canReview || permissions.canCancelReview || permissions.canCancelCompletion

  return (
    <Drawer
      open placement="right" size={isMobile ? '100%' : 440} onClose={onClose} closable={false}
      mask={{ closable: true, blur: false }} destroyOnHidden
      classNames={{ header: 'border-0 px-md pt-lg pb-0 min-[992px]:px-lg', body: `px-md pb-lg min-[992px]:px-lg ${showMismatch ? 'pt-0' : 'pt-md'}`, footer: 'px-md pt-sm pb-md' }}
      title={
        <div className="border-0 border-b border-solid border-(--ant-color-border-secondary) pb-sm min-[992px]:pb-xs">
          <div className="mb-sm flex items-center justify-between gap-xs">
            <span className="text-caption leading-[18px] font-regular text-(--ant-color-text-tertiary)">{course.businessName} · {course.name}</span>
            <Button type="text" icon={<CloseOutlined />} aria-label="할 일 상세 닫기" onClick={onClose} className="h-5 w-5 min-w-0 shrink-0 gap-xxs p-0 text-caption leading-[18px] font-regular min-[992px]:w-auto">{!isMobile && '닫기'}</Button>
          </div>
          <h2 className="m-0 flex items-center gap-xs text-section-title-lg">
            {task.title}{task.isCompleted && <DeadlineTag task={task} showReviewStatus={task.requiresReview} />}
          </h2>
        </div>
      }
      footer={isMobile && hasActions ? actionButtons : undefined}
    >
      {actionError && <Alert type="error" showIcon title={actionError} className="mb-md"
        action={onReload && <Button onClick={onReload}>최신 내용 불러오기</Button>} />}
      {showMismatch && task.mismatch && (
        <div className="mb-md border-0 border-b border-solid border-(--ant-color-border-secondary) pb-sm">
          <Alert type="warning" className="p-2.5"
            title={
              <span className="flex items-center justify-between gap-xs">
                완료 뒤에 할 일 기준이 바뀌었어요
                {onResolveMismatch && (
                  <Button size="small" disabled={isProcessing} onClick={() => void resolveMismatch()}
                    className="shrink-0 px-xs text-caption shadow-none">
                    확인 완료
                  </Button>
                )}
              </span>
            } classNames={{ title: 'mb-xxs text-caption leading-[18px] font-medium', description: 'text-caption leading-[18px]' }}
            description={
              <>
                {task.mismatch.changes.length > 0 && (
                  <ul className="m-0 mb-xxs list-none p-0">
                    {task.mismatch.changes.map((change, index) => (
                      <li key={`${change.label}:${index}`}>
                        {change.label}: {change.before} <ArrowRightOutlined aria-label="에서" /> {change.after}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="m-0">
                  {task.mismatch.reason}으로 변경되었어요. 완료 기록은 그대로예요. 변경 사항을 확인했다면 확인 완료를 눌러 주세요.
                </p>
              </>
            } />
        </div>
      )}

      <section className={sectionClassName}>
        <h3 className="m-0 mb-xs text-body leading-5 font-bold">마감</h3>
        {isAlways ? <p className="m-0 text-body">마감 없음</p> : (
          <>
            <div className="flex flex-wrap items-center gap-xs">
              {task.isCompleted && task.reviewStatus !== 'pending' ? <Tag className="m-0">완료</Tag> : <DeadlineTag task={{ ...task, isCompleted: false }} />}
              {task.dueDate && <span className="text-body font-medium">{formatDateWithDay(task.dueDate, true)}</span>}
            </div>
            <p className="mt-xs mb-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
              기준: {task.referenceType === 'MONTH_END' ? '주기 종료일' : task.referenceType === 'COURSE_END' ? '과정 종료일' : '과정 시작일'} {task.offsetDays !== null && <>{task.offsetDays >= 0 ? '+' : '-'} {Math.abs(task.offsetDays)}일</>}
            </p>
            {task.rawDueDate !== task.dueDate && task.rawDueDate && task.dueDate && (
              <p className="mt-xs mb-0 leading-4">
                <DeadlineChange rawDueDate={task.rawDueDate} dueDate={task.dueDate} shiftReasons={task.shiftReasons} />
              </p>
            )}
          </>
        )}
      </section>

      <section className={sectionClassName}>
        <h3 className="m-0 mb-xs text-body leading-5 font-bold">속성</h3>
        <dl className="m-0 grid grid-cols-[80px_minmax(0,1fr)] gap-x-sm gap-y-xs text-body leading-5">
          {properties.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-(--ant-color-text-tertiary)">{label}</dt>
              <dd className="m-0 break-words font-medium">{value || '미배정'}</dd>
            </div>
          ))}
        </dl>
        {canReassign && (
          <p className="mt-sm mb-0 flex flex-wrap items-center gap-xs text-caption text-(--ant-color-warning-text)">
            <WarningOutlined aria-hidden /> 비활성 담당자가 있어요.
            <Button size="small" onClick={() => setIsReassigning(true)}>담당자 바꾸기</Button>
          </p>
        )}
      </section>

      <section className={sectionClassName}>
        <h3 className="m-0 mb-xs text-body leading-5 font-bold">처리 기록</h3>
        {task.actions.length === 0 ? <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">{isAlways ? '아직 메모가 없어요.' : '아직 완료 기록이 없어요.'}</p> : (
          <Timeline
            variant="filled" className="mb-0"
            classNames={{ itemIcon: 'size-2!', itemWrapper: 'gap-2.5!', itemRail: 'hidden' }}
            items={timelineItems}
          />
        )}
      </section>

      <section className={isMobile ? '' : sectionClassName}>
        <h3 className="m-0 mb-sm text-body leading-5 font-bold min-[992px]:mb-xs">{processingTitle}</h3>
        {canWriteMemo && (
          <div className="mb-xs">
            <label htmlFor="task-action-memo" className="mb-xs block text-caption leading-[18px] font-medium">처리 메모</label>
            <Input.TextArea id="task-action-memo" readOnly={isProcessing} aria-describedby="task-memo-help" value={memo} onChange={(event) => setMemo(event.target.value)}
              maxLength={500} rows={3} placeholder="처리 내용을 남겨 주세요" className="h-16 min-h-16 resize-none min-[992px]:h-18 min-[992px]:min-h-18" />
            <div id="task-memo-help" className={isMobile ? 'sr-only' : 'mt-xs flex items-start justify-between gap-xs text-caption leading-[18px] text-(--ant-color-text-tertiary)'}>
              <span>이름과 연락처 같은 개인정보는 적지 마세요.</span><span className="shrink-0">{memo.length} / 500</span>
            </div>
          </div>
        )}
        {!isMobile && hasActions && actionButtons}
        <p className={isMobile ? 'sr-only' : 'mt-xs mb-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)'}>
          {permissions.canComplete ? permissions.canManage ? `처리 기록에 "${user.name} (${task.assignees.map((assignee) => assignee.name).join(', ')} 대신)"으로 남아요.` : '같은 영역 담당자 중 한 명만 완료하면 완료돼요.'
            : permissions.canReview ? '완료를 취소하면 할 일이 미완료로 돌아가고 취소 기록이 남아요.'
            : permissions.canCancelReview ? '확인 취소는 관리자만 할 수 있어요. 취소해도 기록은 지워지지 않아요.'
            : task.isCompleted && permissions.isMyArea ? '완료는 리더나 관리자만 취소할 수 있어요. 잘못 완료했다면 리더에게 알려 주세요.'
            : permissions.canAddMemo ? '상시 업무는 완료 처리 없이 메모를 남겨요.' : '이 할 일은 보기만 가능해요.'}
        </p>
      </section>

      {task.documents.length > 0 && (
        <section>
          <h3 className="m-0 mb-xs text-body leading-5 font-bold">연결 문서</h3>
          <div className="flex flex-wrap gap-xs">
            {task.documents.map((document) => (
              <Link key={document.id} to={`/documents/${document.id}`}>
                <Button size="small" className="h-[30px]">{document.title}</Button>
              </Link>
            ))}
          </div>
        </section>
      )}
      {isReassigning && (
        <ReassignModal
          courseId={course.id}
          areaId={task.areaId}
          orgUnitName={course.orgUnit.name}
          onClose={() => setIsReassigning(false)}
          onSaved={() => {
            setIsReassigning(false)
            onReload?.()
          }}
        />
      )}
    </Drawer>
  )
}
