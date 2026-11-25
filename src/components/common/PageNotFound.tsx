import { CompassOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router'

import NoticeCard from './NoticeCard'

type PageNotFoundProps = {
  title?: string
  description?: string
  backTo?: string
  backLabel?: string
}

export default function PageNotFound({
  title = '페이지를 찾을 수 없어요',
  description = '주소가 바뀌었거나 없는 페이지예요.',
  backTo = '/',
  backLabel = '홈으로',
}: PageNotFoundProps) {
  return (
    <NoticeCard
      role="alert"
      icon={<CompassOutlined aria-hidden className="text-4xl text-(--ant-color-text-tertiary)" />}
      title={title}
      description={description}
      action={
        <Link to={backTo}>
          <Button className="h-7">{backLabel}</Button>
        </Link>
      }
    />
  )
}
