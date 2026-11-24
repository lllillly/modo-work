import { Button } from 'antd'
import { Link, useOutletContext } from 'react-router'

import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import HolidaySettings from './components/HolidaySettings'
import { settingsGuide } from './settingsGuide'

export default function SettingsPage() {
  const { user } = useAuth()
  const { isMobile } = useOutletContext<AppLayoutContext>()

  if (!user?.roles.some((role) => role.role === 'ADMIN')) {
    return (
      <NoticeCard
        icon={<ErrorTriangle />}
        title="이 화면에 접근할 권한이 없어요"
        description="휴무일 설정은 관리자만 바꿀 수 있어요."
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
        title="휴무일 설정"
        description="회사 휴무일을 관리해요. 공휴일과 회사 휴무일은 할 일 마감 계산에서 빠져요."
        actions={<PageGuide {...settingsGuide} />}
      />
      <HolidaySettings isMobile={isMobile} />
    </div>
  )
}
