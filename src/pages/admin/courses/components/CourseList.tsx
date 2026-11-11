import { useState } from 'react'
import { InboxOutlined, MoreOutlined, PlusOutlined, SearchOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Dropdown, Input, Select, Skeleton, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'

import type { ManagedCourse } from '../../../../types/adminCourses'
import { getAssignmentIssues, getCourseState } from '../courseManagementData'
import { courseOrgUnits } from '../courseManagementMockData'
import { AssignmentStatus, CourseLengthTag, CourseStateTag } from './CourseLabels'

type CourseListProps = {
  courses: ManagedCourse[]
  isMobile: boolean
  onArchive: (course: ManagedCourse) => void
}

export default function CourseList({ courses, isMobile, onArchive }: CourseListProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [orgUnitId, setOrgUnitId] = useState('all')
  const [state, setState] = useState('all')
  const [needsAssignment, setNeedsAssignment] = useState(false)

  const preview = params.get('preview')
  const isLoading = preview === 'loading'
  const isError = preview === 'error'
  const activeCourses = preview === 'empty' ? [] : courses.filter((course) => !course.archivedAt)
  const visibleCourses = activeCourses.filter((course) => {
    const matchesSearch = `${course.name} ${course.externalKey}`.toLowerCase().includes(search.trim().toLowerCase())
    const issues = getAssignmentIssues(course.assignees)
    return (
      matchesSearch &&
      (orgUnitId === 'all' || course.orgUnitId === orgUnitId) &&
      (state === 'all' || getCourseState(course) === state) &&
      (!needsAssignment || issues.empty > 0 || issues.inactive > 0)
    )
  })

  function resetFilters() {
    setSearch('')
    setOrgUnitId('all')
    setState('all')
    setNeedsAssignment(false)
  }

  const columns = [
    { title: '외부 키', dataIndex: 'externalKey', width: 112 },
    { title: '과정명', dataIndex: 'name', width: 144 },
    {
      title: '조직 단위',
      dataIndex: 'orgUnitId',
      width: 94,
      render: (id: string) => courseOrgUnits.find((org) => org.id === id)?.name,
    },
    {
      title: '기간',
      key: 'period',
      width: 184,
      render: (_, course) => `${course.startDate.replaceAll('-', '.')} ~ ${course.endDate.replaceAll('-', '.')}`,
    },
    { title: '구분', key: 'length', width: 64, render: (_, course) => <CourseLengthTag {...course} /> },
    { title: '정원', dataIndex: 'capacity', width: 52, render: (capacity: number | null) => capacity ?? '-' },
    { title: '담당 배정', key: 'assignees', width: 190, render: (_, course) => <AssignmentStatus course={course} /> },
    { title: '상태', key: 'state', width: 82, render: (_, course) => <CourseStateTag course={course} /> },
    {
      title: '',
      key: 'actions',
      width: 90,
      render: (_, course) =>
        getCourseState(course) === '종료' ? (
          <Link to={course.id}>보기</Link>
        ) : (
          <span className="flex items-center gap-xs">
            <Link to={course.id}>수정</Link>
            <Button
              type="text"
              size="small"
              className="h-auto p-0 text-caption text-(--ant-color-text-secondary)"
              onClick={() => onArchive(course)}
            >
              보관
            </Button>
          </span>
        ),
    },
  ] satisfies TableColumnsType<ManagedCourse>

  const actions = (
    <div className="flex gap-xs">
      <Button
        icon={<InboxOutlined aria-hidden />}
        onClick={() => navigate('archived')}
        className={isMobile ? 'order-3' : ''}
      >
        {isMobile ? '보관' : '보관 목록'}
      </Button>
      <Button
        icon={<UploadOutlined aria-hidden />}
        onClick={() => navigate('import')}
        className={isMobile ? 'order-2' : ''}
      >
        {isMobile ? 'CSV' : 'CSV로 가져오기'}
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined aria-hidden />}
        onClick={() => navigate('new')}
        className={isMobile ? 'order-1 flex-1' : ''}
      >
        과정 추가
      </Button>
    </div>
  )

  const empty = (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-sm py-xl text-center">
      <InboxOutlined className="text-[30px] text-(--ant-color-text-tertiary)" />
      <h3 className="m-0 text-card-title font-medium">
        {activeCourses.length ? '조건에 맞는 과정이 없어요' : '아직 등록된 과정이 없어요'}
      </h3>
      <p className="m-0 text-caption text-(--ant-color-text-secondary)">
        {activeCourses.length
          ? '검색어나 필터를 바꿔 다시 확인해 주세요.'
          : '과정을 하나씩 추가하거나, CSV 파일로 한 번에 가져올 수 있어요.'}
      </p>
      {activeCourses.length ? (
        <Button onClick={resetFilters}>필터 초기화</Button>
      ) : (
        <div className="flex gap-xs">
          <Button icon={<UploadOutlined aria-hidden />} onClick={() => navigate('import')}>
            CSV로 가져오기
          </Button>
          <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
            과정 추가
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col gap-sm min-[992px]:flex-row min-[992px]:items-center min-[992px]:justify-between">
        <div>
          <h2 className="m-0 text-section-title">과정·담당 배정</h2>
          {!isMobile && (
            <p className="m-0 text-caption text-(--ant-color-text-secondary)">
              과정을 등록하고 영역별 담당자를 배정해요. 저장하면 할 일과 마감이 다시 계산돼요.
            </p>
          )}
        </div>
        {actions}
      </div>
      <div
        className={`flex flex-wrap items-center gap-xs ${isMobile ? '' : 'rounded-lg bg-(--ant-color-bg-container) px-lg py-md'}`}
      >
        <Input
          aria-label="과정명·외부 키 검색"
          prefix={<SearchOutlined className="text-(--ant-color-text-tertiary)" />}
          placeholder="과정명·외부 키 검색"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full min-[992px]:w-[280px]"
        />
        <Select
          aria-label="조직 단위 필터"
          value={orgUnitId}
          onChange={setOrgUnitId}
          size={isMobile ? 'small' : 'middle'}
          options={[
            { value: 'all', label: isMobile ? '조직 단위' : '조직 단위: 전체' },
            ...courseOrgUnits.map((org) => ({ value: org.id, label: org.name })),
          ]}
        />
        <Select
          aria-label="과정 상태 필터"
          value={state}
          onChange={setState}
          size={isMobile ? 'small' : 'middle'}
          options={[
            { value: 'all', label: isMobile ? '상태' : '상태: 전체' },
            ...['예정', '진행 중', '종료'].map((label) => ({ value: label, label })),
          ]}
        />
        {isMobile ? (
          <Button
            size="small"
            shape="round"
            color={needsAssignment ? 'primary' : 'default'}
            variant="outlined"
            aria-pressed={needsAssignment}
            onClick={() => setNeedsAssignment(!needsAssignment)}
          >
            확인 필요
          </Button>
        ) : (
          <Checkbox checked={needsAssignment} onChange={(event) => setNeedsAssignment(event.target.checked)}>
            배정 확인 필요한 것만 보기
          </Checkbox>
        )}
        <span className="text-caption text-(--ant-color-text-secondary) min-[992px]:ml-auto">
          과정 {isLoading || isError ? '-' : visibleCourses.length}개
        </span>
      </div>

      {isError ? (
        <Card variant="borderless" className="shadow-none">
          <div role="alert" className="flex min-h-[215px] flex-col items-center justify-center gap-sm text-center">
            <WarningOutlined className="text-[30px] text-(--ant-color-error)" />
            <h3 className="m-0 text-card-title font-medium">과정 목록을 불러오지 못했어요</h3>
            <p className="m-0 text-caption text-(--ant-color-text-secondary)">
              잠시 후 다시 시도해 주세요. 새로고침해도 안 되면 조금 뒤에 다시 들어와 주세요.
            </p>
            <Button
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('preview')
                setParams(next, { replace: true })
              }}
            >
              다시 시도
            </Button>
          </div>
        </Card>
      ) : isLoading ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: isMobile ? 'p-md' : 'p-lg' }}
          aria-label="과정 목록 불러오는 중"
          aria-busy="true"
        >
          {isMobile ? (
            <div className="flex flex-col gap-md">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} active title={false} paragraph={{ rows: 1, width: '100%' }} />
              ))}
            </div>
          ) : (
            <Table
              rowKey="id"
              dataSource={Array.from({ length: 5 }, (_, id) => ({ id }))}
              columns={columns.map((column, index) => ({
                title: column.title,
                key: index,
                width: column.width,
                render: () => <Skeleton active title={false} paragraph={{ rows: 1, width: '80%' }} />,
              }))}
              pagination={false}
              size="small"
              rowHoverable={false}
              scroll={{ x: 1030 }}
              classNames={{ header: { cell: 'text-caption font-medium' }, body: { cell: 'px-sm py-xs text-caption' } }}
            />
          )}
        </Card>
      ) : isMobile ? (
        visibleCourses.length ? (
          <div className="flex flex-col gap-sm">
            {visibleCourses.map((course) => {
              const isEnded = getCourseState(course) === '종료'

              return (
                <div key={course.id} className="relative rounded-lg bg-(--ant-color-bg-container)">
                  <Link
                    to={course.id}
                    className="flex w-full flex-col items-start rounded-lg p-md text-left text-(--ant-color-text) hover:bg-(--ant-color-fill-quaternary)"
                  >
                    <span className={`flex w-full items-center justify-between gap-xs ${isEnded ? '' : 'pr-xl'}`}>
                      <span className="min-w-0 text-body font-medium">{course.name}</span>
                      <CourseStateTag course={course} />
                    </span>
                    <span className="text-caption text-(--ant-color-text-secondary)">
                      {course.externalKey} · {courseOrgUnits.find((org) => org.id === course.orgUnitId)?.name} · 정원{' '}
                      {course.capacity ?? '-'}
                    </span>
                    <span className="flex flex-wrap items-center gap-xs text-caption text-(--ant-color-text-secondary)">
                      {course.startDate.replaceAll('-', '.')} ~ {course.endDate.replaceAll('-', '.')}
                      <CourseLengthTag {...course} />
                    </span>
                    <AssignmentStatus course={course} />
                  </Link>
                  {!isEnded && (
                    <Dropdown
                      trigger={['click']}
                      placement="bottomRight"
                      autoFocus
                      menu={{
                        items: [{ key: 'archive', label: '보관', icon: <InboxOutlined /> }],
                        onClick: () => onArchive(course),
                      }}
                    >
                      <Button
                        type="text"
                        icon={<MoreOutlined />}
                        aria-label={`${course.name} 작업 메뉴`}
                        aria-haspopup="menu"
                        className="absolute top-xs right-xs h-10 w-10"
                      />
                    </Dropdown>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <Card variant="borderless" className="shadow-none">
            {empty}
          </Card>
        )
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
          <Table<ManagedCourse>
            rowKey="id"
            columns={columns}
            dataSource={visibleCourses}
            pagination={false}
            size="small"
            rowHoverable={false}
            scroll={{ x: 1030 }}
            locale={{ emptyText: empty }}
            classNames={{ header: { cell: 'text-caption font-medium' }, body: { cell: 'px-sm py-xs text-caption' } }}
          />
        </Card>
      )}
    </div>
  )
}
