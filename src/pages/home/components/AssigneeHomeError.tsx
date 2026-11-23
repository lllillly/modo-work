import { ExclamationOutlined } from '@ant-design/icons'
import { Button, Card, Result } from 'antd'

type AssigneeHomeErrorProps = {
  onRetry: () => void
  title?: string
}

export default function AssigneeHomeError({ onRetry, title = '할 일을 불러오지 못했어요' }: AssigneeHomeErrorProps) {
  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      <Result
        status="error"
        className="px-0 py-10"
        classNames={{ icon: 'mb-sm', title: 'text-card-title', subTitle: 'mt-xs text-body', extra: 'mt-md' }}
        icon={<span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-(--ant-color-error-bg) text-[24px] text-(--ant-color-error-text)"><ExclamationOutlined /></span>}
        title={title}
        subTitle="잠시 후 다시 시도해 주세요. 계속 안 되면 관리자에게 알려 주세요."
        extra={<Button type="primary" onClick={onRetry}>다시 시도</Button>}
      />
    </Card>
  )
}
