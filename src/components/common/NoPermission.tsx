import { LockOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router'

import NoticeCard from './NoticeCard'

export default function NoPermission({ description }: { description: string }) {
  return (
    <NoticeCard
      role="alert"
      icon={<LockOutlined aria-hidden className="text-4xl text-(--ant-color-text-tertiary)" />}
      title="이 화면에 접근할 권한이 없어요"
      description={description}
      action={
        <Link to="/">
          <Button className="h-7">홈으로</Button>
        </Link>
      }
    />
  )
}
