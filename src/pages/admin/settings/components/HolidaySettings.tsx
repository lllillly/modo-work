import { useCallback, useState } from 'react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Pen } from 'lucide-react'
import { App, Button, Pagination, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'

import type { Holiday, HolidayRecalculation } from '../../../../types/holidays'
import { isAuthStateError, isConflict } from '../../../../api/client'
import { createHoliday, deleteHoliday, getHolidays, updateHoliday } from '../../../../api/holidays'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import LoadingError from '../../../../components/common/LoadingError'
import EmptyData from '../../../../components/common/EmptyData'
import IconAction from '../../../../components/common/IconAction'
import { smallTableStyle } from '../../../../components/common/tableStyle'
import HolidayModal from './HolidayModal'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import ContentCard from '../../../../components/common/ContentCard'
import { formatDateWithDay } from '../../../../utils/date'

type HolidaySettingsProps = { isMobile: boolean }

const thisYear = dayjs().year()
const yearOptions = [thisYear - 1, thisYear, thisYear + 1].map((year) => ({ value: year, label: `${year}년` }))

function changedMessage(done: string, recalculation: HolidayRecalculation) {
  const changed = recalculation.deadlineChangedTaskCount
  return changed ? `${done} 할 일 ${changed}개의 마감이 바뀌었어요.` : done
}

export default function HolidaySettings({ isMobile }: HolidaySettingsProps) {
  const { modal, message } = App.useApp()
  const { showError } = useApiErrorHandler()
  const [year, setYear] = useState(thisYear)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Holiday | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const load = useCallback(
    (signal: AbortSignal) => getHolidays(`${year}-01-01`, `${year}-12-31`, page, signal),
    [year, page],
  )
  const query = useApiQuery(`${year}:${page}`, load)
  const holidays = query.data?.items ?? []

  function handleError(error: unknown) {
    const conflictText = '같은 날 회사 휴무일이 이미 있거나 다른 사람이 먼저 바꿨어요. 목록을 다시 불러왔어요.'
    showError(error, isConflict(error) ? conflictText : undefined)
    if (!isAuthStateError(error)) query.reload()
  }

  async function save(values: { date: string; name: string }) {
    setSaving(true)
    try {
      if (editing === 'new') {
        const result = await createHoliday(values.date, values.name)
        message.success(changedMessage('회사 휴무일을 추가했어요.', result.recalculation))
      } else if (editing) {
        const changes = {
          ...(values.date !== editing.date && { date: values.date }),
          ...(values.name !== editing.name && { name: values.name }),
        }
        if (Object.keys(changes).length === 0) {
          setEditing(null)
          return
        }
        const result = await updateHoliday(editing.id, editing.version, changes)
        message.success(changedMessage('회사 휴무일을 저장했어요.', result.recalculation))
      }
      setEditing(null)
      query.reload()
    } catch (error) {
      handleError(error)
    } finally {
      setSaving(false)
    }
  }

  function remove(holiday: Holiday) {
    modal.confirm({
      title: '회사 휴무일을 삭제할까요?',
      content: `${formatDateWithDay(holiday.date, true)} ${holiday.name}. 이 날 때문에 앞당겨진 미완료 할 일의 마감을 다시 계산해요.`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          const result = await deleteHoliday(holiday.id, holiday.version)
          message.success(changedMessage('회사 휴무일을 삭제했어요.', result.recalculation))
          if (holidays.length === 1 && page > 0) setPage(page - 1)
          else query.reload()
        } catch (error) {
          handleError(error)
        }
      },
    })
  }

  const sourceTag = (holiday: Holiday) =>
    holiday.source === 'API' ? (
      <Tag variant="filled" className="m-0 text-caption">공휴일</Tag>
    ) : (
      <Tag color="processing" variant="outlined" className="m-0 text-caption">회사 휴무</Tag>
    )

  const actions = (holiday: Holiday) =>
    holiday.source === 'MANUAL' ? (
      <span className="flex items-center justify-end">
        <IconAction label="수정" ariaLabel={`${holiday.name} 수정`} icon={<Pen size="1em" />} onClick={() => setEditing(holiday)} />
        <IconAction label="삭제" ariaLabel={`${holiday.name} 삭제`} icon={<DeleteOutlined />} tone="danger" onClick={() => remove(holiday)} />
      </span>
    ) : (
      <span className="block h-8" />
    )

  const columns: TableColumnsType<Holiday> = [
    { title: '날짜', dataIndex: 'date', width: 160, render: (value: string) => formatDateWithDay(value, true) },
    { title: '구분', key: 'source', width: 104, render: (_, holiday) => sourceTag(holiday) },
    { title: '이름', dataIndex: 'name' },
    { title: '', key: 'actions', width: 88, render: (_, holiday) => actions(holiday) },
  ]

  return (
    <ContentCard>
      <div className="mb-sm flex flex-wrap items-center gap-xs">
        <h2 className="m-0 w-full text-card-title min-[992px]:mr-auto min-[992px]:w-auto">공휴일과 회사 휴무일</h2>
        <Select
          aria-label="연도"
          value={year}
          onChange={(value) => {
            setYear(value)
            setPage(0)
          }}
          options={yearOptions}
          className="w-28"
        />
        <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={() => setEditing('new')} className="max-[991px]:ml-auto">
          {isMobile ? '추가' : '휴무일 추가'}
        </Button>
      </div>
      <p className="mt-0 mb-sm text-caption text-(--ant-color-text-secondary)">
        공휴일은 자동으로 들어와서 수정할 수 없어요. 회사 휴무일을 바꾸면 영향받는 미완료 할 일의 마감을 다시 계산해요.
      </p>

      {query.error ? (
        <LoadingError plain title="휴무일을 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : query.isLoading ? (
        <Skeleton active title={false} paragraph={{ rows: 5, width: '100%' }} />
      ) : isMobile ? (
        holidays.length ? (
          <ul className="m-0 list-none p-0">
            {holidays.map((holiday) => (
              <li
                key={holiday.id}
                className="flex items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm last:border-b-0"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body font-medium">{holiday.name}</span>
                  <span className="flex items-center gap-xs text-caption text-(--ant-color-text-secondary)">
                    {formatDateWithDay(holiday.date, true)} {sourceTag(holiday)}
                  </span>
                </span>
                {actions(holiday)}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyData plain compact title={`${year}년 휴무일이 없어요`} />
        )
      ) : (
        <Table<Holiday>
          rowKey="id"
          columns={columns}
          dataSource={holidays}
          pagination={false}
          size="small"
          rowHoverable={false}
          locale={{ emptyText: <EmptyData plain compact title={`${year}년 휴무일이 없어요`} /> }}
          classNames={smallTableStyle}
        />
      )}

      {!query.isLoading && !query.error && (query.data?.totalElements ?? 0) > PAGE_SIZE && (
        <Pagination
          current={page + 1}
          pageSize={PAGE_SIZE}
          total={query.data?.totalElements ?? 0}
          showSizeChanger={false}
          onChange={(value) => setPage(value - 1)}
          align="end"
          className="mt-sm"
        />
      )}

      {editing && (
        <HolidayModal
          holiday={editing === 'new' ? null : editing}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSave={(values) => void save(values)}
        />
      )}
    </ContentCard>
  )
}
