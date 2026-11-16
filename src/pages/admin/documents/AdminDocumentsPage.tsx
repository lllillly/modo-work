import { Button } from 'antd'
import { Link, useOutletContext } from 'react-router'

import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import AdminDocumentList from './components/AdminDocumentList'

export default function AdminDocumentsPage() {
  const { user } = useAuth()
  const { isMobile } = useOutletContext<AppLayoutContext>()

  if (!user?.roles.some((role) => role.role === 'ADMIN')) {
    return (
      <NoticeCard
        icon={<ErrorTriangle />}
        title="이 화면에 접근할 권한이 없어요"
        description="필요하면 관리자에게 권한을 요청해 주세요."
        action={
          <Link to="/">
            <Button className="h-7">홈으로</Button>
          </Link>
        }
      />
    )
  }

  return <AdminDocumentList isMobile={isMobile} />
}
