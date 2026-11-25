import { useCallback, useState } from 'react'
import { CheckCircleOutlined, LockOutlined, WarningOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
} from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { Link, useNavigate } from 'react-router'

import type { CourseDraft, CourseSaveResult, ManagedCourse } from '../../../../types/adminCourses'
import { ApiError, getApiErrorMessage, isConflict } from '../../../../api/client'
import { getCourseChanges, replaceAssignees, updateSchedule } from '../../../../api/courses'
import type { AssignmentContext, OptionItem, ScheduleContext } from '../../../../types/courseApi'
import { useAuth } from '../../../../providers/AuthContext'
import { CourseSaveError, requiresSaveReload, saveManagedCourse } from '../courseManagementApi'
import { getCoursePeriod, getInactiveAssignees, getOrgUnitName } from '../courseManagementData'
import { getCourseTaskSummary, getPendingTasksByArea } from '../../../../api/tasks'
import type { CourseTaskSummary } from '../../../../types/taskApi'
import useApiQuery from '../../../../hooks/useApiQuery'
import CourseChangesModal from './CourseChangesModal'
import AssigneeFields from './AssigneeFields'
import CourseCorrectionModal from './CourseCorrectionModal'
import PageTitle from '../../../../components/layout/PageTitle'
import ContentCard from '../../../../components/common/ContentCard'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import { formatDateTime } from '../../../../utils/date'

const HISTORY_SUMMARY_SIZE = 1

type CourseEditorProps = {
  businessId: string
  course?: ManagedCourse
  orgUnits: OptionItem[]
  areas: OptionItem[]
  schedule?: ScheduleContext
  assignment?: AssignmentContext
  onReload: () => void
}

type CourseFormValues = Omit<CourseDraft, 'startDate' | 'endDate'> & { startDate: Dayjs; endDate: Dayjs }

