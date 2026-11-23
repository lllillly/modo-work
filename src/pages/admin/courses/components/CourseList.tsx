import { useCallback, useEffect, useState } from 'react'
import { InboxOutlined, MoreOutlined, PlusOutlined, SearchOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Dropdown, Grid, Pagination, Select, Skeleton, Table, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'

import type { ManagedCourse } from '../../../../types/adminCourses'
import type { CourseProgressStatus } from '../../../../types/courseApi'
import { getOrgUnitName, toManagedCourse } from '../courseManagementData'
import { getAssignmentAreas, getCourses } from '../../../../api/courses'
import useApiQuery from '../../../../hooks/useApiQuery'
import useMediaQuery from '../../../../hooks/useMediaQuery'
import { useAuth } from '../../../../providers/AuthContext'
import PageHeader from '../../../../components/layout/PageHeader'
import { AssignmentStatus, CourseLengthTag, CourseStateTag } from './CourseLabels'
import SearchInput from '../../../../components/common/SearchInput'
import IconAction from '../../../../components/common/IconAction'
import FilterChip from '../../../../components/common/FilterChip'
import { clickableRowProps } from '../../../../components/common/clickableRow'

const ALL_FILTER = 'all'
const SEARCH_DELAY = 300
const SELECT_PADDING = 48
const MAX_SELECT_WIDTH = 280

function getSelectWidth(labels: string[], font: string) {
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return undefined
  context.font = font
  const textWidth = Math.max(...labels.map((label) => context.measureText(label).width))
  return Math.min(Math.ceil(textWidth) + SELECT_PADDING, MAX_SELECT_WIDTH)
}

const progressOptions: { value: CourseProgressStatus; label: string }[] = [
  { value: 'UPCOMING', label: '예정' },
  { value: 'ONGOING', label: '진행 중' },
  { value: 'ENDED', label: '종료' },
]

type CourseListProps = {
  businessId: string
  isMobile: boolean
}

export default function CourseList({ businessId, isMobile }: CourseListProps) {
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isWide = screens.xl ?? true
  const isWidest = useMediaQuery('(min-width: 1366px)')
  const { token } = theme.useToken()
  const selectFont = `${token.fontSize}px ${token.fontFamily}`
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [orgUnitId, setOrgUnitId] = useState(ALL_FILTER)
  const [progressStatus, setProgressStatus] = useState<CourseProgressStatus | typeof ALL_FILTER>(ALL_FILTER)
  const [needsAssignment, setNeedsAssignment] = useState(false)
  const load = useCallback(
    (signal: AbortSignal) =>
      getCourses(
        businessId,
        page,
        {
          q: search,
          orgUnitId: orgUnitId === ALL_FILTER ? undefined : orgUnitId,
          progressStatus: progressStatus === ALL_FILTER ? undefined : progressStatus,
          needsAssignmentReview: needsAssignment,
        },
        signal,
      ),
    [businessId, page, search, orgUnitId, progressStatus, needsAssignment],
  )
  const loadOrgs = useCallback(
    (signal: AbortSignal) => getAssignmentAreas(businessId, signal),
    [businessId],
  )
  const query = useApiQuery(
    `${businessId}:${page}:${search}:${orgUnitId}:${progressStatus}:${needsAssignment}`,
    load,
  )
  const orgs = useApiQuery(businessId, loadOrgs)
  const preview = params.get('preview')
  const isLoading = query.isLoading || preview === 'loading'
  const isError = !!query.error || preview === 'error'
  const activeCourses = query.data?.items.map(toManagedCourse) ?? []
  const visibleCourses = preview === 'empty' ? [] : activeCourses
  const courseOrgUnits = orgs.data?.orgUnits ?? []
  const orgOptions = [
    { value: ALL_FILTER, label: isMobile ? '조직 단위' : '조직 단위: 전체' },
    ...courseOrgUnits.map((org) => ({ value: org.id, label: org.name })),
  ]
  const statusOptions = [{ value: ALL_FILTER, label: isMobile ? '상태' : '상태: 전체' }, ...progressOptions]
  const hasFilter = !!search.trim() || orgUnitId !== ALL_FILTER || progressStatus !== ALL_FILTER || needsAssignment

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText)
      setPage(0)
    }, SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [searchText])

  const columns = [
    ...(isWide ? [{ title: '외부 키', dataIndex: 'externalKey', width: 112 }] : []),
    { title: '과정명', dataIndex: 'name', width: isWide ? 144 : 160 },
    {
      title: '조직 단위',
      dataIndex: 'orgUnitId',
      width: 94,
      className: 'whitespace-nowrap',
      responsive: ['xl'],
      render: (_, course) => course.orgUnitName ?? getOrgUnitName(course.orgUnitId, courseOrgUnits, user) ?? '-',
    },
    {
      title: '기간',
      key: 'period',
      width: 180,
      render: (_, course) => (
        <span className="whitespace-nowrap">
          {course.startDate.replaceAll('-', '.')} ~ {course.endDate.replaceAll('-', '.')}
        </span>
      ),
    },
    ...(isWidest
      ? [
          { title: '구분', key: 'length', width: 64, render: (_: unknown, course: ManagedCourse) => <CourseLengthTag {...course} /> },
          {
            title: '정원',
            dataIndex: 'capacity',
            width: 52,
            render: (capacity: number | null) => capacity ?? '-',
          },
        ]
      : []),
    {
      title: '담당 배정',
      key: 'assignees',
      width: 150,
      render: (_, course) => (
        <AssignmentStatus course={course} requiredAreaIds={orgs.data?.requiredAreaIds} />
      ),
    },
    { title: '상태', key: 'state', width: 76, render: (_, course) => <CourseStateTag course={course} /> },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, course) =>
        course.isReadOnly ? <span className="block h-8" /> : (
          <span className="flex items-center" onClick={(event) => event.stopPropagation()}>
            <IconAction label="보관" ariaLabel={`${course.name} 보관`} icon={<InboxOutlined />} disabled />
          </span>
        ),
    },
  ] satisfies TableColumnsType<ManagedCourse>

  const actions = isMobile ? (
    <>
      <Button icon={<InboxOutlined aria-hidden />} aria-label="보관 목록" onClick={() => navigate('archived')} disabled />
      <Button icon={<UploadOutlined aria-hidden />} aria-label="CSV로 가져오기" onClick={() => navigate('import')} />
      <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
        과정 추가
      </Button>
    </>
  ) : (
    <>
      <Button icon={<InboxOutlined aria-hidden />} onClick={() => navigate('archived')} disabled>
        보관 목록
      </Button>
      <Button icon={<UploadOutlined aria-hidden />} onClick={() => navigate('import')}>
        CSV로 가져오기
      </Button>
      <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
        과정 추가
      </Button>
    </>
  )

  const empty = hasFilter ? (
    <div
      className="flex min-h-[260px] flex-col items-center justify-center gap-sm py-xl
      text-center"
    >
      <SearchOutlined className="text-[30px] text-(--ant-color-text-tertiary)" />
      <h3 className="m-0 text-card-title font-medium">조건에 맞는 과정이 없어요</h3>
      <p className="m-0 text-caption text-(--ant-color-text-secondary)">
        검색어나 필터를 바꿔 다시 찾아보세요.
      </p>
    </div>
  ) : (
    <div
      className="flex min-h-[260px] flex-col items-center justify-center gap-sm py-xl
      text-center"
    >
      <InboxOutlined className="text-[30px] text-(--ant-color-text-tertiary)" />
      <h3 className="m-0 text-card-title font-medium">아직 등록된 과정이 없어요</h3>
      <p className="m-0 text-caption text-(--ant-color-text-secondary)">
        과정을 하나씩 추가하거나 CSV 파일로 한 번에 가져올 수 있어요.
      </p>
      <div className="flex gap-xs">
        <Button icon={<UploadOutlined aria-hidden />} onClick={() => navigate('import')}>
          CSV로 가져오기
        </Button>
        <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
          과정 추가
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="과정·담당 배정"
        description="과정을 등록하고 영역별 담당자를 배정해요. 일정을 바꾸면 미완료 할 일을 다시 계산해요."
        actions={actions}
      />
      <div
        className={`flex flex-wrap items-center gap-xs ${
          isMobile ? '' : 'rounded-lg bg-(--ant-color-bg-container) px-lg py-md'
        }`}
      >
        <SearchInput
          label="과정명·외부 키 검색"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full min-[992px]:w-[280px]"
        />
        <Select
          aria-label="조직 단위 필터"
          style={{ width: getSelectWidth(orgOptions.map((option) => option.label), selectFont) }}
          popupMatchSelectWidth={false}
          value={orgUnitId}
          onChange={(value) => {
            setOrgUnitId(value)
            setPage(0)
          }}
          options={orgOptions}
        />
        <Select
          aria-label="과정 상태 필터"
          style={{ width: getSelectWidth(statusOptions.map((option) => option.label), selectFont) }}
          popupMatchSelectWidth={false}
          value={progressStatus}
          onChange={(value) => {
            setProgressStatus(value)
            setPage(0)
          }}
          options={statusOptions}
        />
        {isMobile ? (
          <FilterChip
            selected={needsAssignment}
            onClick={() => {
              setNeedsAssignment(!needsAssignment)
              setPage(0)
            }}
          >
            확인 필요
          </FilterChip>
        ) : (
          <Checkbox
            checked={needsAssignment}
            onChange={(event) => {
              setNeedsAssignment(event.target.checked)
              setPage(0)
            }}
          >
            배정 확인 필요한 것만 보기
          </Checkbox>
        )}
        <span className="hidden text-caption text-(--ant-color-text-secondary) min-[992px]:ml-auto min-[992px]:inline">
          과정 {isLoading || isError ? '-' : (query.data?.totalElements ?? 0)}개
        </span>
      </div>

      {!!orgs.error && (
        <Alert
          type="warning"
          showIcon
          title="조직·배정 정보를 불러오지 못했어요."
          action={<Button onClick={orgs.reload}>다시 시도</Button>}
        />
      )}
      {isError ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: 'px-lg py-[48px]' }}
        >
          <div
            role="alert"
            className="flex flex-col items-center gap-sm text-center"
          >
            <WarningOutlined aria-hidden className="text-[36px] text-(--ant-color-error-text)" />
            <h3 className="m-0 text-card-title font-medium leading-[normal]">
              과정 목록을 불러오지 못했어요
            </h3>
            <p className="m-0 text-[13px] leading-[normal] text-(--ant-color-text-secondary)">
              잠시 후 다시 시도해 주세요. 새로고침해도 안 되면 조금 뒤에 다시 들어와 주세요.
            </p>
            <Button
              className="h-7"
              onClick={() => {
                const next = new URLSearchParams(params)
                next.delete('preview')
                setParams(next, { replace: true })
                query.reload()
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
              scroll={{ x: isWidest ? 1030 : isWide ? 840 : 640 }}
              classNames={{
                header: { cell: 'text-caption font-medium' },
                body: { cell: 'px-sm py-xs text-caption' },
              }}
            />
          )}
        </Card>
      ) : isMobile ? (
        visibleCourses.length ? (
          <div className="flex flex-col gap-sm">
            {visibleCourses.map((course) => {
              const isEnded = course.isReadOnly

              return (
                <div key={course.id} className="relative rounded-lg bg-(--ant-color-bg-container)">
                  <Link
                    to={course.id}
                    className="flex w-full flex-col items-start rounded-lg p-md text-left
                      text-(--ant-color-text) hover:bg-(--ant-color-fill-quaternary)"
                  >
                    <span
                      className="flex w-full items-center justify-between gap-xs pr-xl"
                    >
                      <span className="min-w-0 text-body font-medium">{course.name}</span>
                    </span>
                    <span className="text-caption text-(--ant-color-text-secondary)">
                      {course.externalKey} ·{' '}
                      {course.orgUnitName ?? getOrgUnitName(course.orgUnitId, courseOrgUnits, user) ?? '-'} · 정원{' '}
                      {course.capacity ?? '-'}
                    </span>
                    <span
                      className="flex flex-wrap items-center gap-xs text-caption
                      text-(--ant-color-text-secondary)"
                    >
                      {course.startDate.replaceAll('-', '.')} ~ {course.endDate.replaceAll('-', '.')}
                      <CourseLengthTag {...course} />
                    </span>
                    <span className="flex w-full items-center justify-between gap-xs">
                      <AssignmentStatus course={course} requiredAreaIds={orgs.data?.requiredAreaIds} />
                      <CourseStateTag course={course} />
                    </span>
                  </Link>
                  {!isEnded && (
                    <Dropdown
                      trigger={['click']}
                      placement="bottomRight"
                      autoFocus
                      menu={{
                        items: [{ key: 'archive', label: '보관', icon: <InboxOutlined />, disabled: true }],
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
            scroll={{ x: isWidest ? 1030 : isWide ? 840 : 640 }}
            locale={{ emptyText: empty }}
            onRow={(course) => ({ ...clickableRowProps(() => navigate(course.id)), className: 'cursor-pointer' })}
            classNames={{
              header: { cell: 'text-caption font-medium' },
              body: { cell: 'px-sm py-xs text-caption' },
            }}
          />
        </Card>
      )}
      {!isLoading && !isError && (
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
