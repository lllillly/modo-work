import { useCallback, useEffect, useState } from 'react'
import { Card, Pagination, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import type { getAdminUsers } from '../../../../api/users'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { ManagedUser, UserStatus } from '../../../../types/adminUsers'
import type { OptionItem } from '../../../../types/courseApi'
import type { UserRole } from '../../../../types/user'
import { userRoleLabels } from '../../../../types/user'
import { getRoleLabels } from '../usersData'
import SearchInput from '../../../../components/common/SearchInput'
import { clickableRowProps } from '../../../../components/common/clickableRow'
import LoadingError from '../../../../components/common/LoadingError'
import NoSearchResult from '../../../../components/common/NoSearchResult'
import EmptyData from '../../../../components/common/EmptyData'
import { smallTableStyle } from '../../../../components/common/tableStyle'
import { formatDateTime } from '../../../../utils/date'

const ALL_FILTER = 'all'
const SEARCH_DELAY = 300

const roleOptions = (Object.keys(userRoleLabels) as UserRole[]).map((role) => ({
  value: role,
  label: userRoleLabels[role],
}))

const statusLabels: Record<UserStatus, { label: string; color: string }> = {
  ACTIVE: { label: '활성', color: 'success' },
  INACTIVE: { label: '비활성', color: 'default' },
  PENDING: { label: '승인 대기', color: 'warning' },
}

type AllUsersProps = {
  orgUnits: OptionItem[]
  refreshKey: number
  loadUsers: typeof getAdminUsers
  editLabel: string
  canEdit: (user: ManagedUser) => boolean
  isMobile: boolean
  onEdit: (user: ManagedUser) => void
}

export default function AllUsers({ orgUnits, refreshKey, loadUsers, editLabel, canEdit, isMobile, onEdit }: AllUsersProps) {
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [orgUnitId, setOrgUnitId] = useState(ALL_FILTER)
  const [role, setRole] = useState<UserRole | typeof ALL_FILTER>(ALL_FILTER)
  const [status, setStatus] = useState<UserStatus | typeof ALL_FILTER>(ALL_FILTER)
  const load = useCallback(
    (signal: AbortSignal) =>
      loadUsers(
        page,
        {
          q: search,
          orgUnitId: orgUnitId === ALL_FILTER ? undefined : orgUnitId,
          role: role === ALL_FILTER ? undefined : role,
          status: status === ALL_FILTER ? undefined : status,
        },
        signal,
      ),
    [loadUsers, page, search, orgUnitId, role, status],
  )
  const query = useApiQuery(`${refreshKey}:${page}:${search}:${orgUnitId}:${role}:${status}`, load)
  const hasFilter = !!search.trim() || orgUnitId !== ALL_FILTER || role !== ALL_FILTER || status !== ALL_FILTER

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText)
      setPage(0)
    }, SEARCH_DELAY)
    return () => clearTimeout(timer)
  }, [searchText])

  const getAreaNames = (user: ManagedUser) =>
    user.areas.length ? user.areas.map((area) => area.name).join(', ') : '영역 없음'

  const renderRoles = (user: ManagedUser) => (
    <span className="flex flex-wrap gap-xxs">
      {user.roles.length
        ? getRoleLabels(user).map((item) => (
            <Tag key={item.key} variant="outlined" color={item.color} className="m-0 text-caption">
              {item.label}
            </Tag>
          ))
        : '-'}
    </span>
  )

  const renderStatus = (value: UserStatus) => (
    <Tag variant="outlined" color={statusLabels[value].color} className="m-0 text-caption">
      {statusLabels[value].label}
    </Tag>
  )

  const getEditProps = (user: ManagedUser) =>
    canEdit(user)
      ? { role: 'button', 'aria-label': `${user.name} ${editLabel}`, ...clickableRowProps(() => onEdit(user)) }
      : {}

  const columns = [
    {
      title: '사용자',
      key: 'user',
      width: 240,
      render: (_, user) => (
        <span className="flex flex-col">
          <span className="font-medium">{user.name}</span>
          <span className="break-all text-(--ant-color-text-secondary)">{user.email}</span>
        </span>
      ),
    },
    {
      title: '소속',
      key: 'belong',
      width: 140,
      className: 'whitespace-nowrap',
      render: (_, user) => (
        <span className="flex flex-col">
          <span>{user.orgUnit?.name ?? '조직 없음'}</span>
          <span className="text-(--ant-color-text-secondary)">{getAreaNames(user)}</span>
        </span>
      ),
    },
    {
      title: '역할',
      key: 'roles',
      className: 'min-w-44',
      render: (_, user) => renderRoles(user),
    },
    {
      title: '등록일',
      dataIndex: 'createdAt',
      width: 110,
      responsive: ['xl'],
      className: 'whitespace-nowrap text-(--ant-color-text-secondary)',
      render: (value: string) => formatDateTime(value).slice(0, 10),
    },
    {
      title: '상태',
      dataIndex: 'status',
      width: 80,
      className: 'whitespace-nowrap',
      render: (_, user) => renderStatus(user.status),
    },
  ] satisfies TableColumnsType<ManagedUser>

  const empty = hasFilter ? <NoSearchResult plain title="조건에 맞는 사용자가 없어요" /> : <EmptyData plain title="아직 사용자가 없어요" />

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center gap-xs rounded-lg bg-(--ant-color-bg-container) p-md min-[992px]:px-lg">
        <SearchInput
          label="이름·이메일 검색"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full min-[992px]:w-[240px]"
        />
        {orgUnits.length > 0 && (
          <Select
            aria-label="조직 단위 필터"
            className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
            popupMatchSelectWidth={false}
            value={orgUnitId}
            onChange={(value) => {
              setOrgUnitId(value)
              setPage(0)
            }}
            options={[
              { value: ALL_FILTER, label: isMobile ? '조직 단위' : '조직 단위: 전체' },
              ...orgUnits.map((org) => ({ value: org.id, label: org.name })),
            ]}
          />
        )}
        <Select
          aria-label="역할 필터"
          className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
          popupMatchSelectWidth={false}
          value={role}
          onChange={(value) => {
            setRole(value)
            setPage(0)
          }}
          options={[{ value: ALL_FILTER, label: isMobile ? '역할' : '역할: 전체' }, ...roleOptions]}
        />
        <Select
          aria-label="상태 필터"
          className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
          popupMatchSelectWidth={false}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
          options={[
            { value: ALL_FILTER, label: isMobile ? '상태' : '상태: 전체' },
            { value: 'ACTIVE', label: '활성' },
            { value: 'INACTIVE', label: '비활성' },
            { value: 'PENDING', label: '승인 대기' },
          ]}
        />
        <span className="hidden text-caption text-(--ant-color-text-secondary) min-[992px]:ml-auto min-[992px]:inline">
          사용자 {query.isLoading || query.error ? '-' : (query.data?.totalElements ?? 0)}명
        </span>
      </div>

      {query.error ? (
        <LoadingError title="사용자 목록을 불러오지 못했어요" onRetry={query.reload} />
      ) : query.isLoading ? (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }} aria-busy="true">
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-xs' : 'p-lg' }}>
          {isMobile ? (
            query.data?.items.length ? (
              <ul className="m-0 list-none p-0">
                {query.data.items.map((user) => (
                  <li
                    key={user.id}
                    {...getEditProps(user)}
                    className={`flex flex-col gap-xxs border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm text-caption last:border-b-0 ${
                      user.status === 'INACTIVE' ? 'text-(--ant-color-text-tertiary)' : ''
                    } ${canEdit(user) ? 'cursor-pointer' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-xs">
                      <span className="flex min-w-0 items-center gap-xs">
                        <span className="text-body font-medium">{user.name}</span>
                        {renderStatus(user.status)}
                      </span>
                      <span className="shrink-0 text-(--ant-color-text-secondary)">
                        {user.orgUnit?.name ?? '조직 없음'}, {getAreaNames(user)}
                      </span>
                    </span>
                    <span className="break-all text-(--ant-color-text-secondary)">{user.email}</span>
                    {renderRoles(user)}
                  </li>
                ))}
              </ul>
            ) : (
              empty
            )
          ) : (
            <Table<ManagedUser>
              rowKey="id"
              columns={columns}
              dataSource={query.data?.items ?? []}
              pagination={false}
              size="small"
              scroll={{ x: 640 }}
              locale={{ emptyText: empty }}
              rowHoverable={false}
              rowClassName={(user) =>
                `${user.status === 'INACTIVE' ? 'text-(--ant-color-text-tertiary)' : ''} ${
                  canEdit(user) ? 'cursor-pointer [&:hover>td]:bg-(--ant-color-fill-alter)!' : ''
                }`
              }
              onRow={(user) => getEditProps(user)}
              classNames={smallTableStyle}
            />
          )}
        </Card>
      )}
      {!query.isLoading && !query.error && (
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
