import { useCallback } from 'react'
import { DeleteOutlined, InboxOutlined, MoreOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Checkbox, Dropdown, Grid, Pagination, Select, Skeleton, Table, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'

import type { ManagedCourse } from '../../../../types/adminCourses'
import type { CourseProgressStatus } from '../../../../types/courseApi'
import { formatCoursePeriod, getOrgUnitName, toManagedCourse } from '../courseManagementData'
import { isAuthStateError, isConflict } from '../../../../api/client'
import { deleteCourse, getAssignmentAreas, getCourses } from '../../../../api/courses'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import usePageInRange from '../../../../hooks/usePageInRange'
import useMediaQuery from '../../../../hooks/useMediaQuery'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import useSearchDraft from '../../../../hooks/useSearchDraft'
import useUrlFilters from '../../../../hooks/useUrlFilters'
import { useAuth } from '../../../../providers/AuthContext'
import PageHeader from '../../../../components/layout/PageHeader'
import { AssignmentStatus, CourseLengthTag, CourseStateTag } from './CourseLabels'
import SearchInput from '../../../../components/common/SearchInput'
import IconAction from '../../../../components/common/IconAction'
import FilterChip from '../../../../components/common/FilterChip'
import { clickableRowProps } from '../../../../components/common/clickableRow'
import EmptyData from '../../../../components/common/EmptyData'
import LoadingError from '../../../../components/common/LoadingError'
import NoSearchResult from '../../../../components/common/NoSearchResult'
import { smallTableStyle } from '../../../../components/common/tableStyle'

const ALL_FILTER = 'all'
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
  const { showError } = useApiErrorHandler()
  const { modal, message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const { getFilter, getPage, setFilters } = useUrlFilters()
  const page = getPage()
  const search = getFilter('q')
  const orgUnitId = getFilter('orgUnitId', ALL_FILTER)
  const progressStatus = getFilter('status', ALL_FILTER) as CourseProgressStatus | typeof ALL_FILTER
  const needsAssignment = getFilter('review') === 'true'
  const [searchText, setSearchText] = useSearchDraft(search, (value) => setFilters({ q: value, page: null }))

  function setPage(value: number) {
    setFilters({ page: value > 0 ? String(value + 1) : null })
  }
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
  usePageInRange(page, query.data?.totalPages, setPage)
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

  function removeCourse(course: ManagedCourse) {
    modal.confirm({
      title: `'${course.name}' 과정을 삭제할까요?`,
      content: '완료, 확인, 메모 같은 처리 기록이 있으면 삭제하지 않고 보관해요. 처리 기록이 없으면 과정과 할 일이 모두 지워지고 되돌릴 수 없어요.',
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          const result = await deleteCourse(course.id, course.version)
          message.success(
            result.disposition === 'ARCHIVED'
              ? '처리 기록이 있어 과정을 보관했어요. 보관 목록에서 복원할 수 있어요.'
              : '과정을 삭제했어요.',
          )
          if (visibleCourses.length === 1 && page > 0) setPage(page - 1)
          else query.reload()
        } catch (error) {
          const conflictText = '다른 사람이 먼저 바꿨거나 이미 보관된 과정이에요. 목록을 다시 불러왔어요.'
          showError(error, isConflict(error) ? conflictText : undefined)
          if (!isAuthStateError(error)) query.reload()
        }
      },
    })
  }

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
          {formatCoursePeriod(course)}
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
      render: (_, course) => (
        <span className="flex items-center" onClick={(event) => event.stopPropagation()}>
          <IconAction label="삭제" ariaLabel={`${course.name} 삭제`} icon={<DeleteOutlined />} tone="danger" onClick={() => removeCourse(course)} />
        </span>
      ),
    },
  ] satisfies TableColumnsType<ManagedCourse>

  const actions = isMobile ? (
    <>
      <Button icon={<InboxOutlined aria-hidden />} aria-label="보관 목록" onClick={() => navigate('archived')} />
      <Button icon={<UploadOutlined aria-hidden />} aria-label="CSV로 가져오기" onClick={() => navigate('import')} />
      <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
        과정 추가
      </Button>
    </>
  ) : (
    <>
      <Button icon={<InboxOutlined aria-hidden />} onClick={() => navigate('archived')}>
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
    <NoSearchResult plain title="조건에 맞는 과정이 없어요" />
  ) : (
    <EmptyData
      plain
      title="아직 등록된 과정이 없어요"
      description="과정을 하나씩 추가하거나 CSV 파일로 한 번에 가져올 수 있어요."
      action={
        <div className="flex gap-xs">
          <Button icon={<UploadOutlined aria-hidden />} onClick={() => navigate('import')}>
            CSV로 가져오기
          </Button>
          <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => navigate('new')}>
            과정 추가
          </Button>
        </div>
      }
    />
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
          onChange={(value) => setFilters({ orgUnitId: value === ALL_FILTER ? null : value, page: null })}
          options={orgOptions}
        />
        <Select
          aria-label="과정 상태 필터"
          style={{ width: getSelectWidth(statusOptions.map((option) => option.label), selectFont) }}
          popupMatchSelectWidth={false}
          value={progressStatus}
          onChange={(value) => setFilters({ status: value === ALL_FILTER ? null : value, page: null })}
          options={statusOptions}
        />
        {isMobile ? (
          <FilterChip
            selected={needsAssignment}
            onClick={() => setFilters({ review: needsAssignment ? null : 'true', page: null })}
          >
            확인 필요
          </FilterChip>
        ) : (
          <Checkbox
            checked={needsAssignment}
            onChange={(event) => setFilters({ review: event.target.checked ? 'true' : null, page: null })}
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
        <LoadingError
          title="과정 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요. 새로고침해도 안 되면 조금 뒤에 다시 들어와 주세요."
          onRetry={() => {
            const next = new URLSearchParams(params)
            next.delete('preview')
            setParams(next, { replace: true })
            query.reload()
          }}
        />
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
              classNames={smallTableStyle}
            />
          )}
        </Card>
      ) : isMobile ? (
        visibleCourses.length ? (
          <div className="flex flex-col gap-sm">
            {visibleCourses.map((course) => (
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
                    {formatCoursePeriod(course)}
                    <CourseLengthTag {...course} />
                  </span>
                  <span className="flex w-full items-center justify-between gap-xs">
                    <AssignmentStatus course={course} requiredAreaIds={orgs.data?.requiredAreaIds} />
                    <CourseStateTag course={course} />
                  </span>
                </Link>
                <Dropdown
                  trigger={['click']}
                  placement="bottomRight"
                  autoFocus
                  menu={{
                    items: [{ key: 'delete', label: '삭제', icon: <DeleteOutlined />, danger: true }],
                    onClick: () => removeCourse(course),
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
              </div>
            ))}
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
            classNames={smallTableStyle}
          />
        </Card>
      )}
      {!isLoading && !isError && (
        <Pagination
          current={page + 1}
          pageSize={PAGE_SIZE}
          total={query.data?.totalElements ?? 0}
          showSizeChanger={false}
          onChange={(value) => setPage(value - 1)}
          align="end"
        />
      )}
    </div>
  )
}
