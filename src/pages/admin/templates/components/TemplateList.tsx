import { useCallback, useState } from 'react'
import { PlusOutlined, RightOutlined, TagsOutlined } from '@ant-design/icons'
import { App, Button, Card, Grid, Select, Skeleton, Switch, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { isAuthStateError } from '../../../../api/client'
import { getCourseOptions } from '../../../../api/courses'
import { getTaskTemplates, updateTaskTemplate } from '../../../../api/taskTemplates'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { ReferenceType, TaskTemplate } from '../../../../types/taskTemplate'
import PageHeader from '../../../../components/layout/PageHeader'
import { describeDeadline, groupByPhase, referenceLabels, TURN_OFF_NOTICE } from '../templatesData'
import TagManager from './TagManager'
import SearchInput from '../../../../components/common/SearchInput'
import { clickableRowProps } from '../../../../components/common/clickableRow'
import NoSearchResult from '../../../../components/common/NoSearchResult'
import LoadingError from '../../../../components/common/LoadingError'
import { smallTableStyle } from '../../../../components/common/tableStyle'
import EmptyData from '../../../../components/common/EmptyData'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'

type TemplateRow =
  | { kind: 'group'; key: string; phase: string; isAlways: boolean; count: number }
  | (TaskTemplate & { kind: 'item'; key: string })

type StateFilter = 'active' | 'inactive' | 'all'

const ALL = 'all'

type TemplateListProps = { businessId: string; isMobile: boolean }

export default function TemplateList({ businessId, isMobile }: TemplateListProps) {
  const { message, modal } = App.useApp()
  const { showError } = useApiErrorHandler()
  const navigate = useNavigate()
  const isWide = Grid.useBreakpoint().xl ?? true
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const areaId = params.get('area') ?? ALL
  const reference = (params.get('reference') ?? ALL) as ReferenceType | typeof ALL
  const state = (params.get('state') ?? 'active') as StateFilter
  const [savingId, setSavingId] = useState<string | null>(null)
  const [showTags, setShowTags] = useState(false)

  function setFilter(name: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(params)
    if (value === defaultValue) next.delete(name)
    else next.set(name, value)
    setParams(next, { replace: true })
  }

  const listState = { listSearch: params.toString() }

  const load = useCallback(
    async (signal: AbortSignal) => {
      const [templates, options] = await Promise.all([
        getTaskTemplates(businessId, signal),
        getCourseOptions(businessId, signal),
      ])
      return { templates, areas: options.areas }
    },
    [businessId],
  )
  const query = useApiQuery(`task-templates:${businessId}`, load)
  const [shown, setShown] = useState<{ source?: typeof query.data; data?: typeof query.data }>({})
  if (query.data && query.data !== shown.source) setShown({ source: query.data, data: query.data })
  const data = shown.data
  const areaName = (id: string) => data?.areas.find((area) => area.id === id)?.name ?? `영역 ${id}`

  const keyword = search.trim().toLowerCase()
  const templates = (data?.templates ?? []).filter(
    (template) =>
      (state === 'all' || template.isActive === (state === 'active')) &&
      (areaId === ALL || template.areaId === areaId) &&
      (reference === ALL || template.referenceType === reference) &&
      (!keyword ||
        template.title.toLowerCase().includes(keyword) ||
        template.templateKey.toLowerCase().includes(keyword)),
  )
  const groups = groupByPhase(templates)

  function toggleActive(template: TaskTemplate, isActive: boolean) {
    const save = async () => {
      setSavingId(template.id)
      try {
        const result = await updateTaskTemplate(template.id, { version: template.version, isActive })
        setShown((current) => ({
          ...current,
          data: current.data && {
            ...current.data,
            templates: current.data.templates.map((item) => (item.id === template.id ? result.template : item)),
          },
        }))
        message.success(isActive ? '템플릿을 다시 켰어요.' : '템플릿을 껐어요.')
      } catch (error) {
        showError(error)
        if (!isAuthStateError(error)) query.reload()
      } finally {
        setSavingId(null)
      }
    }
    if (isActive) {
      void save()
      return
    }
    modal.confirm({
      title: `'${template.templateKey} ${template.title}' 템플릿을 끌까요?`,
      content: TURN_OFF_NOTICE,
      okText: '끄기',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: save,
    })
  }

  const renderReview = (template: TaskTemplate) =>
    template.requiresReview ? (
      <Tag color="processing" variant="outlined" className="m-0">
        필요
      </Tag>
    ) : (
      <span className="text-(--ant-color-text-tertiary)">-</span>
    )

  const renderActive = (template: TaskTemplate) => (
    <Switch
      aria-label={`${template.title} 사용`}
      checked={template.isActive}
      loading={savingId === template.id}
      disabled={!!savingId}
      onChange={(checked) => toggleActive(template, checked)}
    />
  )

  const editPath = (template: TaskTemplate) => `/admin/task-templates/${template.id}`

  const renderTitle = (template: TaskTemplate) => (
    <Link
      to={editPath(template)}
      state={listState}
      className="text-inherit hover:text-inherit"
      onClick={(event) => event.stopPropagation()}
    >
      {template.title}
    </Link>
  )

  const rows: TemplateRow[] = groups.flatMap(({ key, name, isAlways, items }) => [
    { kind: 'group' as const, key: `group:${key}`, phase: name, isAlways, count: items.length },
    ...items.map((template) => ({ ...template, kind: 'item' as const, key: template.id })),
  ])
  const columnCount = isWide ? 7 : 6
  const groupCell = (row: TemplateRow) => (row.kind === 'group' ? { colSpan: 0 } : {})

  const columns: TableColumnsType<TemplateRow> = [
    {
      title: '키',
      key: 'key',
      width: 88,
      onCell: (row) => (row.kind === 'group' ? { colSpan: columnCount } : {}),
      render: (_, row) =>
        row.kind === 'group' ? (
          <span className="flex items-center gap-xs pt-xs">
            <span className="text-body font-bold">{row.phase}</span>
            <span className="text-caption text-(--ant-color-text-tertiary)">{row.count}개</span>
            {row.isAlways && (
              <span className="text-caption text-(--ant-color-text-tertiary)">마감, 진행률, 알림에 포함되지 않아요</span>
            )}
          </span>
        ) : (
          <span className="whitespace-nowrap">{row.templateKey}</span>
        ),
    },
    { title: '제목', key: 'title', onCell: groupCell, render: (_, row) => (row.kind === 'item' ? renderTitle(row) : null) },
    {
      title: '영역',
      key: 'area',
      className: 'whitespace-nowrap',
      onCell: groupCell,
      render: (_, row) => (row.kind === 'item' ? areaName(row.areaId) : null),
    },
    {
      title: '마감 기준',
      key: 'deadline',
      onCell: groupCell,
      render: (_, row) => (row.kind === 'item' ? describeDeadline(row) : null),
    },
    ...(isWide
      ? [
          {
            title: '리더 확인',
            key: 'review',
            className: 'whitespace-nowrap',
            onCell: groupCell,
            render: (_: unknown, row: TemplateRow) => (row.kind === 'item' ? renderReview(row) : null),
          },
        ]
      : []),
    {
      title: '사용',
      key: 'active',
      onCell: (row) => (row.kind === 'group' ? { colSpan: 0 } : { onClick: (event) => event.stopPropagation() }),
      render: (_, row) => (row.kind === 'item' ? renderActive(row) : null),
    },
    {
      title: <span className="sr-only">수정</span>,
      key: 'edit',
      width: 40,
      onCell: groupCell,
      render: (_, row) =>
        row.kind === 'item' ? <RightOutlined aria-hidden className="text-[10px] text-(--ant-color-text-tertiary)" /> : null,
    },
  ]

  const header = (
    <PageHeader
      title="할 일 템플릿"
      actions={
        <>
          <Button icon={<TagsOutlined />} onClick={() => setShowTags(true)}>
            태그 관리
          </Button>
          <Link to="/admin/task-templates/new" state={listState}>
            <Button type="primary" icon={<PlusOutlined />}>
              템플릿 추가
            </Button>
          </Link>
        </>
      }
    />
  )

  if (query.error) {
    return (
      <div className="flex flex-col gap-md break-keep">
        {header}
        <LoadingError title="템플릿을 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      </div>
    )
  }

  const empty = data?.templates.length ? (
    <NoSearchResult plain title="조건에 맞는 템플릿이 없어요" />
  ) : (
    <EmptyData plain title="아직 템플릿이 없어요" description="템플릿 추가로 과정에 만들 할 일을 등록해 주세요." />
  )

  return (
    <div className="flex flex-col gap-md break-keep">
      {header}
      <div className="flex flex-wrap items-center gap-xs rounded-lg bg-(--ant-color-bg-container) p-md min-[992px]:px-lg">
        <SearchInput
          label="제목, 템플릿 키 검색"
          value={search}
          onChange={(event) => setFilter('q', event.target.value, '')}
          className="w-full min-[992px]:w-[240px]"
        />
        <Select
          aria-label="영역 필터"
          className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
          popupMatchSelectWidth={false}
          value={areaId}
          onChange={(value) => setFilter('area', value, ALL)}
          options={[{ value: ALL, label: isMobile ? '영역' : '영역: 전체' }, ...(data?.areas ?? []).map((area) => ({ value: area.id, label: area.name }))]}
        />
        <Select
          aria-label="기준 필터"
          className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
          popupMatchSelectWidth={false}
          value={reference}
          onChange={(value) => setFilter('reference', value, ALL)}
          options={[
            { value: ALL, label: isMobile ? '기준' : '기준: 전체' },
            ...(Object.keys(referenceLabels) as ReferenceType[]).map((type) => ({ value: type, label: referenceLabels[type] })),
          ]}
        />
        <Select
          aria-label="상태 필터"
          className="min-w-0 flex-1 min-[992px]:w-auto min-[992px]:flex-none"
          popupMatchSelectWidth={false}
          value={state}
          onChange={(value) => setFilter('state', value, 'active')}
          options={[
            { value: 'all', label: isMobile ? '상태' : '상태: 전체' },
            { value: 'active', label: isMobile ? '사용 중' : '상태: 사용 중' },
            { value: 'inactive', label: isMobile ? '꺼짐' : '상태: 꺼짐' },
          ]}
        />
        <span className="hidden text-caption text-(--ant-color-text-secondary) min-[992px]:ml-auto min-[992px]:inline">
          템플릿 {data ? templates.length : '-'}개
        </span>
      </div>
      {showTags && <TagManager businessId={businessId} onClose={() => setShowTags(false)} />}

      {!data ? (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }} aria-busy="true">
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-xs' : 'p-lg' }}>
          {isMobile ? (
            templates.length === 0 ? (
              empty
            ) : (
              groups.map(({ key, name, items }) => (
                <section key={key} className="py-xs">
                  <h3 className="m-0 flex flex-wrap items-center gap-xs py-xs text-body font-bold">
                    {name}
                    <span className="text-caption font-regular text-(--ant-color-text-tertiary)">{items.length}개</span>
                  </h3>
                  <ul className="m-0 list-none p-0">
                    {items.map((template) => (
                      <li
                        key={template.id}
                        className="flex items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) last:border-b-0"
                      >
                        <Link
                          to={editPath(template)}
                          state={listState}
                          aria-label={`${template.title} 수정`}
                          className={`flex min-w-0 flex-1 flex-col gap-xxs py-sm text-caption ${
                            template.isActive
                              ? 'text-(--ant-color-text) hover:text-(--ant-color-text)'
                              : 'text-(--ant-color-text-tertiary) hover:text-(--ant-color-text-tertiary)'
                          }`}
                        >
                          <span className="flex items-center gap-xxs text-body font-medium">
                            {template.title}
                            <RightOutlined aria-hidden className="text-[10px] text-(--ant-color-text-tertiary)" />
                          </span>
                          <span className={template.isActive ? 'text-(--ant-color-text-secondary)' : ''}>
                            {template.templateKey}, {areaName(template.areaId)}
                            {template.requiresReview && ', 리더 확인 필요'}
                          </span>
                          <span className={template.isActive ? 'text-(--ant-color-text-secondary)' : ''}>
                            {describeDeadline(template)}
                          </span>
                        </Link>
                        <span className="shrink-0">{renderActive(template)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )
          ) : (
            <Table<TemplateRow>
              rowKey="key"
              columns={columns}
              dataSource={rows}
              pagination={false}
              size="small"
              scroll={{ x: isWide ? 760 : 640 }}
              locale={{ emptyText: empty }}
              rowClassName={(row) =>
                row.kind === 'item' ? `cursor-pointer ${row.isActive ? '' : '[&>td]:text-(--ant-color-text-tertiary)'}` : '[&>td]:bg-transparent!'
              }
              onRow={(row) => (row.kind === 'item' ? clickableRowProps(() => navigate(editPath(row), { state: listState })) : {})}
              classNames={smallTableStyle}
            />
          )}
        </Card>
      )}
    </div>
  )
}
