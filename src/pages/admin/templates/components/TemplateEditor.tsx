import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import {
  App,
  AutoComplete,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
} from 'antd'
import dayjs from 'dayjs'
import { Link, useLocation, useNavigate } from 'react-router'

import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { createTaskTemplate, createTemplateTag, updateTaskTemplate } from '../../../../api/taskTemplates'
import { useAuth } from '../../../../providers/AuthContext'
import type { OptionItem } from '../../../../types/courseApi'
import type { DocumentItem } from '../../../../types/documents'
import type {
  ReferenceType,
  TaskTemplate,
  TemplateInput,
  TemplateRecalculation,
  TemplateTag,
} from '../../../../types/taskTemplate'
import { formatTaskDate } from '../../../tasks/courseTasksData'
import { getConditionalOffsets, previewDeadline, referenceLabels, TURN_OFF_NOTICE } from '../templatesData'

type FormValues = TemplateInput & { templateKey: string; isActive: boolean }

type TemplateEditorProps = {
  businessId: string
  template?: TaskTemplate
  areas: OptionItem[]
  tags: TemplateTag[]
  documents: DocumentItem[]
  phases: string[]
  isMobile: boolean
  onReload: () => void
}

const shortReferenceLabels: Record<ReferenceType, string> = {
  COURSE_START: '시작일',
  COURSE_END: '종료일',
  MONTH_END: '월 주기',
  ALWAYS: '상시',
}

const sectionClassNames = { body: 'p-md min-[992px]:p-lg' }
const textFields = ['phase', 'performer', 'systemName', 'displayText'] as const

function OffsetInput({ value, onChange, disabled, label }: {
  value?: number | null
  onChange?: (value: number | null) => void
  disabled?: boolean
  label: string
}) {
  const [direction, setDirection] = useState<'before' | 'after'>(value !== null && value !== undefined && value < 0 ? 'before' : 'after')
  const days = value === null || value === undefined ? null : Math.abs(value)
  const emit = (nextDays: number | null, nextDirection: 'before' | 'after') =>
    onChange?.(nextDays === null ? null : nextDirection === 'before' ? -nextDays : nextDays)

  return (
    <Space.Compact className="w-full">
      <InputNumber
        aria-label={`${label} 일수`}
        className="w-full"
        min={0}
        max={3650}
        precision={0}
        disabled={disabled}
        value={days}
        onChange={(next) => emit(next, direction)}
      />
      <Select
        aria-label={`${label} 앞뒤`}
        className="w-[96px] shrink-0"
        disabled={disabled}
        value={direction}
        onChange={(next) => {
          setDirection(next)
          emit(days, next)
        }}
        options={[
          { value: 'before', label: '일 전' },
          { value: 'after', label: '일 뒤' },
        ]}
      />
    </Space.Compact>
  )
}

function toFormValues(template?: TaskTemplate): FormValues {
  return {
    templateKey: template?.templateKey ?? '',
    title: template?.title ?? '',
    phase: template?.phase ?? null,
    areaId: template?.areaId ?? '',
    sortOrder: template?.sortOrder ?? 0,
    referenceType: template?.referenceType ?? 'COURSE_START',
    defaultOffsetDays: template?.defaultOffsetDays ?? null,
    longOffsetDays: template?.longOffsetDays ?? null,
    shortOffsetDays: template?.shortOffsetDays ?? null,
    performer: template?.performer ?? null,
    systemName: template?.systemName ?? null,
    displayText: template?.displayText ?? null,
    requiresReview: template?.requiresReview ?? false,
    isActive: template?.isActive ?? true,
    tagIds: template?.tagIds ?? [],
    documentIds: template?.documentIds ?? [],
  }
}

function toInput(values: FormValues): TemplateInput {
  const isAlways = values.referenceType === 'ALWAYS'
  const input: TemplateInput = {
    title: values.title.trim(),
    phase: values.phase,
    areaId: values.areaId,
    sortOrder: values.sortOrder ?? 0,
    referenceType: values.referenceType,
    defaultOffsetDays: isAlways ? null : values.defaultOffsetDays,
    longOffsetDays: isAlways ? null : values.longOffsetDays,
    shortOffsetDays: isAlways ? null : values.shortOffsetDays,
    performer: values.performer,
    systemName: values.systemName,
    displayText: values.displayText,
    requiresReview: isAlways ? false : values.requiresReview,
    tagIds: values.tagIds,
    documentIds: values.documentIds,
  }
  for (const field of textFields) input[field] = input[field]?.trim() || null
  return input
}

