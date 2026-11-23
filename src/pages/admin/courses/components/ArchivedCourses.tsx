import { Result } from 'antd'
import { Link } from 'react-router'

// 백엔드 보관 목록과 복원 API 구현되면 연동 예정
/*
import { Breadcrumb, Button, Card, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link } from 'react-router'

import type { ManagedCourse } from '../../../../types/adminCourses'
import { courseOrgUnits } from '../courseManagementMockData'
import PageTitle from '../../../../components/layout/PageTitle'

type ArchivedCoursesProps = {
  courses: ManagedCourse[]
  isMobile: boolean
  onRestore: (course: ManagedCourse) => void
}

const archiveDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function formatArchivedDate(value: string | null) {
  return value ? archiveDateFormatter.format(new Date(value)).replaceAll('-', '.') : '-'
}

export default function ArchivedCourses({ courses, isMobile, onRestore }: ArchivedCoursesProps) {
  const archived = courses.filter((course) => course.archivedAt)
  const restore = (course: ManagedCourse) => (
    <Button type="link" size="small" className="hit-area h-auto p-0 text-caption" onClick={() => onRestore(course)}>
      복원
    </Button>
  )
  const columns: TableColumnsType<ManagedCourse> = [
    { title: '외부 키', dataIndex: 'externalKey', width: 112 },
    { title: '과정명', dataIndex: 'name' },
    {
      title: '조직 단위',
      dataIndex: 'orgUnitId',
      render: (id: string) => courseOrgUnits.find((org) => org.id === id)?.name,
    },
    {
      title: '기간',
      key: 'period',
      render: (_, course) => `${course.startDate.replaceAll('-', '.')} ~ ${course.endDate.replaceAll('-', '.')}`,
    },
    { title: '보관한 날', dataIndex: 'archivedAt', render: formatArchivedDate },
    { title: '보관한 사람', dataIndex: 'archivedBy' },
    { title: '', key: 'restore', render: (_, course) => restore(course) },
  ]

  return (
    <div className="flex flex-col gap-md">
      <div>
        <Breadcrumb
          className="mb-xs text-caption"
          items={[{ title: <Link to="/admin/courses">과정·담당 배정</Link> }, { title: '보관 목록' }]}
        />
        <PageTitle>보관 목록</PageTitle>
        <p className="mt-xxs mb-0 text-caption text-(--ant-color-text-secondary)">
          처리 기록이 있어 삭제 대신 보관한 과정이에요. 복원하면 과정 목록에 다시 나와요.
        </p>
      </div>
      {isMobile ? (
        <div className="flex flex-col gap-sm">
          {archived.length ? (
            archived.map((course) => (
              <Card key={course.id} variant="borderless" className="shadow-none" classNames={{ body: 'p-md' }}>
                <div className="flex items-center justify-between gap-xs">
                  <Link to={`/admin/courses/${course.id}`} className="text-body font-medium text-(--ant-color-text)">
                    {course.name}
                  </Link>
                  {restore(course)}
                </div>
                <p className="my-xs text-caption text-(--ant-color-text-secondary)">
                  {course.externalKey} · {courseOrgUnits.find((org) => org.id === course.orgUnitId)?.name}
                </p>
                <p className="my-xs text-caption">
                  {course.startDate.replaceAll('-', '.')} ~ {course.endDate.replaceAll('-', '.')}
                </p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
                  보관 {formatArchivedDate(course.archivedAt)} · {course.archivedBy}
                </p>
              </Card>
            ))
          ) : (
            <p className="py-xl text-center text-(--ant-color-text-tertiary)">보관된 과정이 없어요.</p>
          )}
        </div>
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
          <Table
            rowKey="id"
            dataSource={archived}
            columns={columns}
            pagination={false}
            size="small"
            rowHoverable={false}
            scroll={{ x: 900 }}
            locale={{ emptyText: '보관된 과정이 없어요.' }}
            classNames={{ header: { cell: 'text-caption font-medium' }, body: { cell: 'px-sm py-xs text-caption' } }}
          />
        </Card>
      )}
    </div>
  )
}
*/

export default function ArchivedCourses() {
  return (
    <Result
      status="info"
      title="보관 목록"
      subTitle="현재 사용할 수 없어요."
      extra={<Link to="/admin/courses">목록으로</Link>}
    />
  )
}