export default function CourseEditor({
  businessId,
  course,
  orgUnits,
  areas,
  schedule,
  assignment,
  onReload,
}: CourseEditorProps) {
  const navigate = useNavigate()
  const { modal } = App.useApp()
  const { user } = useAuth()
  const { checkLogin } = useApiErrorHandler()
  const [form] = Form.useForm<CourseFormValues>()
  const [result, setResult] = useState<CourseSaveResult | null>(null)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [needsReload, setNeedsReload] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [correction, setCorrection] = useState<{ type: 'endDate' | 'assignee' } | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const isEnded = !!course?.isReadOnly
  const readOnly = isEnded || needsReload
  const startDate = Form.useWatch('startDate', form)
  const endDate = Form.useWatch('endDate', form)
  const orgUnitId = Form.useWatch('orgUnitId', form) ?? course?.orgUnitId ?? ''
  const orgUnitName =
    getOrgUnitName(orgUnitId, orgUnits, user) ?? (orgUnitId === course?.orgUnitId ? course.orgUnitName : undefined)
  const knownAreaNames = {
    ...course?.areaNames,
    ...Object.fromEntries(
      [
        ...(user?.areas ?? []),
        ...(user?.roles.flatMap((role) => (role.area ? [role.area] : [])) ?? []),
        ...areas,
      ].map((area) => [area.id, area.name]),
    ),
  }
  const needsAreaNames = Object.keys(course?.assignees ?? {}).some((id) => !knownAreaNames[id])
  const needsPendingCounts = !!course && isEnded && getInactiveAssignees(course).length > 0
  const courseId = course?.id
  const loadTaskSummary = useCallback(
    async (signal: AbortSignal): Promise<CourseTaskSummary> => {
      if (!courseId) throw new Error('과정을 먼저 선택해 주세요.')
      if (needsAreaNames) return getCourseTaskSummary(businessId, courseId, signal)
      const pendingByArea = await getPendingTasksByArea(businessId, courseId, signal)
      return { areaNames: {}, pendingByArea }
    },
    [businessId, courseId, needsAreaNames],
  )
  const loadHistorySummary = useCallback(
    async (signal: AbortSignal) => {
      if (!courseId) throw new Error('과정을 먼저 선택해 주세요.')
      return getCourseChanges(courseId, 0, signal, HISTORY_SUMMARY_SIZE)
    },
    [courseId],
  )
  const historySummary = useApiQuery(
    courseId ? `${courseId}:${course?.version}` : null,
    loadHistorySummary,
  )
  const taskSummary = useApiQuery(
    courseId && (needsAreaNames || needsPendingCounts)
      ? `${businessId}:${courseId}:${needsAreaNames}`
      : null,
    loadTaskSummary,
  )
  const areaNames = { ...knownAreaNames, ...taskSummary.data?.areaNames }

  const assignees: CourseDraft['assignees'] | undefined = Form.useWatch('assignees', form)
  const validPeriod = startDate?.isValid() && endDate?.isValid() && !endDate.isBefore(startDate, 'day')
  const period = validPeriod
    ? getCoursePeriod(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
    : null

  const saveSummary = result
    ? [
        {
          label: '새로 만든 할 일',
          count: result.generatedTaskCount ?? result.recalculation?.createdTaskCount,
        },
        { label: '마감이 바뀐 할 일', count: result.recalculation?.deadlineChangedTaskCount },
        { label: '보존한 완료 할 일', count: result.recalculation?.preservedCompletedTaskCount },
        { label: '배정이 바뀐 미완료 할 일', count: result.assignmentChangedTaskCount },
      ].filter((item) => item.count !== undefined)
    : []

  function showSaveError(error: unknown) {
    const failure = error instanceof CourseSaveError ? error : new CourseSaveError(error, [])
    const cause = failure.cause
    const savedMessage = failure.completed.length ? `${failure.completed.join(', ')}은 저장됐어요. ` : ''
    setSaveError(`${savedMessage}${getApiErrorMessage(cause)}`)
    setNeedsReload(requiresSaveReload(failure))

    if (cause instanceof ApiError) {
      const fieldNames = [
        'externalKey',
        'name',
        'orgUnitId',
        'startDate',
        'endDate',
        'capacity',
        'assignees',
      ] as const
      const fields = cause.fieldErrors.flatMap((entry) => {
        const name = entry.field.startsWith('assignees')
          ? 'assignees'
          : fieldNames.find((field) => field === entry.field)
        return name ? [{ name, errors: [entry.message] }] : []
      })
      form.setFields(fields)
      if (isConflict(cause)) setConflict(true)
      checkLogin(cause)
    }
  }

  async function submit(values: CourseFormValues) {
    if (readOnly || isSaving) return
    setIsSaving(true)
    setSaveError('')

    try {
      const saved = await saveManagedCourse(
        businessId,
        {
          externalKey: values.externalKey.trim(),
          orgUnitId: values.orgUnitId,
          name: values.name.trim(),
          startDate: values.startDate.format('YYYY-MM-DD'),
          endDate: values.endDate.format('YYYY-MM-DD'),
          capacity: values.capacity ?? null,
          assignees: values.assignees,
        },
        course,
      )
      setResult(saved)
    } catch (error) {
      showSaveError(error)
    } finally {
      setIsSaving(false)
    }
  }

  async function saveCorrection(draft: CourseDraft, reason: string) {
    if (!course || !correction || isSaving || needsReload) return
    setIsSaving(true)
    try {
      if (correction.type === 'endDate') {
        const response = await updateSchedule(
          course.id,
          course.version,
          course.startDate,
          draft.endDate,
          reason,
        )
        setResult({
          courseId: course.id,
          completed: ['종료일 정정'],
          recalculation: response.recalculation,
        })
      } else {
        const response = await replaceAssignees(course.id, course.version, draft.assignees, reason)
        setResult({
          courseId: course.id,
          completed: ['담당자 교체'],
          assignmentChangedTaskCount: response.assignmentChange.assignmentChangedTaskCount,
        })
      }
      setCorrection(null)
    } catch (error) {
      showSaveError(error)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  function cancelEdit() {
    if (readOnly || !form.isFieldsTouched()) {
      navigate('/admin/courses')
      return
    }
    modal.confirm({
      title: '변경 내용을 버릴까요?',
      content: '저장하지 않은 내용은 사라져요.',
      okText: '버리기',
      cancelText: '계속 수정',
      onOk: () => navigate('/admin/courses'),
    })
  }

  function changeOrgUnit(nextOrgId: string) {
    const hasAssignees = Object.values(assignees ?? {}).some((ids) => ids.length > 0)
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
          items={[
            { title: <Link to="/admin/courses">과정·담당 배정</Link> },
            { title: course?.name ?? '과정 추가' },
          ]}
        />
        <PageTitle>{readOnly ? '과정 보기' : course ? '과정 수정' : '과정 추가'}</PageTitle>
      </div>
      {isEnded && (
        <Alert
          type="info"
          showIcon
          icon={<LockOutlined />}
          title={
            <div className="flex flex-wrap items-center justify-between gap-sm text-caption">
              <span>
                종료된 과정이에요({course?.endDate.replaceAll('-', '.')} 종료). 과정 정보는 바꿀 수 없고,
                관리자가 사유를 남기고 종료일을 정정하거나 담당 배정을 바꿀 수 있어요.
              </span>
              {(schedule?.permissions.canCorrectEndDate ||
                assignment?.permissions.canReplaceEndedAssignments) && (
                <span className="flex gap-xs">
                  <Button
                    disabled={isSaving || needsReload || !schedule?.permissions.canCorrectEndDate}
                    onClick={() => setCorrection({ type: 'endDate' })}
                  >
                    종료일 정정
                  </Button>
                  <Button
                    disabled={
                      isSaving || needsReload || !assignment?.permissions.canReplaceEndedAssignments
                    }
                    onClick={() => setCorrection({ type: 'assignee' })}
                  >
                    담당 배정 변경
                  </Button>
                </span>
              )}
            </div>
          }
        />
      )}
      {saveError && (
        <Alert
          type="error"
          showIcon
          title={saveError}
          action={
            needsReload && (
              <Button onClick={() => (course ? onReload() : navigate('/admin/courses'))}>
                {course ? '최신 내용 불러오기' : '목록에서 등록 여부 확인'}
              </Button>
            )
          }
        />
      )}

      <Form
        form={form}
        disabled={isSaving || needsReload}
        layout="vertical"
        requiredMark={!readOnly}
        onFinish={submit}
        scrollToFirstError
        initialValues={
          course
            ? { ...course, startDate: dayjs(course.startDate), endDate: dayjs(course.endDate) }
            : { capacity: null, assignees: {} }
        }
        className="flex flex-col gap-md [&_.ant-form-item-label]:pb-xxs
          [&_.ant-form-item-label>label]:text-caption"
      >
        <ContentCard>
          <h3 className="mt-0 mb-sm text-card-title font-medium">기본 정보</h3>
          <div className="grid grid-cols-1 gap-x-md min-[992px]:grid-cols-[260px_200px_minmax(0,1fr)]">
            {/* 기존 외부 키와 조직은 현재 수정 API의 변경 대상이 아님 */}
            <Form.Item
              name="externalKey"
              className="mb-sm"
              label="외부 키"
              extra={
                course
                  ? !readOnly && '이 화면에서는 기존 외부 키를 수정할 수 없어요'
                  : '시스템 전체에서 하나만 쓸 수 있어요'
              }
              rules={[
                { required: true, whitespace: true, message: '외부 키를 입력해 주세요.' },
                { max: 100 },
              ]}
            >
              <Input readOnly={readOnly} disabled={isSaving || (!!course && !readOnly)} maxLength={100} />
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
                open={readOnly ? false : undefined}
                suffixIcon={readOnly ? null : undefined}
                disabled={isSaving || (!!course && !readOnly)}
                placeholder="조직 단위 선택"
                className="w-full"
                options={[
                  ...orgUnits,
                  ...(course && !orgUnits.some((org) => org.id === course.orgUnitId)
                    ? [
                        {
                          id: course.orgUnitId,
                          name: course.orgUnitName ?? getOrgUnitName(course.orgUnitId, orgUnits, user) ?? '-',
                        },
                      ]
                    : []),
                ].map((org) => ({ value: org.id, label: org.name }))}
              />
            </Form.Item>
            <Form.Item
              name="name"
              className="mb-sm"
              label="과정명"
              rules={[
                { required: true, whitespace: true, message: '과정명을 입력해 주세요.' },
                { max: 255 },
              ]}
            >
              <Input readOnly={readOnly} disabled={isSaving} maxLength={255} />
            </Form.Item>
          </div>
          <div
            className="grid grid-cols-1 gap-md
            min-[992px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.6fr)]"
          >
            <div>
              <label className="mb-xs block text-caption" htmlFor="managed-course-start">
                기간 {!readOnly && <span className="text-(--ant-color-error-text)">*</span>}
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
                    inputReadOnly={readOnly}
                    open={readOnly ? false : undefined}
                    disabled={
                      isSaving || (!readOnly && !!course && !schedule?.permissions.canEditSchedule)
                    }
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
                    inputReadOnly={readOnly}
                    open={readOnly ? false : undefined}
                    disabled={
                      isSaving || (!readOnly && !!course && !schedule?.permissions.canEditSchedule)
                    }
                    allowClear={false}
                    format={['YYYY.MM.DD', 'YYYY-MM-DD']}
                    className="w-full"
                  />
                </Form.Item>
              </div>
              <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">
                시작일·종료일 포함
              </p>
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
              <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">
                180일 이상이면 장기
              </p>
            </div>
            <Form.Item name="capacity" label="정원" className="mb-0">
              <InputNumber
                readOnly={readOnly}
                disabled={isSaving}
                min={0}
                max={2147483647}
                precision={0}
                suffix="명"
                className="w-[120px]"
              />
            </Form.Item>
          </div>
        </ContentCard>
        <ContentCard>
          <h3 className="m-0 text-card-title font-medium">영역별 담당자</h3>
          <p className="mt-xxs mb-sm text-caption text-(--ant-color-text-secondary)">
            영역마다 여러 명을 배정할 수 있어요. 같은 영역은 한 명만 완료해도 완료로 처리돼요.
          </p>
          {taskSummary.isLoading && (
            <p role="status" className="text-caption">
              기존 업무 정보를 확인하고 있어요.
            </p>
          )}
          {!!taskSummary.error && (
            <Alert
              type="warning"
              showIcon
              className="mb-sm"
              title="기존 업무 정보를 불러오지 못했어요."
              action={
                <Button size="small" onClick={taskSummary.reload}>
                  다시 시도
                </Button>
              }
            />
          )}
          <Form.Item name="assignees" className="mb-0">
            <AssigneeFields
              businessId={businessId}
              orgUnitId={orgUnitId}
              orgUnitName={orgUnitName}
              areas={areas}
              areaNames={areaNames}
              pendingByArea={taskSummary.data?.pendingByArea}
              courseId={course?.id}
              assignedUsers={course?.assignedUsers}
              readOnly={
                readOnly || isSaving || (!!course && !assignment?.permissions.canReplaceAssignments)
              }
            />
          </Form.Item>
        </ContentCard>
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{
            body: 'flex flex-wrap items-center justify-between gap-sm p-md min-[992px]:px-lg',
          }}
        >
          <Button
            type="link"
            className="h-auto whitespace-normal p-0 text-left text-caption
              text-(--ant-color-text-tertiary)
              enabled:hover:text-(--ant-color-text-secondary)
              enabled:focus-visible:text-(--ant-color-text-secondary)"
            disabled={!course}
            onClick={() => setShowHistory(true)}
          >
            {course ? (
              <span>
                {historySummary.data ? `변경 이력 ${historySummary.data.totalElements}건` : '변경 이력'}
                {historySummary.data?.lastModifiedAt &&
                  ` · 마지막 수정 ${formatDateTime(historySummary.data.lastModifiedAt)} ${
                    historySummary.data.lastModifiedBy?.name ?? ''
                  }`}
                <span className="ml-xs text-[11px] text-(--ant-color-text-quaternary)">
                  클릭해서 자세히 보기
                </span>
              </span>
            ) : (
              '저장하면 할 일이 생성돼요'
            )}
          </Button>
          <div className="ml-auto flex flex-wrap items-center gap-xs">
            {!readOnly && (
              <span className="text-caption text-(--ant-color-text-secondary)">
                일정을 바꾸면 미완료 할 일을 다시 계산해요
              </span>
            )}
            <Button disabled={isSaving} onClick={cancelEdit}>
              {readOnly ? '목록으로' : '취소'}
            </Button>
            {!readOnly && (
              <Button type="primary" htmlType="submit" loading={isSaving}>
                저장
              </Button>
            )}
          </div>
        </Card>
      </Form>

      {course && correction && (
        <CourseCorrectionModal
          key={correction.type}
          course={course}
          type={correction.type}
          onClose={() => setCorrection(null)}
          businessId={businessId}
          orgUnitName={orgUnitName}
          areas={areas}
          areaNames={areaNames}
          isSaving={isSaving}
          blocked={needsReload}
          onSave={saveCorrection}
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
          if (!course && result) navigate(`/admin/courses/${result.courseId}`, { replace: true })
          else onReload()
        }}
        footer={
          <div className="flex justify-end gap-xs">
            <Button onClick={() => navigate('/admin/courses')}>목록으로</Button>
            <Button
              type="primary"
              onClick={() => {
                if (!result) return
                const query = new URLSearchParams({ courseId: result.courseId })
                navigate(`/tasks?${query}`)
              }}
            >
              과정별 할 일 보기
            </Button>
          </div>
        }
      >
        <p className="text-body text-(--ant-color-text-secondary)">
          {result?.completed.length
            ? `${result.completed.join(', ')} 저장을 마쳤어요.`
            : '변경된 내용이 없어요.'}
        </p>
        {saveSummary.length > 0 && (
          <dl
            className="m-0 flex flex-col gap-xs rounded-md bg-(--ant-color-fill-quaternary)
            p-md text-caption"
          >
            {saveSummary.map((item) => (
              <div key={item.label} className="flex justify-between gap-xs">
                <dt>{item.label}</dt>
                <dd className="m-0 font-medium">{item.count}건</dd>
              </div>
            ))}
          </dl>
        )}
      </Modal>
      <Modal
        open={conflict}
        title={
          <span>
            <WarningOutlined className="mr-xs text-(--ant-color-warning-text)" />
            과정 상태를 다시 확인해 주세요
          </span>
        }
        centered
        width={440}
        mask={{ blur: false }}
        okText="최신 내용 불러오기"
        cancelText="닫기"
        onCancel={() => setConflict(false)}
        onOk={() => {
          setConflict(false)
          onReload()
        }}
      >
        <p>
          다른 수정이나 종료 상태로 저장이 제한될 수 있어요. 이미 저장된 항목은 위 안내를 확인하고 최신
          내용과 비교해 주세요.
        </p>
        <p className="text-caption text-(--ant-color-text-tertiary)">
          최신 내용을 불러오면 지금 입력한 값은 사라져요
        </p>
      </Modal>
      {course && showHistory && (
        <CourseChangesModal
          courseId={course.id}
          courseName={course.name}
          orgUnits={orgUnits}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
