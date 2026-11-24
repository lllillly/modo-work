import { useCallback, useState } from 'react'
import { RollbackOutlined } from '@ant-design/icons'
import { App, Breadcrumb, Button, Card, Pagination, Skeleton, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate } from 'react-router'

import type { ManagedCourse } from '../../../../types/adminCourses'
import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { getCourses, restoreCourse } from '../../../../api/courses'
import useApiQuery from '../../../../hooks/useApiQuery'
import { useAuth } from '../../../../providers/AuthContext'
import { formatArchivedDate, formatCoursePeriod, toManagedCourse } from '../courseManagementData'
import PageTitle from '../../../../components/layout/PageTitle'
import NoticeCard, { ErrorTriangle } from '../../../../components/common/NoticeCard'
import IconAction from '../../../../components/common/IconAction'

type ArchivedCoursesProps = {
  businessId: string
  isMobile: boolean
}

export default function ArchivedCourses({ businessId, isMobile }: ArchivedCoursesProps) {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const { modal, message } = App.useApp()
  const [page, setPage] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => getCourses(businessId, page, { state: 'archived' }, signal),
    [businessId, page],
  )
  const query = useApiQuery(`${businessId}:archived:${page}`, load)
  const courses = query.data?.items.map(toManagedCourse) ?? []

  function restore(course: ManagedCourse) {
    modal.confirm({
      title: `'${course.name}' 과정을 복원할까요?`,
      content: '과정 목록에 다시 나와요. 아직 끝나지 않은 할 일은 지금 템플릿과 휴일 기준으로 마감을 다시 계산해요.',
      okText: '복원',
      cancelText: '취소',
      onOk: async () => {
        try {
          const result = await restoreCourse(course.id, course.version)
          const changed = result.recalculation.deadlineChangedTaskCount
          message.success(changed ? `과정을 복원했어요. 할 일 ${changed}개의 마감이 바뀌었어요.` : '과정을 복원했어요.')
          navigate('/admin/courses')
        } catch (error) {
          message.error(
            error instanceof ApiError && error.status === 409
              ? '복원하지 못했어요. 사업이나 조직 단위를 지금 쓰지 않거나, 다른 사람이 먼저 바꿨을 수 있어요.'
              : getApiErrorMessage(error),
          )
          if (isAuthStateError(error)) void refreshUser()
          else query.reload()
        }
      },
    })
  }

  const columns: TableColumnsType<ManagedCourse> = [
    { title: '외부 키', dataIndex: 'externalKey', width: 112, responsive: ['xl'] },
    { title: '과정명', dataIndex: 'name' },
    { title: '조직 단위', key: 'orgUnit', render: (_, course) => course.orgUnitName ?? '-' },
    { title: '기간', key: 'period', className: 'whitespace-nowrap', render: (_, course) => formatCoursePeriod(course) },
    { title: '보관한 날', dataIndex: 'archivedAt', width: 104, render: formatArchivedDate },
    {
      title: '',
      key: 'restore',
      width: 48,
      render: (_, course) => (
        <IconAction label="복원" ariaLabel={`${course.name} 복원`} icon={<RollbackOutlined />} tone="primary" onClick={() => restore(course)} />
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-md">
      <div>
        <Breadcrumb
          className="mb-xxs text-caption"
          items={[{ title: <Link to="/admin/courses">과정·담당 배정</Link> }, { title: '보관 목록' }]}
        />
        <PageTitle>보관 목록</PageTitle>
        <p className="m-0 text-caption text-(--ant-color-text-secondary)">
          처리 기록이 있어 삭제 대신 보관한 과정이에요. 복원하면 과정 목록에 다시 나와요.
        </p>
      </div>

      {query.error ? (
        <NoticeCard
          icon={<ErrorTriangle />}
          title="보관 목록을 불러오지 못했어요"
          description={getApiErrorMessage(query.error)}
          action={<Button className="h-7" onClick={query.reload}>다시 시도</Button>}
        />
      ) : query.isLoading ? (
        <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'p-md' : 'p-lg' }} aria-label="보관 목록 불러오는 중" aria-busy="true">
          <Skeleton active title={false} paragraph={{ rows: 5, width: '100%' }} />
        </Card>
      ) : isMobile ? (
        <div className="flex flex-col gap-sm">
          {courses.length ? (
            courses.map((course) => (
              <Card key={course.id} variant="borderless" className="shadow-none" classNames={{ body: 'p-md' }}>
                <div className="flex items-start justify-between gap-xs">
                  <span className="min-w-0 text-body font-medium">{course.name}</span>
                  <IconAction label="복원" ariaLabel={`${course.name} 복원`} icon={<RollbackOutlined />} tone="primary" showLabel onClick={() => restore(course)} />
                </div>
                <p className="m-0 text-caption text-(--ant-color-text-secondary)">
                  {course.externalKey} · {course.orgUnitName ?? '-'}
                </p>
                <p className="m-0 text-caption text-(--ant-color-text-secondary)">{formatCoursePeriod(course)}</p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)">보관 {formatArchivedDate(course.archivedAt)}</p>
              </Card>
            ))
          ) : (
            <Card variant="borderless" className="shadow-none">
              <p className="m-0 py-lg text-center text-caption text-(--ant-color-text-secondary)">보관된 과정이 없어요</p>
            </Card>
          )}
        </div>
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
          <Table<ManagedCourse>
            rowKey="id"
            columns={columns}
            dataSource={courses}
            pagination={false}
            size="small"
            scroll={{ x: 600 }}
            locale={{ emptyText: '보관된 과정이 없어요' }}
            classNames={{ header: { cell: 'text-caption font-medium' }, body: { cell: 'px-sm py-xs text-caption' } }}
          />
        </Card>
      )}

      {!query.isLoading && !query.error && (query.data?.totalElements ?? 0) > 20 && (
        <Pagination
          current={page + 1}
          pageSize={20}
          total={query.data?.totalElements ?? 0}
          showSizeChanger={false}
          onChange={(value) => setPage(value - 1)}
          align="end"
        />
      )}
    </div>
  )
}
