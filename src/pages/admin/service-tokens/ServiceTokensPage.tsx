import { Button } from 'antd'
import { Link } from 'react-router'

import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import { useAuth } from '../../../providers/AuthContext'
import ServiceTokens from './components/ServiceTokens'
import { serviceTokensGuide } from './serviceTokensGuide'

export default function ServiceTokensPage() {
  const { user } = useAuth()

  if (!user?.roles.some((role) => role.role === 'ADMIN')) {
    return (
      <NoticeCard
        icon={<ErrorTriangle />}
        title="이 화면에 접근할 권한이 없어요"
        description="서비스 토큰은 관리자만 발급하고 폐기할 수 있어요."
        action={
          <Link to="/">
            <Button className="h-7">홈으로</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="서비스 토큰 관리"
        description="외부 시스템이 과정 요약을 읽을 때 쓰는 토큰을 발급하고 폐기해요."
        actions={<PageGuide {...serviceTokensGuide} />}
      />
      <ServiceTokens />
    </div>
  )
}
