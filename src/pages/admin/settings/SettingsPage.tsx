import { useOutletContext } from 'react-router'

import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import HolidaySettings from './components/HolidaySettings'
import { settingsGuide } from './settingsGuide'

export default function SettingsPage() {
  const { user } = useAuth()
  const { isMobile } = useOutletContext<AppLayoutContext>()

  if (!isAdmin(user)) return <NoPermission description="휴무일 설정은 관리자만 바꿀 수 있어요." />

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="휴무일 설정"
        description="회사 휴무일을 관리해요. 공휴일과 회사 휴무일은 할 일 마감 계산에서 빠져요."
        actions={<PageGuide {...settingsGuide} />}
      />
      <HolidaySettings isMobile={isMobile} />
    </div>
  )
}
