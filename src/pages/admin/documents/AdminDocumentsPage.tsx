import { useOutletContext } from 'react-router'

import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import AdminDocumentList from './components/AdminDocumentList'

export default function AdminDocumentsPage() {
  const { user } = useAuth()
  const { isMobile } = useOutletContext<AppLayoutContext>()

  if (!isAdmin(user)) return <NoPermission description="필요하면 관리자에게 권한을 요청해 주세요." />

  return <AdminDocumentList isMobile={isMobile} />
}
