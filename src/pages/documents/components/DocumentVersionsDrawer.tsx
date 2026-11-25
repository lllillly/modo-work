import { useCallback } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Skeleton, Tag } from 'antd'

import { isConflict } from '../../../api/client'
import { getDocumentVersions, getVersionFileUrl, restoreDocumentVersion } from '../../../api/documents'
import LoadingError from '../../../components/common/LoadingError'
import useApiQuery from '../../../hooks/useApiQuery'
import useApiErrorHandler from '../../../hooks/useApiErrorHandler'
import type { DocumentItem, DocumentVersion } from '../../../types/documents'
import { formatFileSize } from '../documentData'
import { formatMonthDay } from '../../../utils/date'

type DocumentVersionsDrawerProps = {
  item: DocumentItem
  meta: string
  businessId: string | null
  isMobile: boolean
  onClose: () => void
  onRestored?: () => void
  onStale?: () => void
}

function getVersionFile(version: DocumentVersion) {
  if (version.sourceType === 'LINK') return '외부 링크'
  const file = [version.originalFilename ?? 'PDF']
  if (version.fileSizeBytes !== null) file.push(formatFileSize(version.fileSizeBytes))
  if (version.pageCount !== null) file.push(`${version.pageCount}쪽`)
  return file.join(' · ')
}

function getVersionMeta(version: DocumentVersion) {
  const meta = [formatMonthDay(version.createdAt), version.createdBy.name]
  if (version.effectiveDate) meta.push(`시행 ${version.effectiveDate.replaceAll('-', '.')}`)
  return meta.join(' · ')
}

export default function DocumentVersionsDrawer({
  item,
  meta,
  businessId,
  isMobile,
  onClose,
  onRestored,
  onStale,
}: DocumentVersionsDrawerProps) {
  const { message, modal } = App.useApp()
  const { showError } = useApiErrorHandler()
  const load = useCallback(
    (signal: AbortSignal) => getDocumentVersions(item.id, businessId, signal),
    [item.id, businessId],
  )
  const versions = useApiQuery(`versions:${item.id}:${item.contentRevision}:${businessId ?? 'admin'}`, load)

  function getHref(version: DocumentVersion) {
    if (version.sourceType === 'LINK') {
      return version.externalUrl && /^https?:\/\//i.test(version.externalUrl) ? version.externalUrl : null
    }
    return getVersionFileUrl(item.id, version.contentRevision, businessId)
  }

  function confirmRestore(version: DocumentVersion) {
    modal.confirm({
      icon: <WarningOutlined className="text-(--ant-color-warning-text)" />,
      title: `'${item.title}' v${version.contentRevision} 판을 복원할까요?`,
      content: `v${version.contentRevision} 파일로 새 판(v${item.contentRevision + 1})을 만들어요. 지금 판과 이전 판은 그대로 남아요. 물어보기는 복원한 파일을 다시 읽어요.`,
      okText: '복원',
      cancelText: '취소',
      onOk: async () => {
        try {
          await restoreDocumentVersion(item, version.contentRevision)
          message.success(`v${version.contentRevision} 파일로 새 판을 만들었어요.`)
          onRestored?.()
          onClose()
        } catch (error) {
          if (isConflict(error)) {
            message.warning('다른 관리자가 먼저 문서를 변경했어요. 다시 시도해 주세요.')
            onStale?.()
            onClose()
            return
          }
          showError(error)
          versions.reload()
        }
      },
    })
  }

  const items = versions.data ?? []

  return (
    <Drawer
      open
      title="버전 기록"
      size={isMobile ? '100%' : 480}
      closable={{ placement: 'end' }}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-sm">
          <span className="text-caption text-(--ant-color-text-tertiary)">
            {onRestored ? '파일을 교체하거나 복원하면 새 판이 생겨요' : '판은 관리자가 파일을 바꿀 때 늘어나요'}
          </span>
          <Button onClick={onClose}>닫기</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-md">
        <div className="flex flex-col gap-xxs">
          <span className="text-body font-medium">{item.title}</span>
          <span className="text-caption text-(--ant-color-text-tertiary)">
            {meta} · 지금 보이는 판 v{item.contentRevision}
          </span>
        </div>

        {versions.isLoading ? (
          <Skeleton active title={false} paragraph={{ rows: 4, width: '100%' }} />
        ) : versions.error ? (
          <LoadingError plain title="버전 기록을 불러오지 못했어요" onRetry={versions.reload} />
        ) : (
          <div className="flex flex-col">
            {items.map((version) => {
              const href = getHref(version)
              return (
                <div
                  key={version.contentRevision}
                  className="flex items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                    <span className="flex items-center gap-xs">
                      <span className="text-body font-medium">v{version.contentRevision}</span>
                      {version.current && (
                        <Tag variant="outlined" color="processing" className="m-0 text-caption">
                          현재
                        </Tag>
                      )}
                    </span>
                    <span className="truncate text-caption text-(--ant-color-text-tertiary)">{getVersionFile(version)}</span>
                    <span className="text-caption text-(--ant-color-text-tertiary)">{getVersionMeta(version)}</span>
                  </div>
                  <span className="flex shrink-0 items-center gap-sm">
                    {href && (
                      <a href={href} target="_blank" rel="noreferrer" className="text-caption">
                        보기
                      </a>
                    )}
                    {onRestored && !version.current && version.sourceType === 'FILE' && item.sourceType === 'FILE' && (
                      <Button type="link" size="small" className="hit-area h-auto p-0 text-caption" onClick={() => confirmRestore(version)}>
                        복원
                      </Button>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <span className="text-caption text-(--ant-color-text-tertiary)">
          {onRestored
            ? '복원하면 고른 판의 파일로 새 판을 만들어요. 기존 판은 그대로 남고 물어보기는 복원한 파일을 다시 읽어요.'
            : '지난 판은 보기를 누르면 새 탭에서 열려요. 문서 메뉴와 물어보기는 현재 판을 기준으로 해요.'}
        </span>
      </div>
    </Drawer>
  )
}
