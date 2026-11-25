import { useOutletContext } from 'react-router'

import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import SettingsExport from './components/SettingsExport'
import SettingsImport from './components/SettingsImport'
import { settingsTransferGuide } from './settingsTransferGuide'

export default function SettingsTransferPage() {
  const { user } = useAuth()
  const { isMobile } = useOutletContext<AppLayoutContext>()

  if (!isAdmin(user)) return <NoPermission description="설정 내보내기와 가져오기는 관리자만 할 수 있어요." />

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="설정 내보내기 & 가져오기"
        description="목록, 템플릿, 설정값, 의도, Q&A를 JSON 파일로 내보내고 다른 환경에 가져와요."
        actions={<PageGuide {...settingsTransferGuide} />}
      />
      <div className="grid grid-cols-1 items-start gap-md min-[1200px]:grid-cols-2">
        <SettingsExport isMobile={isMobile} />
        <SettingsImport isMobile={isMobile} />
      </div>
    </div>
  )
}
