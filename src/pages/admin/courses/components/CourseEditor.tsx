import { useState } from 'react'
import { ArrowRightOutlined, CheckCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, App, Breadcrumb, Button, Card, DatePicker, Form, Input, InputNumber, Modal, Select, Tag } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Link, useNavigate, useSearchParams } from 'react-router'

import type { CourseDraft, CourseSaveResult, ManagedCourse } from '../../../../types/adminCourses'
import { formatActionTime } from '../../../tasks/courseTasksData'
import { getAssignmentIssues, getCoursePeriod, getCourseState } from '../courseManagementData'
import { courseOrgUnits, courseSaveErrorMock } from '../courseManagementMockData'
import AssigneeFields from './AssigneeFields'
import CourseCorrectionModal from './CourseCorrectionModal'

type CourseEditorProps = {
  course?: ManagedCourse
  onSave: (draft: CourseDraft, version?: number, reason?: string) => CourseSaveResult | null
}

type CourseFormValues = Omit<CourseDraft, 'startDate' | 'endDate'> & { startDate: Dayjs; endDate: Dayjs }

export default function CourseEditor({ course, onSave }: CourseEditorProps) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { modal } = App.useApp()
  const [form] = Form.useForm<CourseFormValues>()
  const [result, setResult] = useState<CourseSaveResult | null>(null)
  const [saveError, setSaveError] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [correction, setCorrection] = useState<{ type: 'endDate' | 'assignee'; areaId?: string } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [conflictReloaded, setConflictReloaded] = useState(false)

  const isEnded = !!course && getCourseState(course) === '종료'
  const readOnly = isEnded || !!course?.archivedAt
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)
  const orgUnitId = Form.useWatch('orgUnitId', form) ?? course?.orgUnitId ?? ''
  const assignees = Form.useWatch('assignees', form)
  const validPeriod = startDate?.isValid() && endDate?.isValid() && !endDate.isBefore(startDate, 'day')
  const period = validPeriod ? getCoursePeriod(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')) : null

  function submit(values: CourseFormValues) {
    if (readOnly) return
    if (params.get('preview') === 'save-error') {
      setSaveError(true)
      form.setFields([{ name: courseSaveErrorMock.field, errors: [courseSaveErrorMock.message] }])
      return
    }
    if (params.get('preview') === 'conflict' && !conflictReloaded) {
      setConflict(true)
      return
    }

    const saved = onSave(
      {
        ...values,
        externalKey: values.externalKey.trim(),
        name: values.name.trim(),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        capacity: values.capacity ?? null,
      },
      course?.version,
    )
    if (!saved) {
      setConflict(true)
      return
    }
    setSaveError(false)
    setResult(saved)
  }

  function changeOrgUnit(nextOrgId: string) {
    const hasAssignees = Object.values(assignees ?? {}).some((ids) => (ids as string[]).length)
    if (!hasAssignees) return nextOrgId

    modal.confirm({
      title: '조직 단위를 바꿀까요?',
      content: '기존 담당 배정이 해제돼요. 새 조직의 담당자를 다시 선택해 주세요.',
      okText: '변경',
      cancelText: '취소',
      onOk: () => {
        form.setFieldValue('orgUnitId', nextOrgId)
        form.setFieldValue('assignees', {})
      },
    })
    return orgUnitId || undefined
  }

  return (
    <div className="flex flex-col gap-md">
      <div>
        <Breadcrumb
          className="mb-xxs text-caption"
          items={[{ title: <Link to="/admin/courses">과정·담당 배정</Link> }, { title: course?.name ?? '과정 추가' }]}
        />
        <h2 className="m-0 text-section-title">{readOnly ? '과정 보기' : course ? '과정 수정' : '과정 추가'}</h2>
      </div>
      {readOnly && (
        <Alert
          type="info"
          showIcon
          icon={<LockOutlined />}
          title={
            <div className="flex flex-wrap items-center justify-between gap-sm text-caption">
              <span>
                {course?.archivedAt
                  ? '보관된 과정이에요. 과정 정보와 담당 배정은 바꿀 수 없어요.'
                  : `종료된 과정이에요(${course?.endDate.replaceAll('-', '.')} 종료). 과정 정보는 바꿀 수 없고, 종료일을 잘못 넣었거나 담당자가 비활성이면 관리자가 사유를 남기고 정정할 수 있어요.`}
              </span>
              {!course?.archivedAt && (
                <span className="flex gap-xs">
                  <Button onClick={() => setCorrection({ type: 'endDate' })}>종료일 정정</Button>
                  <Button
                    disabled={!course || !getAssignmentIssues(course.assignees).inactive}
                    onClick={() => setCorrection({ type: 'assignee' })}
                  >
                    담당자 교체
                  </Button>
                </span>
              )}
            </div>
          }
        />
      )}
      {saveError && <Alert type="error" showIcon title="저장하지 못했어요. 빨간색으로 표시한 칸을 확인해 주세요." />}

      <Form
        form={form}
        layout="vertical"
        requiredMark={!readOnly}
        onFinish={submit}
        scrollToFirstError
        initialValues={
          course
            ? { ...course, startDate: dayjs(course.startDate), endDate: dayjs(course.endDate) }
            : { capacity: null, assignees: {} }
        }
        className="flex flex-col gap-md [&_.ant-form-item-label]:pb-xxs [&_.ant-form-item-label>label]:text-caption"
      >
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
          <h3 className="mt-0 mb-sm text-card-title font-medium">기본 정보</h3>
          <div className="grid grid-cols-1 gap-x-md min-[992px]:grid-cols-[260px_200px_minmax(0,1fr)]">
            <Form.Item
              name="externalKey"
              className="mb-sm"
              label="외부 키"
              extra="시스템 전체에서 하나만 쓸 수 있어요"
              rules={[{ required: true, whitespace: true, message: '외부 키를 입력해 주세요.' }, { max: 100 }]}
            >
              <Input disabled={readOnly} maxLength={100} />
            </Form.Item>
            <Form.Item
              name="orgUnitId"
              label="조직 단위"
              className="mb-sm"
              getValueFromEvent={changeOrgUnit}
              rules={[{ required: true, message: '조직 단위를 선택해 주세요.' }]}
            >
              <Select
                aria-label="조직 단위"
                disabled={readOnly}
                placeholder="조직 단위 선택"
                className="w-full"
                options={courseOrgUnits
                  .filter((org) => !org.isClosed || org.id === course?.orgUnitId)
                  .map((org) => ({ value: org.id, label: org.name }))}
              />
            </Form.Item>
            <Form.Item
              name="name"
              className="mb-sm"
              label="과정명"
              rules={[{ required: true, whitespace: true, message: '과정명을 입력해 주세요.' }, { max: 255 }]}
            >
              <Input disabled={readOnly} maxLength={255} />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 gap-md min-[992px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
            <div>
              <label className="mb-xs block text-caption" htmlFor="managed-course-start">
                기간 {!readOnly && <span className="text-(--ant-color-error)">*</span>}
              </label>
              <div className="flex items-start gap-xs">
                <Form.Item
                  name="startDate"
                  className="mb-0 min-w-0"
                  rules={[{ required: true, message: '시작일을 선택해 주세요.' }]}
                >
                  <DatePicker
                    id="managed-course-start"
                    aria-label="시작일"
                    disabled={readOnly}
                    allowClear={false}
                    format={['YYYY.MM.DD', 'YYYY-MM-DD']}
                    className="w-full"
                  />
                </Form.Item>
                <span className="pt-xxs">~</span>
                <Form.Item
                  name="endDate"
                  className="mb-0 min-w-0"
                  dependencies={['startDate']}
                  rules={[
                    { required: true, message: '종료일을 선택해 주세요.' },
                    ({ getFieldValue }) => ({
                      validator: (_, value: Dayjs | undefined) => {
                        const selectedStartDate = getFieldValue('startDate')
                        if (value && selectedStartDate && value.isBefore(selectedStartDate, 'day')) {
                          return Promise.reject(new Error('종료일은 시작일보다 빠를 수 없어요.'))
                        }
                        return Promise.resolve()
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    aria-label="종료일"
                    disabled={readOnly}
                    allowClear={false}
                    format={['YYYY.MM.DD', 'YYYY-MM-DD']}
                    className="w-full"
                  />
                </Form.Item>
              </div>
              <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">시작일·종료일 포함</p>
            </div>
            <div>
              <p className="mt-0 mb-xs text-caption">구분</p>
              <div className="flex flex-wrap items-center gap-xs">
                <Tag variant="filled" className="m-0">
                  {period?.label ?? '-'}
                </Tag>
                <span className="text-caption text-(--ant-color-text-secondary)">
                  {period ? `${period.days}일 · 기간으로 자동 계산` : '기간을 선택해 주세요'}
                </span>
              </div>
              <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">180일 이상이면 장기</p>
            </div>
            <Form.Item name="capacity" label="정원" className="mb-0">
              <InputNumber disabled={readOnly} min={0} precision={0} suffix="명" className="w-[120px]" />
            </Form.Item>
          </div>
        </Card>
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
          <h3 className="m-0 text-card-title font-medium">영역별 담당자</h3>
          <p className="mt-xxs mb-sm text-caption text-(--ant-color-text-secondary)">
            영역마다 여러 명을 배정할 수 있어요. 같은 영역은 한 명만 완료해도 완료로 처리돼요.
          </p>
          <Form.Item name="assignees" className="mb-0">
            <AssigneeFields orgUnitId={orgUnitId} readOnly={readOnly} pendingByArea={course?.pendingByArea} />
          </Form.Item>
        </Card>
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: 'flex flex-wrap items-center justify-between gap-sm p-md min-[992px]:px-lg' }}
        >
          <Button
            type="link"
            className="h-auto whitespace-normal p-0 text-left text-caption text-(--ant-color-text-tertiary) enabled:hover:text-(--ant-color-text-secondary) enabled:focus-visible:text-(--ant-color-text-secondary)"
            disabled={!course?.history.length}
            onClick={() => setShowHistory(true)}
          >
            {course ? (
              <span>
                변경 이력 {course.history.length}건 · 마지막 수정 {formatActionTime(course.updatedAt, true)} {course.updatedBy}
                {course.history.length > 0 && (
                  <span className="ml-xs text-[11px] text-(--ant-color-text-quaternary)">
                    클릭해서 자세히 보기
                  </span>
                )}
              </span>
            ) : '저장하면 할 일과 마감이 생성돼요'}
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-xs">
            {!readOnly && (
              <span className="text-caption text-(--ant-color-text-secondary)">
                저장하면 할 일과 마감을 다시 계산해요
              </span>
            )}
            <Button onClick={() => navigate('/admin/courses')}>{readOnly ? '목록으로' : '취소'}</Button>
            {!readOnly && (
              <Button type="primary" htmlType="submit">
                저장
              </Button>
            )}
          </div>
        </Card>
      </Form>

      {course && correction && (
        <CourseCorrectionModal
          key={`${correction.type}-${correction.areaId}`}
          course={course}
          type={correction.type}
          initialAreaId={correction.areaId}
          onClose={() => setCorrection(null)}
          onSave={(draft, reason) => {
            const saved = onSave(draft, course.version, reason)
            if (saved) {
              form.setFieldsValue({
                ...saved.course,
                startDate: dayjs(saved.course.startDate),
                endDate: dayjs(saved.course.endDate),
              })
              setCorrection(null)
              setResult(saved)
            } else setConflict(true)
          }}
        />
      )}
      <Modal
        open={!!result}
        title={
          <span className="flex items-center gap-xs">
            <CheckCircleOutlined className="text-(--ant-color-success)" />
            저장했어요
          </span>
        }
        width={460}
        centered
        mask={{ blur: false }}
        onCancel={() => {
          setResult(null)
          if (!course && result) {
            navigate(`/admin/courses/${result.course.id}`, { replace: true })
          }
        }}
        footer={
          <div className="flex justify-end gap-xs">
            <Button onClick={() => navigate('/admin/courses')}>목록으로</Button>
            <Button type="primary" onClick={() => navigate('/tasks')}>
              과정별 할 일 보기
            </Button>
          </div>
        }
      >
        <p className="text-body text-(--ant-color-text-secondary)">
          바뀐 일정과 담당자에 맞춰 미완료 할 일을 다시 계산했어요. 이미 완료한 할 일은 그대로 둬요.
        </p>
        <dl className="m-0 flex flex-col gap-xs rounded-md bg-(--ant-color-fill-quaternary) p-md text-caption">
          {result &&
            [
              ['새로 만든 할 일', result.created],
              ['마감이 바뀐 할 일', result.changed],
              ['주말·공휴일이라 앞당긴 마감', result.shifted],
              ['새 담당자에게 넘어간 할 일', result.reassigned],
            ].map(([label, count]) => (
              <div key={label} className="flex justify-between gap-xs">
                <dt>{label}</dt>
                <dd className="m-0 font-medium">{count}건</dd>
              </div>
            ))}
        </dl>
        <p className="mb-0 text-caption text-(--ant-color-text-tertiary)">
          숫자 항목은 저장 API 응답에 맞춰 바뀔 수 있어요.
        </p>
      </Modal>
      <Modal
        open={conflict}
        title={
          <span>
            <WarningOutlined className="mr-xs text-(--ant-color-warning)" />
            다른 사람이 먼저 이 과정을 수정했어요
          </span>
        }
        centered
        width={440}
        mask={{ blur: false }}
        okText="최신 내용 불러오기"
        cancelText="닫기"
        onCancel={() => setConflict(false)}
        onOk={() => {
          form.resetFields()
          setConflict(false)
          setConflictReloaded(true)
        }}
      >
        <p>내가 바꾼 내용은 아직 저장되지 않았어요. 최신 내용을 불러온 뒤 다시 확인하고 저장해 주세요.</p>
        <p className="text-caption text-(--ant-color-text-tertiary)">최신 내용을 불러오면 지금 입력한 값은 사라져요</p>
      </Modal>
      <Modal
        open={showHistory}
        title={`변경 이력 · ${course?.name}`}
        centered
        footer={null}
        onCancel={() => setShowHistory(false)}
        mask={{ blur: false }}
        classNames={{ body: 'max-h-[calc(100svh-200px)] overflow-y-auto' }}
      >
        {[...(course?.history ?? [])].reverse().map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col gap-xs border-0 border-b border-solid border-(--ant-color-border-secondary) py-md last:border-b-0"
          >
            <p className="m-0 text-body font-medium">{entry.label}</p>
            <p className="m-0 break-words text-body text-(--ant-color-primary)">
              {entry.before} <ArrowRightOutlined aria-label="에서" /> {entry.after}
            </p>
            <p className="m-0 text-caption">{entry.reason || '사유 없음 (진행 중 과정의 일반 수정)'}</p>
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
              {formatActionTime(entry.createdAt, true)} · {entry.actor}
            </p>
          </div>
        ))}
      </Modal>
    </div>
  )
}
