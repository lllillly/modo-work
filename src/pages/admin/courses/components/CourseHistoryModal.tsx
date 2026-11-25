import { useCallback, useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Pagination, Spin } from 'antd'

import { getScheduleChanges } from '../../../../api/courses'
import { getApiErrorMessage } from '../../../../api/client'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import EmptyData from '../../../../components/common/EmptyData'
import { formatDateTime } from '../../../../utils/date'

type CourseHistoryModalProps = { courseId: string; courseName: string; onClose: () => void }

export default function CourseHistoryModal({ courseId, courseName, onClose }: CourseHistoryModalProps) {
  const [page, setPage] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => getScheduleChanges(courseId, page, signal),
    [courseId, page],
  )
  const query = useApiQuery(`${courseId}:${page}`, load)

  return (
    <Modal
      open
      title={`일정 변경 이력 · ${courseName}`}
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
            <p className="m-0 text-body font-medium">
              {entry.source === 'END_DATE_CORRECTION'
                ? '종료일 정정'
                : entry.source === 'CSV_IMPORT'
                  ? 'CSV 일정 변경'
                  : '일정 변경'}
            </p>
            <p className="m-0 break-words text-body text-(--ant-color-primary-text)">
              {entry.before.startDate} ~ {entry.before.endDate} <ArrowRightOutlined aria-label="에서" />{' '}
              {entry.after.startDate} ~ {entry.after.endDate}
            </p>
            {entry.reason && <p className="m-0 text-caption">사유: {entry.reason}</p>}
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
              {formatDateTime(entry.createdAt)} · {entry.actor.name}
            </p>
          </div>
        ))
      ) : (
        <EmptyData plain compact title="일정 변경 이력이 없어요" />
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
