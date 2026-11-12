import { useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Alert, DatePicker, Form, Input, Modal } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

import type { CourseDraft, ManagedCourse } from '../../../../types/adminCourses'
import { getCoursePeriod, hasAssignmentChanges } from '../courseManagementData'
import type { OptionItem } from '../../../../types/courseApi'
import { ApiError, getApiErrorMessage } from '../../../../api/client'
import AssigneeFields from './AssigneeFields'

type CourseCorrectionModalProps = {
  course: ManagedCourse
  businessId: string
  orgUnitName?: string
  areaNames?: Record<string, string>
  areas: OptionItem[]
  isSaving: boolean
  blocked: boolean
  type: 'endDate' | 'assignee'
  onClose: () => void
  onSave: (draft: CourseDraft, reason: string) => Promise<void>
}

type CorrectionValues = { endDate: Dayjs; assignees: CourseDraft['assignees']; reason: string }

export default function CourseCorrectionModal({
  course,
  businessId,
  orgUnitName,
  areaNames,
  areas,
  isSaving,
  blocked,
  type,
  onClose,
  onSave,
}: CourseCorrectionModalProps) {
  const [form] = Form.useForm<CorrectionValues>()
  const endDate = Form.useWatch('endDate', form) ?? dayjs(course.endDate)
  const [error, setError] = useState('')
  const currentPeriod = getCoursePeriod(course.startDate, course.endDate)
  const nextPeriod = getCoursePeriod(course.startDate, endDate.format('YYYY-MM-DD'))

  return (
    <Modal
      open
      title={type === 'endDate' ? '종료일 정정' : '담당 배정 변경'}
      width={500}
      centered
      className="max-w-[calc(100vw-32px)]"
      mask={{ blur: false, closable: !isSaving }}
      destroyOnHidden
      classNames={{ body: 'max-h-[calc(100svh-200px)] overflow-y-auto pt-sm' }}
      okText={type === 'endDate' ? '정정하기' : '변경하기'}
      cancelText="취소"
      confirmLoading={isSaving}
      okButtonProps={{ disabled: blocked }}
      closable={!isSaving}
      cancelButtonProps={{ disabled: isSaving }}
      onCancel={() => {
        if (!isSaving) onClose()
      }}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        disabled={isSaving || blocked}
        layout="vertical"
        preserve={false}
        initialValues={{ endDate: dayjs(course.endDate), assignees: course.assignees }}
        onFinish={async (values) => {
          if (isSaving || blocked) return
          setError('')
          try {
            await onSave(
              {
                ...course,
                endDate: type === 'endDate' ? values.endDate.format('YYYY-MM-DD') : course.endDate,
                assignees: type === 'assignee' ? values.assignees : course.assignees,
              },
              values.reason.trim(),
            )
          } catch (error) {
            setError(getApiErrorMessage(error))
            if (error instanceof ApiError) {
              const fieldNames = ['endDate', 'assignees', 'reason'] as const
              form.setFields(
                error.fieldErrors.flatMap((entry) => {
                  const name = entry.field.startsWith('assignees')
                    ? 'assignees'
                    : fieldNames.find((field) => field === entry.field)
                  return name ? [{ name, errors: [entry.message] }] : []
                }),
              )
            }
          }
        }}
      >
        {error && <Alert className="mb-md" type="error" showIcon title={error} />}
        {type === 'endDate' ? (
          <div
            className="grid grid-cols-1 items-start gap-xs
          min-[480px]:grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)]"
          >
            <Form.Item label="지금 종료일" className="mb-md">
              <Input disabled value={dayjs(course.endDate).locale('ko').format('YYYY.MM.DD (dd)')} />
            </Form.Item>
            <ArrowRightOutlined
              aria-hidden
              className="mt-9 hidden text-(--ant-color-text-tertiary) min-[480px]:block"
            />
            <Form.Item
              name="endDate"
              label="새 종료일"
              className="mb-md"
              rules={[
                { required: true, message: '새 종료일을 선택해 주세요.' },
                {
                  validator: (_, value: Dayjs | undefined) => {
                    if (value?.isBefore(course.startDate, 'day')) {
                      return Promise.reject(new Error('시작일 이후 날짜를 선택해 주세요.'))
                    }
                    if (value?.format('YYYY-MM-DD') === course.endDate) {
                      return Promise.reject(new Error('지금 종료일과 다른 날짜를 선택해 주세요.'))
                    }
                    return Promise.resolve()
                  },
                },
              ]}
            >
              <DatePicker
                aria-label="새 종료일"
                allowClear={false}
                format={['YYYY.MM.DD (dd)', 'YYYY.MM.DD', 'YYYY-MM-DD']}
                className="w-full"
              />
            </Form.Item>
          </div>
        ) : (
          <Form.Item
            name="assignees"
            label="영역별 담당자"
            className="mb-md"
            rules={[
              {
                validator: (_, value: CourseDraft['assignees']) =>
                  hasAssignmentChanges(course.assignees, value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('담당 배정을 변경해 주세요.')),
              },
            ]}
          >
            <AssigneeFields
              businessId={businessId}
              orgUnitId={course.orgUnitId}
              orgUnitName={orgUnitName}
              courseId={course.id}
              areas={areas}
              areaNames={areaNames}
              assignedUsers={course.assignedUsers}
              readOnly={isSaving || blocked}
            />
          </Form.Item>
        )}
        <Alert
          type="warning"
          className="mb-md"
          title={
            <ul className="m-0 flex list-disc flex-col gap-xs pl-md text-caption">
              {type === 'endDate' ? (
                <>
                  <li>
                    구분이 {currentPeriod.label}({currentPeriod.days}일){' '}
                    <ArrowRightOutlined aria-label="에서" /> {nextPeriod.label}({nextPeriod.days}일)로{' '}
                    {currentPeriod.label === nextPeriod.label ? '유지돼요.' : '바뀌어요.'} 미완료 할 일
                    마감이 다시 계산돼요.
                  </li>
                  <li>완료한 할 일과 처리 기록은 그대로예요.</li>
                  <li>새 종료일이 오늘 이후라면 과정 정보를 다시 수정할 수 있어요.</li>
                </>
              ) : (
                <>
                  <li>미완료 할 일은 변경된 담당 배정으로 보여요.</li>
                  <li>마감과 완료 이력은 그대로예요. 과정은 계속 종료 상태로 남아요.</li>
                </>
              )}
            </ul>
          }
        />
        {type === 'assignee' && (
          <p className="text-caption text-(--ant-color-text-tertiary)">
            새 담당자 후보는 활성 담당자만 나와요.
          </p>
        )}
        <Form.Item
          name="reason"
          label={type === 'endDate' ? '정정 사유' : '변경 사유'}
          rules={[{ required: true, whitespace: true, message: '사유를 입력해 주세요.' }, { max: 1000 }]}
        >
          <Input.TextArea rows={3} maxLength={1000} showCount classNames={{ textarea: 'resize-none' }} />
        </Form.Item>
        <p className="mt-lg mb-0 text-caption text-(--ant-color-text-tertiary)">
          변경 전후 값과 수정자, 시각, 사유가 기록돼요.
        </p>
      </Form>
    </Modal>
  )
}