function getChanges(input: TemplateInput, isActive: boolean, template: TaskTemplate) {
  const changes: Partial<TemplateInput> & { isActive?: boolean } = {}
  for (const key of Object.keys(input) as (keyof TemplateInput)[]) {
    const next = input[key]
    const current = template[key]
    const same = Array.isArray(next) && Array.isArray(current)
      ? [...next].sort().join() === [...current].sort().join()
      : next === current
    if (!same) Object.assign(changes, { [key]: next })
  }
  if (isActive !== template.isActive) changes.isActive = isActive
  return changes
}

export default function TemplateEditor({ businessId, template, areas, tags: initialTags, documents, phases, isMobile, onReload }: TemplateEditorProps) {
  const { message, modal } = App.useApp()
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch
  const listPath = listSearch ? `/admin/task-templates?${listSearch}` : '/admin/task-templates'
  const [form] = Form.useForm<FormValues>()
  const [tags, setTags] = useState(initialTags)
  const [tagName, setTagName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [exampleDate, setExampleDate] = useState(dayjs().format('YYYY-MM-DD'))

  const referenceType = Form.useWatch('referenceType', form) ?? template?.referenceType ?? 'COURSE_START'
  const defaultOffset = Form.useWatch('defaultOffsetDays', form)
  const longOffset = Form.useWatch('longOffsetDays', form)
  const shortOffset = Form.useWatch('shortOffsetDays', form)
  const isAlways = referenceType === 'ALWAYS'

  const areaOptions = [
    ...areas.map((area) => ({ value: area.id, label: area.name })),
    ...(template && !areas.some((area) => area.id === template.areaId)
      ? [{ value: template.areaId, label: `영역 ${template.areaId} (기존 설정)` }]
      : []),
  ]
  const tagOptions = tags
    .filter((tag) => tag.isActive || template?.tagIds.includes(tag.id))
    .map((tag) => ({ value: tag.id, label: tag.isActive ? tag.name : `${tag.name} (꺼짐)` }))
  const documentOptions = [
    ...documents.map((document) => ({ value: document.id, label: document.title })),
    ...(template?.documentIds ?? [])
      .filter((id) => !documents.some((document) => document.id === id))
      .map((id) => ({ value: id, label: `문서 ${id} (지금은 볼 수 없음)` })),
  ]

  async function addTag() {
    const name = tagName.trim()
    if (!name) return
    try {
      const { tag } = await createTemplateTag(businessId, name)
      setTags((current) => [...current, tag])
      form.setFieldValue('tagIds', [...(form.getFieldValue('tagIds') ?? []), tag.id])
      setTagName('')
    } catch (error) {
      message.error(getApiErrorMessage(error))
    }
  }

  function showSaved(saved: TaskTemplate, recalculation: TemplateRecalculation) {
    const rows = [
      ['마감이 바뀐 미완료 할 일', recalculation.deadlineChangedTaskCount],
      ['내용이 바뀐 미완료 할 일', recalculation.updatedTaskCount],
      ['새로 만든 할 일', recalculation.createdTaskCount],
      ['목록에서 빠진 미완료 할 일', recalculation.supersededTaskCount],
      ['그대로 둔 완료한 할 일', recalculation.preservedCompletedTaskCount],
    ] as const
    modal.success({
      title: `저장했어요 (버전 ${saved.revision})`,
      content: (
        <div className="flex flex-col gap-sm">
          <p className="m-0">진행 중인 과정의 미완료 할 일에 바로 반영했어요.</p>
          <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-md gap-y-xxs rounded-md bg-(--ant-color-fill-quaternary) p-sm text-caption">
            {rows.map(([label, count]) => (
              <div key={label} className="contents">
                <dt>{label}</dt>
                <dd className="m-0 text-right">{count}건</dd>
              </div>
            ))}
          </dl>
          {recalculation.mismatchCount > 0 && (
            <p className="m-0 text-caption">
              완료한 할 일 {recalculation.mismatchCount}건은 바꾸지 않고 &apos;완료 뒤에 기준이 바뀐 할 일&apos;로 표시했어요. 리더와 관리자가 할 일 상세에서 확인할 수 있어요.
            </p>
          )}
        </div>
      ),
      okText: '목록으로',
      onOk: () => navigate(listPath),
      okCancel: true,
      cancelText: '계속 수정',
      onCancel: onReload,
    })
  }

  function showConflict() {
    modal.confirm({
      title: '다른 사람이 먼저 이 템플릿을 수정했어요',
      content: '내가 바꾼 내용은 아직 저장되지 않았어요. 최신 내용을 불러온 뒤 다시 확인하고 저장해 주세요. 최신 내용을 불러오면 지금 입력한 값은 사라져요.',
      okText: '최신 내용 불러오기',
      cancelText: '닫기',
      onOk: onReload,
    })
  }

  async function save(values: FormValues) {
    if (isSaving) return
    if (template?.isActive && !values.isActive) {
      const confirmed = await modal.confirm({
        title: '이 템플릿을 끄고 저장할까요?',
        content: TURN_OFF_NOTICE,
        okText: '끄고 저장',
        okButtonProps: { danger: true },
        cancelText: '취소',
      })
      if (!confirmed) return
    }
    const input = toInput(values)
    setIsSaving(true)
    try {
      if (!template) {
        await createTaskTemplate({ ...input, businessId, templateKey: values.templateKey.trim() })
        message.success('템플릿을 추가했어요. 다음에 등록하는 과정부터 이 할 일이 만들어져요.')
        navigate(listPath)
        return
      }
      const changes = getChanges(input, values.isActive, template)
      if (Object.keys(changes).length === 0) {
        message.info('바뀐 내용이 없어요.')
        return
      }
      const result = await updateTaskTemplate(template.id, { ...changes, version: template.version })
      showSaved(result.template, result.recalculation)
    } catch (error) {
      if (isAuthStateError(error)) void refreshUser()
      if (error instanceof ApiError && error.status === 409 && template) {
        showConflict()
        return
      }
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        form.setFields(error.fieldErrors.map((item) => ({ name: item.field as keyof FormValues, errors: [item.message] })))
      }
      if (error instanceof ApiError && error.status === 409) {
        form.setFields([{ name: 'templateKey', errors: [error.message] }])
      }
      message.error(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const exampleLabel =
    referenceType === 'COURSE_END' ? '예시 종료일' : referenceType === 'MONTH_END' ? '예시 주기 종료일' : '예시 시작일'
  const conditional = getConditionalOffsets({
    defaultOffsetDays: defaultOffset ?? null,
    longOffsetDays: longOffset ?? null,
    shortOffsetDays: shortOffset ?? null,
  })
  const previewRows: [string, number][] = []
  if (conditional) {
    if (conditional.long !== null) previewRows.push([longOffset == null ? '장기 과정 (기본 일수)' : '장기 과정', conditional.long])
    if (conditional.short !== null) previewRows.push([shortOffset == null ? '단기 과정 (기본 일수)' : '단기 과정', conditional.short])
  } else if (defaultOffset !== null && defaultOffset !== undefined) {
    previewRows.push(['마감', defaultOffset])
  }

  return (
    <Form<FormValues>
      form={form}
      layout="vertical"
      initialValues={toFormValues(template)}
      onFinish={(values) => void save(values)}
      requiredMark
      className="flex flex-col gap-md break-keep [&_.ant-form-item]:mb-[18px]"
    >
      <div>
        <Breadcrumb
          className="mb-xxs text-caption"
          items={[
            { title: <Link to={listPath}>할 일 템플릿</Link> },
            { title: template ? `${template.templateKey} ${template.title}` : '템플릿 추가' },
          ]}
        />
        <h2 className="m-0 text-section-title">{template ? '템플릿 수정' : '템플릿 추가'}</h2>
      </div>

      <div className="grid grid-cols-1 gap-md min-[992px]:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-md">
          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-sm text-card-title">기본 정보</h3>
            <div className="grid grid-cols-1 gap-x-md min-[768px]:grid-cols-[200px_minmax(0,1fr)]">
              <Form.Item
                name="templateKey"
                label="템플릿 키"
                extra={template ? '템플릿 키는 바꿀 수 없어요' : '사업 안에서 하나만 쓸 수 있어요'}
                rules={[{ required: !template, whitespace: true, message: '템플릿 키를 입력해 주세요' }]}
              >
                <Input maxLength={100} disabled={!!template} placeholder="예: T1-19" />
              </Form.Item>
              <Form.Item name="title" label="제목" rules={[{ required: true, whitespace: true, message: '제목을 입력해 주세요' }]}>
                <Input maxLength={255} placeholder="할 일 목록에 보일 제목" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-1 gap-x-md min-[768px]:grid-cols-3">
              <Form.Item name="phase" label="단계">
                <AutoComplete
                  options={phases.map((phase) => ({ value: phase }))}
                  placeholder="예: 준비"
                  maxLength={50}
                  allowClear
                  disabled={isAlways}
                />
              </Form.Item>
              <Form.Item name="areaId" label="영역" rules={[{ required: true, message: '영역을 골라 주세요' }]}>
                <Select options={areaOptions} placeholder="영역 선택" />
              </Form.Item>
              <Form.Item name="sortOrder" label="표시 순서" extra="단계 안에서 작은 숫자가 위로 와요">
                <InputNumber className="w-full" min={0} precision={0} />
              </Form.Item>
            </div>
          </Card>

          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-sm text-card-title">마감 계산</h3>
            <Form.Item name="referenceType" label="기준" rules={[{ required: true }]}>
              <Segmented
                block={isMobile}
                options={(Object.keys(referenceLabels) as ReferenceType[]).map((type) => ({
                  value: type,
                  label: (isMobile ? shortReferenceLabels : referenceLabels)[type],
                }))}
                onChange={(value) => {
                  if (value === 'ALWAYS') {
                    form.setFieldsValue({ defaultOffsetDays: null, longOffsetDays: null, shortOffsetDays: null, requiresReview: false })
                  }
                }}
              />
            </Form.Item>
            <div className="grid grid-cols-1 gap-x-md min-[768px]:grid-cols-3">
              <Form.Item
                name="defaultOffsetDays"
                label="기본"
                dependencies={['referenceType', 'longOffsetDays', 'shortOffsetDays']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (getFieldValue('referenceType') === 'ALWAYS' || value !== null && value !== undefined) return Promise.resolve()
                      const long = getFieldValue('longOffsetDays')
                      const short = getFieldValue('shortOffsetDays')
                      if (long !== null && long !== undefined && short !== null && short !== undefined) return Promise.resolve()
                      return Promise.reject(new Error('기본 일수를 넣거나 장기와 단기를 모두 넣어 주세요'))
                    },
                  }),
                ]}
              >
                <OffsetInput label="기본" disabled={isAlways} />
              </Form.Item>
              <Form.Item name="longOffsetDays" label="장기 과정">
                <OffsetInput label="장기 과정" disabled={isAlways} />
              </Form.Item>
              <Form.Item name="shortOffsetDays" label="단기 과정">
                <OffsetInput label="단기 과정" disabled={isAlways} />
              </Form.Item>
            </div>
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
              {isAlways
                ? '상시 할 일은 마감 없이 과정마다 하나씩 만들어지고, 마감, 진행률, 알림에 포함되지 않아요.'
                : '장기나 단기를 비우면 그 과정에는 기본 일수를 써요. 장기는 시작일과 종료일을 포함해 180일 이상인 과정이에요.'}
            </p>
          </Card>

          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-sm text-card-title">업무 정보</h3>
            <div className="grid grid-cols-1 gap-x-md min-[768px]:grid-cols-3">
              <Form.Item name="performer" label="수행자">
                <Input maxLength={100} placeholder="예: 담당자" />
              </Form.Item>
              <Form.Item name="systemName" label="사용하는 시스템">
                <Input maxLength={100} placeholder="예: 시스템 A" />
              </Form.Item>
              <Form.Item name="displayText" label="보조 문구">
                <Input maxLength={255} placeholder="예: 과정 시작 45일 뒤" />
              </Form.Item>
            </div>
          </Card>

          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-sm text-card-title">태그와 연결 문서</h3>
            <div className="grid grid-cols-1 gap-x-md min-[768px]:grid-cols-2">
              <Form.Item name="tagIds" label="태그">
                <Select
                  mode="multiple"
                  className="cursor-pointer **:cursor-pointer"
                  options={tagOptions}
                  placeholder="태그 선택"
                  optionFilterProp="label"
                  notFoundContent={
                    <span className="text-caption text-(--ant-color-text-tertiary)">
                      쓸 수 있는 태그가 없어요. 아래에서 새 태그를 만들어 주세요.
                    </span>
                  }
                  popupRender={(menu) => (
                    <>
                      {menu}
                      <Divider className="my-xs" />
                      <Space.Compact className="w-full px-xs pb-xs">
                        <Input
                          aria-label="새 태그 이름"
                          placeholder="새 태그 이름"
                          maxLength={50}
                          value={tagName}
                          onChange={(event) => setTagName(event.target.value)}
                          onKeyDown={(event) => event.stopPropagation()}
                        />
                        <Button icon={<PlusOutlined />} onClick={() => void addTag()}>
                          추가
                        </Button>
                      </Space.Compact>
                    </>
                  )}
                />
              </Form.Item>
              <Form.Item name="documentIds" label="연결 문서">
                <Select mode="multiple" className="cursor-pointer **:cursor-pointer" options={documentOptions} placeholder="문서 선택" optionFilterProp="label" />
              </Form.Item>
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-md">
          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-xs text-card-title">적용 설정</h3>
            {template && (
              <label className="flex cursor-pointer items-start justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm">
                <span className="flex flex-col gap-xxs">
                  <span className="text-body font-medium">과정에 할 일 만들기</span>
                  <span className="text-caption text-(--ant-color-text-secondary)">
                    끄면 과정에 이 할 일이 더 이상 만들어지지 않아요.
                  </span>
                </span>
                <Form.Item name="isActive" valuePropName="checked" noStyle>
                  <Switch aria-label="과정에 할 일 만들기" />
                </Form.Item>
              </label>
            )}
            <label
              className={`flex items-start justify-between gap-sm ${template ? 'pt-sm' : 'pt-xs'} ${isAlways ? '' : 'cursor-pointer'}`}
            >
              <span className="flex flex-col gap-xxs">
                <span className="text-body font-medium">리더 확인 필요</span>
                <span className="text-caption text-(--ant-color-text-secondary)">
                  {isAlways ? '상시 할 일은 리더 확인을 쓰지 않아요.' : '담당자가 완료하면 리더가 내용을 확인해야 최종 완료돼요.'}
                </span>
              </span>
              <Form.Item name="requiresReview" valuePropName="checked" noStyle>
                <Switch aria-label="리더 확인 필요" disabled={isAlways} />
              </Form.Item>
            </label>
          </Card>
          <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
            <h3 className="m-0 mb-sm text-card-title">마감 미리보기</h3>
            {isAlways ? (
              <p className="m-0 text-caption text-(--ant-color-text-secondary)">상시 할 일은 마감이 없어요.</p>
            ) : (
              <>
                <label className="mb-sm flex items-center justify-between gap-sm text-caption text-(--ant-color-text-secondary)">
                  {exampleLabel}
                  <DatePicker
                    allowClear={false}
                    inputReadOnly
                    format={(value) => formatTaskDate(value.format('YYYY-MM-DD'), true)}
                    value={dayjs(exampleDate)}
                    onChange={(value) => value && setExampleDate(value.format('YYYY-MM-DD'))}
                  />
                </label>
                {previewRows.length === 0 ? (
                  <p className="m-0 text-caption text-(--ant-color-text-tertiary)">일수를 넣으면 마감을 보여 드려요.</p>
                ) : (
                  <ul className="m-0 list-none p-0">
                    {previewRows.map(([label, offset]) => {
                      const preview = previewDeadline(exampleDate, offset)
                      return (
                        <li
                          key={label}
                          className="flex items-start justify-between gap-sm border-0 border-t border-solid border-(--ant-color-border-secondary) py-sm text-caption first:border-t-0"
                        >
                          <span className="text-(--ant-color-text-secondary)">{label}</span>
                          <span className="flex flex-col items-end">
                            <span className="text-body font-medium">{formatTaskDate(preview.dueDate, true)}</span>
                            {preview.shiftReason && (
                              <span className="text-(--ant-color-warning-text)">
                                원래 {formatTaskDate(preview.rawDueDate)} → {formatTaskDate(preview.dueDate)} 당김 ({preview.shiftReason})
                              </span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">
                  주말이면 앞 영업일로 당겨요. 공휴일과 회사 휴무일은 과정에 할 일을 만들 때 서버가 반영해요.
                </p>
              </>
            )}
          </Card>
          {template && (
            <Card variant="borderless" className="shadow-none" classNames={sectionClassNames}>
              <h3 className="m-0 mb-xs text-card-title">변경 정보</h3>
              <p className="m-0 text-caption text-(--ant-color-text-secondary)">현재 버전 {template.revision}</p>
              <p className="mt-xs mb-0 text-caption text-(--ant-color-text-secondary)">
                저장할 때마다 버전이 1씩 올라가요. 바뀐 내용은 진행 중인 과정의 미완료 할 일에 바로 반영되고, 이미 완료한 할 일은 그대로 남아요.
              </p>
            </Card>
          )}
        </div>
      </div>

      <Card
        variant="borderless"
        className="sticky -bottom-md z-10 shadow-[0_-1px_0_var(--ant-color-border-secondary)] min-[992px]:-bottom-lg"
        classNames={{ body: 'flex justify-end gap-xs p-md' }}
      >
        <Link to={listPath}>
          <Button>취소</Button>
        </Link>
        <Button type="primary" htmlType="submit" loading={isSaving}>
          저장
        </Button>
      </Card>
    </Form>
  )
}
