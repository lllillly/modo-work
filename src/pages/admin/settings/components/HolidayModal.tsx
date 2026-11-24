import { DatePicker, Form, Input, Modal } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

import type { Holiday } from '../../../../types/holidays'

type HolidayModalProps = {
  holiday: Holiday | null
  saving: boolean
  onCancel: () => void
  onSave: (values: { date: string; name: string }) => void
}

type HolidayForm = { date: Dayjs; name: string }

export default function HolidayModal({ holiday, saving, onCancel, onSave }: HolidayModalProps) {
  const [form] = Form.useForm<HolidayForm>()

  return (
    <Modal
      open
      title={holiday ? '회사 휴무일 수정' : '회사 휴무일 추가'}
      okText={holiday ? '저장' : '추가'}
      cancelText="취소"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onCancel}
      destroyOnHidden
    >
      <Form<HolidayForm>
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={holiday ? { date: dayjs(holiday.date), name: holiday.name } : undefined}
        onFinish={(values) => onSave({ date: values.date.format('YYYY-MM-DD'), name: values.name.trim() })}
        className="mt-md"
      >
        <Form.Item name="date" label="날짜" rules={[{ required: true, message: '날짜를 골라 주세요' }]}>
          <DatePicker className="w-full" format="YYYY.MM.DD" />
        </Form.Item>
        <Form.Item
          name="name"
          label="이름"
          rules={[{ required: true, whitespace: true, message: '이름을 입력해 주세요' }]}
          extra="예: 창립기념일, 사내 워크숍"
        >
          <Input maxLength={100} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
