import { Card } from 'antd'

export default function CourseTasksEmpty() {
  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'px-lg py-16 text-center' }}>
      <h2 className="m-0 text-[18px] leading-[26px] font-medium">이 과정에 할 일이 없어요</h2>
      <p className="mt-xs mb-0 text-body text-(--ant-color-text-secondary)">
        사업 템플릿에 항목이 없으면 할 일이 만들어지지 않아요. 관리자에게 템플릿 확인을 요청해 주세요.
      </p>
    </Card>
  )
}
