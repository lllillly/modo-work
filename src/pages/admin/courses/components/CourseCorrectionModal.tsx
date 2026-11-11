import { useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Alert, DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

import type { CourseDraft, ManagedCourse } from '../../../../types/adminCourses'
import { getCoursePeriod, getCourseState } from '../courseManagementData'
import { courseAreas, courseAssignees } from '../courseManagementMockData'

type CourseCorrectionModalProps = {
  course: ManagedCourse
  initialAreaId?: string
  type: 'endDate' | 'assignee'
  onClose: () => void
  onSave: (draft: CourseDraft, reason: string) => void
}

type CorrectionValues = { endDate: Dayjs; areaId: string; userId: string; reason: string }

export default function CourseCorrectionModal({
  course,
  initialAreaId,
  type,
  onClose,
  onSave,
}: CourseCorrectionModalProps) {
  const [form] = Form.useForm<CorrectionValues>()
  const replaceableAreas = courseAreas.filter((area) =>
    courseAssignees.some((user) => user.status === 'INACTIVE' && course.assignees[area.id]?.includes(user.id)),
  )
  const [areaId, setAreaId] = useState(initialAreaId ?? replaceableAreas[0]?.id ?? courseAreas[0].id)
  const endDate = Form.useWatch('endDate', form) ?? dayjs(course.endDate)
  const userId = Form.useWatch('userId', form)
  const currentUsers = courseAssignees.filter((user) => course.assignees[areaId]?.includes(user.id))
  const nextUser = courseAssignees.find((user) => user.id === userId)
  const candidates = courseAssignees.filter(
    (user) =>
      user.status === 'ACTIVE' &&
      user.orgUnitId === course.orgUnitId &&
      user.areaIds.includes(areaId) &&
      !course.assignees[areaId]?.includes(user.id),
  )
  const currentPeriod = getCoursePeriod(course.startDate, course.endDate)
  const nextPeriod = getCoursePeriod(course.startDate, endDate.format('YYYY-MM-DD'))

  return (
    <Modal
      open
      title={
        type === 'endDate' ? '종료일 정정' : `담당자 교체 · ${courseAreas.find((area) => area.id === areaId)?.name}`
      }
      width={500}
      centered
      className="max-w-[calc(100vw-32px)]"
      mask={{ blur: false }}
      destroyOnHidden
      classNames={{ body: 'max-h-[calc(100svh-200px)] overflow-y-auto pt-sm' }}
      okText={type === 'endDate' ? '정정하기' : '교체하기'}
      cancelText="취소"
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{ endDate: dayjs(course.endDate), areaId }}
        onFinish={(values) => {
          const inactiveIds = currentUsers.filter((user) => user.status === 'INACTIVE').map((user) => user.id)
          const keptIds = (course.assignees[areaId] ?? []).filter((id) => !inactiveIds.includes(id))
          const assignees =
            type === 'assignee' ? { ...course.assignees, [areaId]: [...keptIds, values.userId] } : course.assignees
          onSave(
            {
              ...course,
              endDate: type === 'endDate' ? values.endDate.format('YYYY-MM-DD') : course.endDate,
              assignees,
            },
            values.reason.trim(),
          )
        }}
      >
        {type === 'assignee' && replaceableAreas.length > 1 && (
          <Form.Item name="areaId" label="교체할 영역" className="mb-md">
            <Select
              aria-label="교체할 영역"
              options={replaceableAreas.map((area) => ({ value: area.id, label: area.name }))}
              onChange={(id) => {
                setAreaId(id)
                form.setFieldValue('userId', undefined)
              }}
            />
          </Form.Item>
        )}
        <div className="grid grid-cols-1 items-start gap-xs min-[480px]:grid-cols-[minmax(0,1fr)_16px_minmax(0,1fr)]">
          <Form.Item label={type === 'endDate' ? '지금 종료일' : '지금 담당자'} className="mb-md">
            <Input
              disabled
              value={
                type === 'endDate'
                  ? dayjs(course.endDate).locale('ko').format('YYYY.MM.DD (dd)')
                  : currentUsers
                      .map((user) => `${user.name}${user.status === 'INACTIVE' ? ' · 비활성' : ''}`)
                      .join(', ') || '미배정'
              }
            />
          </Form.Item>
          <ArrowRightOutlined aria-hidden className="mt-9 hidden text-(--ant-color-text-tertiary) min-[480px]:block" />
          {type === 'endDate' ? (
            <Form.Item
              name="endDate"
              label="새 종료일"
              className="mb-md"
              rules={[
                { required: true, message: '새 종료일을 선택해 주세요.' },
                {
                  validator: (_, value: Dayjs | undefined) =>
                    value && value.isBefore(course.startDate, 'day')
                      ? Promise.reject(new Error('시작일 이후 날짜를 선택해 주세요.'))
                      : value?.format('YYYY-MM-DD') === course.endDate
                        ? Promise.reject(new Error('지금 종료일과 다른 날짜를 선택해 주세요.'))
                        : Promise.resolve(),
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
          ) : (
            <Form.Item
              name="userId"
              label="새 담당자"
              className="mb-md"
              rules={[{ required: true, message: '새 담당자를 선택해 주세요.' }]}
            >
              <Select
                aria-label="새 담당자"
                showSearch={{ optionFilterProp: 'label' }}
                placeholder="이름·이메일로 찾기"
                options={candidates.map((user) => ({ value: user.id, label: `${user.name} · ${user.email}` }))}
              />
            </Form.Item>
          )}
        </div>
        <Alert
          type="warning"
          className="mb-md"
          title={
            <ul className="m-0 flex list-disc flex-col gap-xs pl-md text-caption">
              {type === 'endDate' ? (
                <>
                  <li>
                    구분이 {currentPeriod.label}({currentPeriod.days}일) <ArrowRightOutlined aria-label="에서" />{' '}
                    {nextPeriod.label}({nextPeriod.days}일)로{' '}
                    {currentPeriod.label === nextPeriod.label ? '유지돼요.' : '바뀌어요.'} 미완료 할 일 마감이 다시
                    계산돼요.
                  </li>
                  <li>완료한 할 일과 처리 기록은 그대로예요.</li>
                  <li>새 종료일이 오늘 이후라면 과정 정보를 다시 수정할 수 있어요.</li>
                </>
              ) : (
                <>
                  <li>
                    미완료 할 일 {course.pendingByArea[areaId] ?? 0}건이 {nextUser?.name ?? '새 담당자'}에게 넘어가요.
                  </li>
                  <li>
                    마감과 완료 이력은 그대로예요.
                    {getCourseState(course) === '종료' && ' 과정은 계속 종료 상태로 남아요.'}
                  </li>
                </>
              )}
            </ul>
          }
        />
        {type === 'assignee' && (
          <p className="text-caption text-(--ant-color-text-tertiary)">새 담당자 후보는 활성 담당자만 나와요.</p>
        )}
        <Form.Item
          name="reason"
          label={type === 'endDate' ? '정정 사유' : '교체 사유'}
          rules={[{ required: true, whitespace: true, message: '사유를 입력해 주세요.' }, { max: 200 }]}
        >
          <Input.TextArea rows={3} maxLength={200} showCount classNames={{ textarea: 'resize-none' }} />
        </Form.Item>
        <p className="mt-lg mb-0 text-caption text-(--ant-color-text-tertiary)">
          변경 이력에 변경 전후 값, 수정자, 시각, 사유가 남아요.
        </p>
      </Form>
    </Modal>
  )
}
