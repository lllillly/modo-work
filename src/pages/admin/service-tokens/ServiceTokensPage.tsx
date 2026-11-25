import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import { useAuth } from '../../../providers/AuthContext'
import ServiceTokens from './components/ServiceTokens'
import { serviceTokensGuide } from './serviceTokensGuide'

export default function ServiceTokensPage() {
  const { user } = useAuth()

  if (!isAdmin(user)) return <NoPermission description="서비스 토큰은 관리자만 발급하고 폐기할 수 있어요." />

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
