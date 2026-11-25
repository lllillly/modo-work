import { useCallback, useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Pagination, Spin } from 'antd'

import { getCourseChanges } from '../../../../api/courses'
import { getApiErrorMessage } from '../../../../api/client'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { CourseChangeSource, OptionItem } from '../../../../types/courseApi'
import EmptyData from '../../../../components/common/EmptyData'
import { formatDateTime } from '../../../../utils/date'

type CourseChangesModalProps = {
  courseId: string
  courseName: string
  orgUnits: OptionItem[]
  onClose: () => void
}

type HistoryAssignment = {
  areaId: string
  areaName?: string | null
  users: { name: string; email?: string | null }[]
}

const sourceLabels: Record<CourseChangeSource, string> = {
  COURSE_UPDATE: '과정 정보 수정',
  COURSE_ASSIGNMENTS_UPDATE: '담당 배정 변경',
  COURSE_ENDED_ASSIGNMENTS_UPDATE: '종료 과정 담당자 교체',
  SCHEDULE_UPDATE: '일정 변경',
  END_DATE_CORRECTION: '종료일 정정',
  CSV_IMPORT: 'CSV 변경',
}

const fieldLabels: Record<string, string> = {
  name: '과정명',
  capacity: '정원',
  orgUnitId: '조직 단위',
  startDate: '시작일',
  endDate: '종료일',
  assignees: '담당 배정',
}

function formatValue(field: string, value: unknown, orgUnits: OptionItem[]) {
  if (value === null || value === undefined) return '없음'
  if (field === 'orgUnitId') return orgUnits.find((org) => org.id === value)?.name ?? `조직 ${value}`
  if (field === 'assignees' && Array.isArray(value)) {
    const areas = value as HistoryAssignment[]
    if (!areas.length) return '미배정'
    return areas
      .map((area) => {
        const users = area.users.map((user) => (user.email ? `${user.name} ${user.email}` : user.name))
        return `${area.areaName ?? `영역 ${area.areaId}`}: ${users.length ? users.join(', ') : '미배정'}`
      })
      .join('\n')
  }
  return String(value)
}

export default function CourseChangesModal({ courseId, courseName, orgUnits, onClose }: CourseChangesModalProps) {
  const [page, setPage] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => getCourseChanges(courseId, page, signal),
    [courseId, page],
  )
  const query = useApiQuery(`${courseId}:${page}`, load)

  return (
    <Modal
      open
      title={`변경 이력 · ${courseName}`}
      width={560}
      centered
      footer={null}
      className="max-w-[calc(100vw-32px)]"
      onCancel={onClose}
      mask={{ blur: false }}
      classNames={{ body: 'max-h-[calc(100svh-200px)] overflow-y-auto' }}
    >
      {query.isLoading ? (
        <Spin aria-label="변경 이력 불러오는 중" />
      ) : query.error ? (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(query.error)}
          action={
            <Button size="small" onClick={query.reload}>
              다시 시도
            </Button>
          }
        />
      ) : query.data?.items.length ? (
        query.data.items.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-xs border-0 border-b border-solid
              border-(--ant-color-border-secondary) py-md last:border-b-0"
          >
            <p className="m-0 text-body font-medium">{sourceLabels[entry.source]}</p>
            {entry.changes.map((change) => (
              <div key={change.field} className="flex flex-col gap-xxs">
                <p className="m-0 text-caption text-(--ant-color-text-secondary)">
                  {fieldLabels[change.field] ?? change.field}
                </p>
                <p className="m-0 flex flex-wrap items-start gap-xs break-words text-body text-(--ant-color-primary-text)">
                  <span className="whitespace-pre-line">{formatValue(change.field, change.before, orgUnits)}</span>
                  <ArrowRightOutlined aria-label="에서" className="mt-xxs" />
                  <span className="whitespace-pre-line">{formatValue(change.field, change.after, orgUnits)}</span>
                </p>
              </div>
            ))}
            {entry.reason && <p className="m-0 text-caption">사유: {entry.reason}</p>}
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
              <time dateTime={entry.createdAt}>{formatDateTime(entry.createdAt)}</time> ·{' '}
              {entry.actor?.name ?? '시스템'}
            </p>
          </div>
        ))
      ) : (
        <EmptyData plain compact title="변경 이력이 없어요" />
      )}
      <Pagination
        className="mt-md"
        size="small"
        current={page + 1}
        pageSize={PAGE_SIZE}
        total={query.data?.totalElements ?? 0}
        showSizeChanger={false}
        hideOnSinglePage
        onChange={(value) => setPage(value - 1)}
      />
    </Modal>
  )
}
