import { useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Alert, Button, Card, DatePicker, Drawer, Form, Input, Modal } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'

import type { CourseTasksCourse } from '../../../types/courseTasks'
import { getToday } from '../../home/dateUtils'
import { formatActionTime, getCourseDays, getMonthlyCycles } from '../courseTasksData'

type CourseScheduleProps = {
  course: CourseTasksCourse
  isMobile: boolean
  canEdit: boolean
  onSave: (startDate: string, endDate: string, reason: string) => void
}

export default function CourseSchedule({ course, isMobile, canEdit, onSave }: CourseScheduleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [form] = Form.useForm<{ startDate: Dayjs; endDate: Dayjs; reason?: string }>()
  const selectedStartDate: Dayjs | undefined = Form.useWatch('startDate', form)
  const selectedEndDate: Dayjs | undefined = Form.useWatch('endDate', form)
  const isEnded = course.endDate < getToday()
  const isReadOnly = course.archived || isEnded

  const startDate = selectedStartDate ?? dayjs(course.startDate)
  const endDate = selectedEndDate ?? dayjs(course.endDate)
  const isValidRange = startDate.isValid() && endDate.isValid() && !endDate.isBefore(startDate, 'day')
  const nextCourse = { ...course, startDate: startDate.format('YYYY-MM-DD'), endDate: endDate.format('YYYY-MM-DD') }

  const currentDays = getCourseDays(course)
  const nextDays = isValidRange ? getCourseDays(nextCourse) : currentDays
  const currentCycleCount = getMonthlyCycles(course.startDate, course.endDate, course.monthlyOffsetDays).length
  const nextCycleCount = isValidRange ? getMonthlyCycles(nextCourse.startDate, nextCourse.endDate, course.monthlyOffsetDays).length : currentCycleCount
  const currentLengthType = currentDays >= 180 ? '장기' : '단기'
  const nextLengthType = nextDays >= 180 ? '장기' : '단기'

  const scheduleForm = (
    <Form form={form} layout="vertical" className="flex flex-col gap-md" initialValues={{ startDate: dayjs(course.startDate), endDate: dayjs(course.endDate) }} preserve={false}
      onFinish={(values) => { onSave(values.startDate.format('YYYY-MM-DD'), values.endDate.format('YYYY-MM-DD'), values.reason?.trim() ?? ''); setIsEditing(false) }}>
      <div className={`grid gap-md ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Form.Item name="startDate" label="시작일" className="mb-0 min-w-0" rules={[{ required: true, message: '시작일을 입력해 주세요.' }]}>
          <DatePicker format="YYYY-MM-DD" allowClear={false} className="h-10 w-full min-w-0" />
        </Form.Item>
        <Form.Item name="endDate" label="종료일" className="mb-0 min-w-0" dependencies={['startDate']} rules={[
          { required: true, message: '종료일을 입력해 주세요.' },
          ({ getFieldValue }) => ({ validator: (_, value: Dayjs | null) => !value || !getFieldValue('startDate') || !value.isBefore(getFieldValue('startDate'), 'day')
            ? Promise.resolve() : Promise.reject(new Error('종료일은 시작일보다 빠를 수 없어요.')) }),
        ]}>
          <DatePicker format="YYYY-MM-DD" allowClear={false} className="h-10 w-full min-w-0" />
        </Form.Item>
      </div>
      {/* API 연동 후에는 서버의 변경 결과와 상태에 맞춰 안내 문구가 수정되도록 할 예정입니다 */}
      <Alert type="info" className="p-sm" classNames={{ title: 'text-caption font-regular' }} title={isValidRange ? (
        <ul className="m-0 flex list-disc flex-col gap-xxs pl-md">
          <li>지금 {course.startDate} ~ {course.endDate} <ArrowRightOutlined aria-label="에서" /> 바꾼 뒤 {nextCourse.startDate} ~ {nextCourse.endDate}</li>
          <li>월 주기 {currentCycleCount}개 <ArrowRightOutlined aria-label="에서" /> {nextCycleCount}개로 {nextCycleCount > currentCycleCount ? '늘고' : nextCycleCount < currentCycleCount ? '줄고' : '같고'}, 미완료 할 일 마감이 다시 계산됩니다.</li>
          <li>구분은 {currentLengthType}({currentDays}일) <ArrowRightOutlined aria-label="에서" /> {nextLengthType}({nextDays}일), {currentLengthType === nextLengthType ? '그대로입니다.' : '바뀝니다.'}</li>
          <li>완료한 할 일과 처리 기록은 유지됩니다</li>
        </ul>
      ) : '시작일과 종료일을 확인해 주세요.'} />
      <Form.Item name="reason" label="바꾸는 이유 (선택)" className="mb-0">
        <Input.TextArea rows={4} placeholder="남기면 변경 이력에 같이 보여요" className="h-24 min-h-24 resize-none" />
      </Form.Item>
    </Form>
  )

  return (
    <>
      <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'p-0' : 'px-lg py-12' }}>
        <div className="flex flex-wrap items-center gap-xs min-[992px]:gap-sm">
          {isMobile ? (
            <span className="text-body">{course.startDate} ~ {course.endDate}</span>
          ) : (
            <>
              <label htmlFor="course-start-date" className="text-caption text-(--ant-color-text-secondary)">시작일</label>
              <Input id="course-start-date" value={course.startDate} readOnly disabled={isReadOnly} className="w-[140px]" />
              <label htmlFor="course-end-date" className="text-caption text-(--ant-color-text-secondary)">종료일</label>
              <Input id="course-end-date" value={course.endDate} readOnly disabled={isReadOnly} className="w-[140px]" />
            </>
          )}
          {canEdit && <Button type="link" className="ml-auto px-0 text-caption" onClick={() => setIsEditing(true)}>일정 수정</Button>}
          {!isMobile && <span className={`${canEdit ? '' : 'ml-auto'} text-caption text-(--ant-color-text-tertiary)`}>{isReadOnly ? '종료되거나 보관된 과정의 일정은 변경할 수 없어요' : canEdit ? '일정을 바꾸면 미완료 할 일 마감과 월 주기가 다시 계산돼요' : '이 과정의 일정 수정 권한이 없어요'}</span>}
          <Button type="link" className={`${isMobile ? 'ml-auto h-auto' : ''} px-0 text-caption`} onClick={() => setShowHistory(true)}>변경 이력 {course.changeHistory.length}건</Button>
        </div>
      </Card>

      {!isMobile && <Modal
        open={isEditing && canEdit}
        title={<div className="flex min-w-0 flex-col gap-xxs pr-lg">
          <h2 className="m-0 text-card-title font-bold">과정 일정 수정</h2>
          <p className="m-0 break-words text-caption font-regular text-(--ant-color-text-tertiary)">{course.name}</p>
        </div>}
        width={480} centered className="max-w-[calc(100vw-32px)]" mask={{ blur: false }}
        classNames={{ container: 'p-lg', header: 'mb-0 border-0 border-b border-solid border-(--ant-color-border-secondary) pb-md', body: 'max-h-[calc(100svh-220px)] overflow-y-auto pt-md',
          footer: `mt-lg flex gap-xs border-0 border-t border-solid border-(--ant-color-border-secondary) pt-md [&>button]:m-0 ${isMobile ? '[&>button]:flex-1' : 'justify-end'}` }}
        okText="저장" cancelText="취소" onCancel={() => setIsEditing(false)}
        okButtonProps={{ className: 'h-9 min-w-20 shadow-none' }} cancelButtonProps={{ className: 'h-9 min-w-20 shadow-none' }}
        onOk={() => form.submit()} destroyOnHidden
      >
        {scheduleForm}
      </Modal>}
      {isMobile && (
        <Drawer
          open={isEditing && canEdit} placement="bottom" size="auto" closable={false}
          onClose={() => setIsEditing(false)} mask={{ blur: false, closable: true }} destroyOnHidden
          title={<div><div aria-hidden className="mx-auto mb-md h-1 w-9 rounded-full bg-(--ant-color-fill-tertiary)" />일정 수정</div>}
          classNames={{ section: 'max-h-[calc(100svh-16px)] rounded-t-lg', header: 'border-0 px-md pt-sm pb-sm', body: 'min-h-0 overflow-y-auto px-md pt-0 pb-md', footer: 'border-0 p-md pt-0' }}
          footer={<div className="flex gap-xs"><Button className="h-9 flex-1 shadow-none" onClick={() => setIsEditing(false)}>취소</Button><Button type="primary" className="h-9 flex-1 shadow-none" onClick={() => form.submit()}>저장</Button></div>}
        >
          {scheduleForm}
        </Drawer>
      )}

      <Modal
        open={showHistory} title={<span className="text-card-title leading-5 font-bold">변경 이력 · {course.name}</span>}
        width={560} centered footer={null} className="max-w-[calc(100vw-32px)] pb-0" onCancel={() => setShowHistory(false)}
        mask={{ blur: false }} classNames={{ container: 'flex max-h-[calc(100svh-32px)] flex-col overflow-hidden p-lg shadow-none',
          header: 'mb-0 shrink-0 border-0 border-b border-solid border-(--ant-color-border-secondary) pb-md leading-5', title: 'pr-lg leading-5', body: 'min-h-0 overflow-y-auto' }}
      >
        {course.changeHistory.length === 0 ? <p className="my-md text-(--ant-color-text-secondary)">변경 이력이 없어요.</p> : (
          <ul aria-label="과정 변경 이력" className="m-0 list-none p-0">
            {[...course.changeHistory].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => (
              <li key={entry.id} className="flex flex-col gap-xs border-0 border-b border-solid border-(--ant-color-border-secondary) py-md last:border-b-0 last:pb-0">
                <p className="m-0 flex flex-wrap items-center gap-x-xs gap-y-xxs text-body leading-5">
                  <span className="font-medium">{entry.label}</span>
                  <span className="inline-flex flex-wrap items-center gap-xxs text-(--ant-color-primary)">
                    {entry.before}<ArrowRightOutlined aria-hidden className="text-caption" /><span className="sr-only">에서 </span>{entry.after}
                  </span>
                </p>
                <p className="m-0 text-caption text-(--ant-color-text-secondary)">{entry.reason ? `사유: ${entry.reason}` : '사유 없음 (진행 중 과정의 일반 수정)'}{entry.description && ` · ${entry.description}`}</p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)"><time dateTime={entry.createdAt}>{formatActionTime(entry.createdAt, true)}</time> · {entry.actor}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
