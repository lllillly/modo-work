import { useCallback, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { ArrowDownOutlined, ArrowUpOutlined, HolderOutlined, PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { App, Button, Card, Input, Select, Skeleton, Switch, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { addListItem, deleteListItem, getListItems, updateListItem } from '../../../../api/listManagement'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../../layouts/AppLayout'
import { useAuth } from '../../../../providers/AuthContext'
import type { ListItem, ListItemInput, ListKind } from '../../../../types/listManagement'

type ListRow = ListItem & { key: string; isNew?: boolean }

const listKinds: { key: ListKind; label: string; note: string }[] = [
  { key: 'businesses', label: '사업 구분', note: '숨긴 사업은 사업 선택 목록에서 빠져요. 기존 과정과 문서는 그대로예요.' },
  {
    key: 'areas',
    label: '업무 영역',
    note: '다른 영역 보기를 켜면 이 영역 담당자가 같은 과정의 다른 영역 현황을 볼 수 있어요(보기만).',
  },
  { key: 'orgUnits', label: '조직 단위', note: '숨긴 조직은 새로 등록할 때 고를 수 없어요. 폐쇄 조직은 숨겨도 폐쇄 상태가 그대로예요.' },
  { key: 'documentTypes', label: '문서 종류', note: '숨긴 종류는 문서를 올릴 때 고를 수 없어요. 이미 올린 문서는 그대로예요.' },
]

const toRows = (items: ListItem[]): ListRow[] => items.map((item) => ({ ...item, key: item.id }))

function keepUnsaved(items: ListItem[], unsaved: ListRow[]): ListRow[] {
  const edited = new Map(unsaved.filter((row) => !row.isNew).map((row) => [row.id, row]))
  const rows = toRows(items).map((row) => {
    const mine = edited.get(row.id)
    if (!mine) return row
    const { name, sortOrder, isActive, allowCrossAreaView } = mine
    return { ...row, name, sortOrder, isActive, allowCrossAreaView }
  })
  return [...rows.sort((a, b) => a.sortOrder - b.sortOrder), ...unsaved.filter((row) => row.isNew)]
}

function getUsage(row: ListRow) {
  if (row.isNew) return '새 항목'
  const counts = [
    row.courseCount ? `과정 ${row.courseCount}개` : '',
    row.userCount ? `사용자 ${row.userCount}명` : '',
    row.documentCount ? `문서 ${row.documentCount}개` : '',
  ].filter(Boolean)
  if (counts.length) return counts.join(', ')
  return row.isInUse ? '기록만' : '사용 안 함'
}

function isChanged(row: ListRow, original: ListItem | undefined) {
  return (
    !original ||
    row.name.trim() !== original.name ||
    row.sortOrder !== original.sortOrder ||
    row.isActive !== original.isActive ||
    row.allowCrossAreaView !== original.allowCrossAreaView
  )
}

export default function ListManagement({ isMobile }: { isMobile: boolean }) {
  const { message, modal } = App.useApp()
  const { refreshUser } = useAuth()
  const { reloadBusinesses } = useOutletContext<AppLayoutContext>()
  const [kind, setKind] = useState<ListKind>('businesses')
  const [refreshKey, setRefreshKey] = useState(0)
  const [draft, setDraft] = useState<{ source?: ListItem[]; rows: ListRow[]; reordered: boolean }>({
    rows: [],
    reordered: false,
  })
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [newCount, setNewCount] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [unsaved, setUnsaved] = useState<{ kind: ListKind; rows: ListRow[] } | null>(null)
  const saving = useRef(false)

  const loadLists = useCallback(async (signal: AbortSignal) => {
    const lists = await Promise.all(listKinds.map(({ key }) => getListItems(key, signal)))
    return Object.fromEntries(listKinds.map(({ key }, index) => [key, lists[index].items])) as Record<ListKind, ListItem[]>
  }, [])
  const query = useApiQuery(`list-management:${refreshKey}`, loadLists)
  const source = query.data?.[kind]
  if (source && source !== draft.source) {
    const kept = unsaved?.kind === kind ? unsaved.rows : []
    setDraft({ source, rows: kept.length ? keepUnsaved(source, kept) : toRows(source), reordered: false })
    if (unsaved) setUnsaved(null)
  }

  const current = listKinds.find((item) => item.key === kind) ?? listKinds[0]
  const rows = draft.rows
  const originals = new Map((source ?? []).map((item) => [item.id, item]))
  const savedRows = rows.map((row, index) => ({ ...row, sortOrder: draft.reordered ? index : row.sortOrder }))
  const isDirty =
    savedRows.length !== originals.size || savedRows.some((row) => isChanged(row, originals.get(row.id)))
  const names = rows.map((row) => row.name.trim())
  const invalidKeys = new Set(
    rows
      .filter((_, index) => !names[index] || names.indexOf(names[index]) !== index)
      .map((row) => row.key),
  )

  function updateRow(key: string, change: Partial<ListRow>) {
    setDraft((value) => ({ ...value, rows: value.rows.map((row) => (row.key === key ? { ...row, ...change } : row)) }))
  }

  function moveRow(fromKey: string | null, toIndex: number) {
    const fromIndex = rows.findIndex((row) => row.key === fromKey)
    if (fromIndex < 0 || toIndex < 0 || toIndex >= rows.length || fromIndex === toIndex) return
    const next = [...rows]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setDraft((value) => ({ ...value, rows: next, reordered: true }))
  }

  function addRow() {
    const sortOrder = Math.max(-1, ...rows.map((row) => row.sortOrder)) + 1
    setNewCount((count) => count + 1)
    setDraft((value) => ({
      ...value,
      rows: [
        ...value.rows,
        {
          key: `new-${newCount}`,
          id: '',
          name: '',
          sortOrder,
          isActive: true,
          version: 0,
          isInUse: false,
          allowCrossAreaView: kind === 'areas' ? false : undefined,
          isNew: true,
        },
      ],
    }))
  }

  function changeKind(next: ListKind) {
    if (next === kind) return
    if (!isDirty) {
      setKind(next)
      return
    }
    modal.confirm({
      title: '저장하지 않은 변경이 있어요',
      content: '다른 목록으로 이동하면 지금 고친 내용은 사라져요.',
      okText: '이동',
      cancelText: '취소',
      onOk: () => setKind(next),
    })
  }

  function reload() {
    setRefreshKey((key) => key + 1)
    if (kind === 'businesses') reloadBusinesses()
  }

  function handleError(error: unknown) {
    message.error(getApiErrorMessage(error))
    if (isAuthStateError(error)) void refreshUser()
  }

  async function save() {
    if (saving.current || !isDirty) return
    if (invalidKeys.size > 0) {
      message.warning('이름을 1~100자로, 다른 항목과 겹치지 않게 입력해 주세요.')
      return
    }
    saving.current = true
    setIsSaving(true)
    const changedRows = savedRows.filter((row) => isChanged(row, originals.get(row.id)))
    let saved = 0
    try {
      for (const row of changedRows) {
        const input: ListItemInput = { name: row.name.trim(), sortOrder: row.sortOrder, isActive: row.isActive }
        if (kind === 'areas') input.allowCrossAreaView = row.allowCrossAreaView ?? false
        if (row.isNew) await addListItem(kind, input)
        else await updateListItem(kind, row.id, { ...input, version: row.version })
        saved += 1
      }
      message.success(`${current.label} 목록을 저장했어요.`)
    } catch (error) {
      setUnsaved({ kind, rows: changedRows.slice(saved) })
      message.error(
        `${getApiErrorMessage(error)} ${saved > 0 ? `${saved}건은 저장했어요. ` : ''}저장하지 못한 입력은 그대로 남아있어요. 확인하고 다시 저장해 주세요.`,
      )
      if (isAuthStateError(error)) void refreshUser()
    } finally {
      saving.current = false
      setIsSaving(false)
      reload()
    }
  }

  function remove(row: ListRow) {
    if (row.isNew) {
      setDraft((value) => ({ ...value, rows: value.rows.filter((item) => item.key !== row.key) }))
      return
    }
    modal.confirm({
      title: `${current.label} 삭제`,
      content: `'${originals.get(row.id)?.name ?? row.name}' 항목을 삭제할까요? 삭제하면 되돌릴 수 없어요.${isDirty ? ' 저장하지 않은 변경도 사라져요.' : ''}`,
      okText: '삭제',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          await deleteListItem(kind, row.id, row.version)
          message.success('항목을 삭제했어요.')
        } catch (error) {
          handleError(error)
        } finally {
          reload()
        }
      },
    })
  }

  const renderName = (row: ListRow) => (
    <span className="flex items-center gap-xs">
      <Input
        aria-label={`${current.label} 이름`}
        value={row.name}
        maxLength={100}
        status={invalidKeys.has(row.key) ? 'error' : undefined}
        placeholder="이름을 입력해 주세요"
        onChange={(event) => updateRow(row.key, { name: event.target.value })}
      />
      {row.isClosed && <Tag className="m-0 shrink-0">폐쇄</Tag>}
    </span>
  )

  const renderCrossView = (row: ListRow) => (
    <Switch
      aria-label={`${row.name} 다른 영역 보기`}
      size={isMobile ? 'small' : 'medium'}
      checked={row.allowCrossAreaView}
      onChange={(checked) => updateRow(row.key, { allowCrossAreaView: checked })}
    />
  )

  const renderHidden = (row: ListRow) => (
    <Switch
      aria-label={`${row.name} 숨김`}
      size={isMobile ? 'small' : 'medium'}
      checked={!row.isActive}
      onChange={(checked) => updateRow(row.key, { isActive: !checked })}
    />
  )

  const renderDelete = (row: ListRow) =>
    row.isInUse ? (
      <span className="text-(--ant-color-text-tertiary)" title="사용 중이라 삭제 대신 숨김만 할 수 있어요">-</span>
    ) : (
      <Button type="link" size="small" className="h-auto p-0 text-(--ant-color-text-secondary)" onClick={() => remove(row)}>
        삭제
      </Button>
    )

  const columns: TableColumnsType<ListRow> = [
    {
      title: '순서',
      key: 'order',
      width: 56,
      render: (_, row, index) => (
        <Button
          type="text"
          size="small"
          draggable
          icon={<HolderOutlined aria-hidden />}
          aria-label={`${row.name || '새 항목'} 순서 바꾸기, 위아래 화살표로 이동`}
          className="cursor-grab text-(--ant-color-text-tertiary)"
          onDragStart={() => setDragKey(row.key)}
          onDragEnd={() => setDragKey(null)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
              event.preventDefault()
              moveRow(row.key, index + (event.key === 'ArrowUp' ? -1 : 1))
            }
          }}
        />
      ),
    },
    {
      title: '이름',
      key: 'name',
      width: 280,
      render: (_, row) => renderName(row),
    },
    { title: '사용 중', key: 'usage', className: 'whitespace-nowrap', render: (_, row) => getUsage(row) },
    ...(kind === 'areas'
      ? [
          {
            title: '다른 영역 보기',
            key: 'crossView',
            width: 120,
            render: (_: unknown, row: ListRow) => renderCrossView(row),
          },
          {
            title: '부재 대리 (2차)',
            key: 'delegation',
            width: 120,
            render: () => <Switch aria-label="부재 대리, 2차에 지원 예정" disabled />,
          },
        ]
      : []),
    {
      title: '숨김',
      key: 'hidden',
      width: 80,
      render: (_, row) => renderHidden(row),
    },
    {
      title: <span className="sr-only">삭제</span>,
      key: 'delete',
      width: 64,
      render: (_, row) => renderDelete(row),
    },
  ]

  if (query.error) {
    return (
      <Card variant="borderless" className="shadow-none" classNames={{ body: 'px-lg py-[48px]' }}>
        <div role="alert" className="flex flex-col items-center gap-sm text-center">
          <WarningOutlined aria-hidden className="text-[36px] text-(--ant-color-error)" />
          <h3 className="m-0 text-card-title font-medium">목록을 불러오지 못했어요</h3>
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">{getApiErrorMessage(query.error)}</p>
          <Button className="h-7" onClick={query.reload}>
            다시 시도
          </Button>
        </div>
      </Card>
    )
  }

  if (!query.data) {
    return (
      <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }} aria-busy="true">
        <Skeleton active title={false} paragraph={{ rows: 4, width: '100%' }} />
      </Card>
    )
  }

  const lists = query.data
  const kindMenu = isMobile ? (
    <Select
      aria-label="목록 종류"
      value={kind}
      onChange={changeKind}
      options={[
        ...listKinds.map((item) => ({ value: item.key, label: `${item.label} ${lists[item.key].length}개` })),
        { value: 'noticeTypes', label: '공지 유형 (준비 중)', disabled: true },
      ]}
    />
  ) : (
    <Card variant="borderless" className="w-60 shrink-0 self-start shadow-none" classNames={{ body: 'p-0' }}>
      <nav aria-label="목록 종류" className="flex flex-col py-xs">
        {listKinds.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-current={item.key === kind ? 'true' : undefined}
            onClick={() => changeKind(item.key)}
            className={`flex cursor-pointer items-center justify-between border-0 px-md py-sm text-left text-body ${
              item.key === kind
                ? 'bg-(--ant-color-primary-bg) text-(--ant-color-primary)'
                : 'bg-transparent text-(--ant-color-text) hover:bg-(--ant-color-fill-tertiary)'
            }`}
          >
            {item.label}
            <span className="text-caption text-(--ant-color-text-tertiary)">{lists[item.key].length}개</span>
          </button>
        ))}
        <span className="flex items-center justify-between px-md py-sm text-body text-(--ant-color-text-disabled)">
          공지 유형
          <span className="text-caption">준비 중</span>
        </span>
      </nav>
    </Card>
  )

  return (
    <div className="flex flex-col gap-md min-[992px]:flex-row">
      {kindMenu}
      <Card variant="borderless" className="min-w-0 flex-1 shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
        <div className="mb-xs flex items-center justify-between gap-sm">
          <h3 className="m-0 text-card-title">{current.label}</h3>
          <Button icon={<PlusOutlined />} className="h-7" onClick={addRow}>
            항목 추가
          </Button>
        </div>
        <p className="mt-0 mb-sm text-caption text-(--ant-color-text-secondary)">
          이름과 순서를 바꾸고, 쓰지 않는 항목은 숨겨요. 사용 중인 항목은 지울 수 없어요.
        </p>
        {isMobile ? (
          <ul className="m-0 flex list-none flex-col gap-xs p-0">
            {rows.length === 0 && (
              <li className="py-md text-center text-caption text-(--ant-color-text-tertiary)">
                항목이 없어요. 항목 추가로 만들어 주세요.
              </li>
            )}
            {rows.map((row, index) => (
              <li
                key={row.key}
                className={`flex flex-col gap-xs rounded-lg bg-(--ant-color-fill-quaternary) p-sm text-caption ${
                  row.isActive ? '' : 'text-(--ant-color-text-tertiary)'
                }`}
              >
                <span className="flex items-center gap-xxs">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined aria-hidden />}
                    aria-label={`${row.name || '새 항목'} 위로 옮기기`}
                    disabled={index === 0}
                    onClick={() => moveRow(row.key, index - 1)}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined aria-hidden />}
                    aria-label={`${row.name || '새 항목'} 아래로 옮기기`}
                    disabled={index === rows.length - 1}
                    onClick={() => moveRow(row.key, index + 1)}
                  />
                  <span className="ml-xxs min-w-0 flex-1">{renderName(row)}</span>
                  {!row.isInUse && <span className="ml-xs shrink-0">{renderDelete(row)}</span>}
                </span>
                <span className="flex flex-wrap items-center gap-x-md gap-y-xs">
                  <span className="text-(--ant-color-text-tertiary)">{getUsage(row)}</span>
                  <span className="ml-auto flex items-center gap-md">
                    {kind === 'areas' && (
                      <span className="flex items-center gap-xs">
                        다른 영역 보기
                        {renderCrossView(row)}
                      </span>
                    )}
                    <span className="flex items-center gap-xs">
                      숨김
                      {renderHidden(row)}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Table<ListRow>
            rowKey="key"
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="small"
            scroll={{ x: kind === 'areas' ? 820 : 580 }}
            locale={{ emptyText: '항목이 없어요. 항목 추가로 만들어 주세요.' }}
            rowClassName={(row) => (row.isActive ? '' : '[&>td]:text-(--ant-color-text-tertiary)')}
            onRow={(row, index) => ({
              className: dragKey === row.key ? 'opacity-50' : undefined,
              onDragOver: (event) => event.preventDefault(),
              onDrop: () => moveRow(dragKey, index ?? 0),
            })}
            classNames={{
              header: { cell: 'text-caption font-medium' },
              body: { cell: 'px-sm py-xs text-caption' },
            }}
          />
        )}
        <p className="mt-sm mb-md text-caption text-(--ant-color-text-secondary)">{current.note}</p>
        <div className="flex justify-end">
          <Button type="primary" disabled={!isDirty} loading={isSaving} onClick={() => void save()}>
            저장
          </Button>
        </div>
      </Card>
    </div>
  )
}
