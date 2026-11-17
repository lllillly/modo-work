import { useCallback, useEffect, useState } from 'react'
import { SearchOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Card, Input, Pagination, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { getAdminUsers } from '../../../../api/users'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { ManagedUser, UserStatus } from '../../../../types/adminUsers'
import type { OptionItem } from '../../../../types/courseApi'
import type { UserRole } from '../../../../types/user'
import { userRoleLabels } from '../../../../types/user'
import { getRoleLabels } from '../usersData'

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
  onEdit: (user: ManagedUser) => void
}

export default function AllUsers({ orgUnits, refreshKey, onEdit }: AllUsersProps) {
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [orgUnitId, setOrgUnitId] = useState(ALL_FILTER)
  const [role, setRole] = useState<UserRole | typeof ALL_FILTER>(ALL_FILTER)
  const [status, setStatus] = useState<UserStatus | typeof ALL_FILTER>(ALL_FILTER)
  const load = useCallback(
    (signal: AbortSignal) =>
      getAdminUsers(
        page,
        {
          q: search,
          orgUnitId: orgUnitId === ALL_FILTER ? undefined : orgUnitId,
          role: role === ALL_FILTER ? undefined : role,
          status: status === ALL_FILTER ? undefined : status,
        },
        signal,
      ),
    [page, search, orgUnitId, role, status],
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

  const columns = [
    { title: '이름', dataIndex: 'name', width: 104 },
    { title: '이메일', dataIndex: 'email', width: 200 },
    {
      title: '조직 단위',
      key: 'orgUnit',
      width: 104,
      render: (_, user) => user.orgUnit?.name ?? '-',
    },
    {
      title: '영역',
      key: 'areas',
      width: 120,
      render: (_, user) => (user.areas.length ? user.areas.map((area) => area.name).join(', ') : '-'),
    },
    {
      title: '역할',
      key: 'roles',
      render: (_, user) => (
        <span className="flex flex-wrap gap-xxs">
          {user.roles.length
            ? getRoleLabels(user).map((item) => (
                <Tag key={item.key} variant="outlined" color={item.color} className="m-0 text-caption">
                  {item.label}
                </Tag>
              ))
            : '-'}
        </span>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      width: 80,
      render: (value: UserStatus) => (
        <Tag variant="outlined" color={statusLabels[value].color} className="m-0 text-caption">
          {statusLabels[value].label}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, user) =>
        user.status === 'PENDING' ? null : (
          <Button type="link" size="small" className="h-auto p-0" onClick={() => onEdit(user)}>
            수정
          </Button>
        ),
    },
  ] satisfies TableColumnsType<ManagedUser>

  const empty = (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-sm py-xl text-center">
      <SearchOutlined className="text-[30px] text-(--ant-color-text-tertiary)" />
      <h3 className="m-0 text-card-title font-medium">
        {hasFilter ? '조건에 맞는 사용자가 없어요' : '아직 사용자가 없어요'}
      </h3>
      {hasFilter && (
        <p className="m-0 text-caption text-(--ant-color-text-secondary)">검색어나 필터를 바꿔 다시 찾아보세요.</p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center gap-xs rounded-lg bg-(--ant-color-bg-container) px-lg py-md">
        <Input
          aria-label="이름·이메일 검색"
          prefix={<SearchOutlined className="text-(--ant-color-text-tertiary)" />}
          placeholder="이름·이메일 검색"
          value={searchText}
          allowClear
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full min-[992px]:w-[240px]"
        />
        <Select
          aria-label="조직 단위 필터"
          popupMatchSelectWidth={false}
          value={orgUnitId}
          onChange={(value) => {
            setOrgUnitId(value)
            setPage(0)
          }}
          options={[
            { value: ALL_FILTER, label: '조직 단위: 전체' },
            ...orgUnits.map((org) => ({ value: org.id, label: org.name })),
          ]}
        />
        <Select
          aria-label="역할 필터"
          popupMatchSelectWidth={false}
          value={role}
          onChange={(value) => {
            setRole(value)
            setPage(0)
          }}
          options={[{ value: ALL_FILTER, label: '역할: 전체' }, ...roleOptions]}
        />
        <Select
          aria-label="상태 필터"
          popupMatchSelectWidth={false}
          value={status}
          onChange={(value) => {
            setStatus(value)
            setPage(0)
          }}
          options={[
            { value: ALL_FILTER, label: '상태: 전체' },
            { value: 'ACTIVE', label: '활성' },
            { value: 'INACTIVE', label: '비활성' },
            { value: 'PENDING', label: '승인 대기' },
          ]}
        />
        <span className="text-caption text-(--ant-color-text-secondary) min-[992px]:ml-auto">
          사용자 {query.isLoading || query.error ? '-' : (query.data?.totalElements ?? 0)}명
        </span>
      </div>

      {query.error ? (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'px-lg py-[48px]' }}>
          <div role="alert" className="flex flex-col items-center gap-sm text-center">
            <WarningOutlined aria-hidden className="text-[36px] text-(--ant-color-error)" />
            <h3 className="m-0 text-card-title font-medium">사용자 목록을 불러오지 못했어요</h3>
            <p className="m-0 text-caption text-(--ant-color-text-secondary)">잠시 후 다시 시도해 주세요.</p>
            <Button className="h-7" onClick={query.reload}>
              다시 시도
            </Button>
          </div>
        </Card>
      ) : query.isLoading ? (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }} aria-busy="true">
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
          <Table<ManagedUser>
            rowKey="id"
            columns={columns}
            dataSource={query.data?.items ?? []}
            pagination={false}
            size="small"
            scroll={{ x: 860 }}
            locale={{ emptyText: empty }}
            rowClassName={(user) => (user.status === 'INACTIVE' ? 'text-(--ant-color-text-tertiary)' : '')}
            classNames={{
              header: { cell: 'text-caption font-medium' },
              body: { cell: 'px-sm py-xs text-caption' },
            }}
          />
        </Card>
      )}
      {!query.isLoading && !query.error && (
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
