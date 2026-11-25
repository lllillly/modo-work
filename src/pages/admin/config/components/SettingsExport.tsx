import { useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import type { SettingsKind } from '../../../../types/settingsTransfer'
import { exportSettings } from '../../../../api/settingsTransfer'
import { settingsKinds } from '../settingsKinds'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import ContentCard from '../../../../components/common/ContentCard'

type SettingsExportProps = { isMobile: boolean }

export default function SettingsExport({ isMobile }: SettingsExportProps) {
  const { showError } = useApiErrorHandler()
  const [downloading, setDownloading] = useState<SettingsKind | null>(null)

  async function download(kind: SettingsKind) {
    setDownloading(kind)
    try {
      const blob = await exportSettings(kind)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `portal-${kind}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url))
    } catch (error) {
      showError(error)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <ContentCard>
      <h2 className="m-0 text-card-title">내보내기</h2>
      <p className="mt-xxs mb-sm text-caption text-(--ant-color-text-secondary)">
        사용하지 않는 항목도 함께 담겨요. 질문 기록과 비밀값은 담기지 않아요.
      </p>
      <ul className="m-0 list-none p-0">
        {settingsKinds.map((kind) => (
          <li
            key={kind.value}
            className="flex items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm last:border-b-0"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-body font-medium">{kind.label}</span>
              <span className="text-caption text-(--ant-color-text-tertiary)">
                {kind.description} · portal-{kind.value}.json
              </span>
            </span>
            <Button
              icon={<DownloadOutlined aria-hidden />}
              aria-label={`${kind.label} 내려받기`}
              loading={downloading === kind.value}
              disabled={downloading !== null && downloading !== kind.value}
              onClick={() => void download(kind.value)}
              className="shrink-0"
            >
              {!isMobile && '내려받기'}
            </Button>
          </li>
        ))}
      </ul>
    </ContentCard>
  )
}
