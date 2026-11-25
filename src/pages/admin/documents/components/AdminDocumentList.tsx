import { useEffect, useEffectEvent, useState } from 'react'
import { DeleteOutlined, FileAddOutlined, HistoryOutlined, ReloadOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Select, Skeleton, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import { getBusinesses } from '../../../../api/courses'
import {
  deleteDocument,
  getAdminDocuments,
  getDeletionContext,
  getDocumentKinds,
  retryDocumentIndex,
} from '../../../../api/documents'
import LoadingError from '../../../../components/common/LoadingError'
import EmptyData from '../../../../components/common/EmptyData'
import NoSearchResult from '../../../../components/common/NoSearchResult'
import useApiQuery from '../../../../hooks/useApiQuery'
import useSearchDraft from '../../../../hooks/useSearchDraft'
import useUrlFilters from '../../../../hooks/useUrlFilters'
import type { DocumentItem } from '../../../../types/documents'
import { getFileSummary, getIndexStatus, isIndexRetrying } from '../../../documents/documentData'
import DocumentVersionsDrawer from '../../../documents/components/DocumentVersionsDrawer'
import PageHeader from '../../../../components/layout/PageHeader'
import DocumentReplaceModal from './DocumentReplaceModal'
import DocumentUploadDrawer from './DocumentUploadDrawer'
import SearchInput from '../../../../components/common/SearchInput'
import IconAction from '../../../../components/common/IconAction'
import HintTooltip from '../../../../components/common/HintTooltip'
import { smallTableStyle } from '../../../../components/common/tableStyle'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import { formatMonthDay } from '../../../../utils/date'

const ALL_FILTER = 'all'

type AdminDocumentListProps = { isMobile: boolean }

const linkReplaceNotice = '링크 문서는 파일로 교체할 수 없어요'

export default function AdminDocumentList({ isMobile }: AdminDocumentListProps) {
  const { message, modal } = App.useApp()
  const { showError } = useApiErrorHandler()
  const { getFilter, setFilters } = useUrlFilters()
  const [search, setSearch] = useSearchDraft(getFilter('q'), (value) => setFilters({ q: value }))
  const kindId = getFilter('kind', ALL_FILTER)
  const businessId = getFilter('business', ALL_FILTER)
  const [showUpload, setShowUpload] = useState(false)
  const [replaceItem, setReplaceItem] = useState<DocumentItem | null>(null)
  const [versionItem, setVersionItem] = useState<DocumentItem | null>(null)
  const [indexing, setIndexing] = useState<Record<string, string>>({})
  const documents = useApiQuery('admin-documents', getAdminDocuments)
  const kinds = useApiQuery('document-kinds', getDocumentKinds)
  const businesses = useApiQuery('businesses', getBusinesses)

  const kindItems = kinds.data?.items ?? []
  const businessItems = businesses.data?.items ?? []
  const businessNames = Object.fromEntries(businessItems.map((business) => [business.id, business.name]))
  const allDocuments = documents.data ?? []
  const visibleDocuments = allDocuments.filter(
    (item) =>
      item.title.toLowerCase().includes(search.trim().toLowerCase()) &&
      (kindId === ALL_FILTER || item.documentTypeId === kindId) &&
      (businessId === ALL_FILTER || item.businessScope === 'ALL' || item.businessIds.includes(businessId)),
  )

  const getScope = (item: DocumentItem) =>
    item.businessScope === 'ALL'
      ? '공통'
      : item.businessIds.map((id) => businessNames[id] ?? `사업 ${id}`).join(', ')

  const reloadDocuments = useEffectEvent(() => documents.reload())

  useEffect(() => {
    const ids = Object.keys(indexing)
    if (ids.length === 0) return

    let stopped = false
    const timer = window.setInterval(async () => {
      try {
        const latest = await getAdminDocuments()
        if (stopped) return
        const finished = latest.filter(
          (item) =>
            item.id in indexing &&
            item.indexStatus !== 'PENDING' &&
            item.indexStatus !== 'PROCESSING' &&
            !isIndexRetrying(item),
        )
        const removedIds = ids.filter((id) => !latest.some((item) => item.id === id))
        if (finished.length === 0 && removedIds.length === 0) return
        finished.forEach((item) => {
          const title = indexing[item.id]
          if (item.indexStatus === 'READY') message.success(`'${title}' 문서를 다 읽었어요. 이제 물어보기에서 쓸 수 있어요.`)
          else if (item.indexStatus === 'UNSUPPORTED') message.warning(`'${title}' 문서에 읽을 글자가 없어서 검색에서 빠져요.`)
          else message.error(`'${title}' 문서를 읽지 못했어요. 목록에서 다시 시도해 주세요.`)
        })
        setIndexing((current) => {
          const rest = { ...current }
          finished.forEach((item) => delete rest[item.id])
          removedIds.forEach((id) => delete rest[id])
          return rest
        })
        reloadDocuments()
      } catch {
        return
      }
    }, 3000)

    return () => {
      stopped = true
      window.clearInterval(timer)
    }
  }, [indexing, message])

  async function retry(item: DocumentItem) {
    try {
      await retryDocumentIndex(item.id)
      message.success('다시 읽도록 요청했어요.')
      setIndexing((current) => ({ ...current, [item.id]: item.title }))
      documents.reload()
    } catch (error) {
      showError(error)
    }
  }

  async function confirmDelete(item: DocumentItem) {
    let context
    try {
      context = await getDeletionContext(item.id)
    } catch (error) {
      showError(error)
      documents.reload()
      return
    }

    modal.confirm({
      icon: <WarningOutlined className="text-(--ant-color-error-text)" />,
      title: `'${item.title}' 문서를 삭제할까요?`,
      content: (
        <div className="flex flex-col gap-sm">
          <span>삭제하면 문서 메뉴와 물어보기 검색에서 빠져요.</span>
          {context.referencingQaCount > 0 && (
            <Alert
              type="warning"
              title={`이 문서를 근거로 쓰는 Q&A가 ${context.referencingQaCount}개 있어요. 삭제하면 이 Q&A는 근거 없이 남아요.`}
            />
          )}
        </div>
      ),
      okText: '삭제',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteDocument(item.id, context.contentRevision)
          message.success('문서를 삭제했어요.')
          documents.reload()
        } catch (error) {
          showError(error)
        }
      },
    })
  }

  const columns = [
    {
      title: '문서',
      key: 'title',
      render: (_, item) => (
        <span className="flex flex-col">
          <span className="text-body">{item.title}</span>
          <span className="text-caption text-(--ant-color-text-tertiary)">
            v{item.contentRevision}
            {item.effectiveDate && ` · 시행 ${item.effectiveDate.replaceAll('-', '.')}`}
          </span>
        </span>
      ),
    },
    {
      title: '파일',
      key: 'file',
      responsive: ['xl'],
      render: (_, item) => getFileSummary(item),
    },
    {
      title: '종류 · 사업',
      key: 'scope',
      render: (_, item) => `${item.documentTypeName} · ${getScope(item)}`,
    },
    {
      title: '물어보기',
      key: 'status',
      render: (_, item) => {
        const status = getIndexStatus(item)
        return (
          <span className="flex items-center gap-xs">
            <Tag variant="outlined" color={status.color} className="m-0 text-caption">
              {status.label}
            </Tag>
            {item.indexStatus === 'FAILED' && !isIndexRetrying(item) && (
              <Button type="link" size="small" className="hit-area h-auto p-0 text-caption" onClick={() => retry(item)}>
                다시 시도
              </Button>
            )}
          </span>
        )
      },
    },
    {
      title: '수정일 · 등록자',
      key: 'updated',
      responsive: ['xl'],
      render: (_, item) => (
        <span className="text-(--ant-color-text-tertiary)">
          {formatMonthDay(item.updatedAt)} · {item.createdBy.name}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, item) => (
        <span className="flex items-center justify-end">
          <IconAction
            label={item.sourceType === 'LINK' ? linkReplaceNotice : '새 파일로 교체'}
            ariaLabel={`${item.title} 새 파일로 교체`}
            icon={<FileAddOutlined />}
            tone="primary"
            disabled={item.sourceType === 'LINK'}
            onClick={() => setReplaceItem(item)}
          />
          <IconAction
            label="버전 기록"
            ariaLabel={`${item.title} 버전 기록`}
            icon={<HistoryOutlined />}
            onClick={() => setVersionItem(item)}
          />
          <IconAction
            label="삭제"
            ariaLabel={`${item.title} 삭제`}
            icon={<DeleteOutlined />}
            tone="danger"
            onClick={() => void confirmDelete(item)}
          />
        </span>
      ),
    },
  ] satisfies TableColumnsType<DocumentItem>

  const uploadButton = (
    <Button
      type="primary"
      icon={<UploadOutlined aria-hidden />}
      onClick={() => setShowUpload(true)}
    >
      문서 올리기
    </Button>
  )

  const hasList = !documents.isLoading && !documents.error && allDocuments.length > 0

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="문서 업로드"
        description="문서와 교육자료를 올려요. 올린 문서는 문서 메뉴에서 보고, PDF는 물어보기가 근거로 써요."
        actions={hasList ? undefined : uploadButton}
      />

      {documents.isLoading ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: 'p-lg' }}
          aria-label="문서 목록 불러오는 중"
          aria-busy="true"
        >
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : documents.error ? (
        <LoadingError title="문서 목록을 불러오지 못했어요" onRetry={documents.reload} />
      ) : allDocuments.length === 0 ? (
        <EmptyData
          title="올린 문서가 없어요"
          description="규정·안내서·양식을 올리면 문서 메뉴에 보이고, PDF는 물어보기가 근거로 써요."
          action={uploadButton}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-xs">
            <SearchInput
              label="문서 이름 검색"
              onPage
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={isMobile ? 'w-full' : 'w-65'}
            />
            <Select
              aria-label="종류 필터"
              value={kindId}
              onChange={(value) => setFilters({ kind: value === ALL_FILTER ? null : value })}
              popupMatchSelectWidth={false}
              options={[
                { value: ALL_FILTER, label: '종류: 전체' },
                ...kindItems.map((kind) => ({ value: kind.id, label: kind.name })),
              ]}
            />
            <Select
              aria-label="사업 필터"
              value={businessId}
              onChange={(value) => setFilters({ business: value === ALL_FILTER ? null : value })}
              popupMatchSelectWidth={false}
              options={[
                { value: ALL_FILTER, label: '사업: 전체' },
                ...businessItems.map((business) => ({ value: business.id, label: business.name })),
              ]}
            />
            <span className="ml-auto">{uploadButton}</span>
          </div>
          {isMobile ? (
            <div className="rounded-lg bg-(--ant-color-bg-container)">
              {visibleDocuments.length === 0 && (
                <p className="m-0 py-lg text-center text-caption text-(--ant-color-text-secondary)">
                  조건에 맞는 문서가 없어요
                </p>
              )}
              {visibleDocuments.map((item) => {
                const status = getIndexStatus(item)
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-xs border-0 border-t border-solid border-(--ant-color-border-secondary) px-md py-sm first:border-t-0"
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <span className="flex min-w-0 flex-col">
                        <span className="text-body font-medium">{item.title}</span>
                        <span className="text-caption text-(--ant-color-text-tertiary)">
                          v{item.contentRevision} · {getFileSummary(item)}
                        </span>
                        <span className="text-caption text-(--ant-color-text-tertiary)">
                          {item.documentTypeName} · {getScope(item)}
                        </span>
                      </span>
                      <Tag variant="outlined" color={status.color} className="m-0 shrink-0 text-caption">
                        {status.label}
                      </Tag>
                    </div>
                    <div className="flex items-center justify-between gap-xs">
                      <span className="flex items-center gap-sm">
                        <HintTooltip title={item.sourceType === 'LINK' ? linkReplaceNotice : undefined}>
                          <Button
                            type="link"
                            size="small"
                            icon={<FileAddOutlined aria-hidden />}
                            disabled={item.sourceType === 'LINK'}
                            className="hit-area h-auto p-0 text-caption"
                            onClick={() => setReplaceItem(item)}
                          >
                            새 파일로 교체
                          </Button>
                        </HintTooltip>
                        {item.indexStatus === 'FAILED' && !isIndexRetrying(item) && (
                          <Button type="link" size="small" icon={<ReloadOutlined aria-hidden />} className="hit-area h-auto p-0 text-caption" onClick={() => retry(item)}>
                            다시 시도
                          </Button>
                        )}
                      </span>
                      <span className="-mr-xs flex items-center">
                        <IconAction
                          label="버전 기록"
                          ariaLabel={`${item.title} 버전 기록`}
                          icon={<HistoryOutlined />}
                          onClick={() => setVersionItem(item)}
                        />
                        <IconAction
                          label="삭제"
                          ariaLabel={`${item.title} 삭제`}
                          icon={<DeleteOutlined />}
                          tone="danger"
                          onClick={() => void confirmDelete(item)}
                        />
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
          <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-lg' }}>
            <Table<DocumentItem>
              rowKey="id"
              columns={columns}
              dataSource={visibleDocuments}
              pagination={false}
              size="small"
              rowHoverable={false}
              scroll={{ x: 640 }}
              locale={{
                emptyText: <NoSearchResult plain compact title="조건에 맞는 문서가 없어요" description="다른 이름이나 필터로 찾아 보세요." />,
              }}
              classNames={smallTableStyle}
            />
          </Card>
          )}
        </>
      )}

      {replaceItem && (
        <DocumentReplaceModal
          key={replaceItem.id}
          item={replaceItem}
          isMobile={isMobile}
          onClose={() => setReplaceItem(null)}
          onReplaced={() => {
            setIndexing((current) => ({ ...current, [replaceItem.id]: replaceItem.title }))
            documents.reload()
          }}
          onStale={documents.reload}
        />
      )}

      {versionItem && (
        <DocumentVersionsDrawer
          key={versionItem.id}
          item={versionItem}
          meta={`${versionItem.documentTypeName} · ${getScope(versionItem)}`}
          businessId={null}
          isMobile={isMobile}
          onClose={() => setVersionItem(null)}
          onRestored={() => {
            setIndexing((current) => ({ ...current, [versionItem.id]: versionItem.title }))
            documents.reload()
          }}
          onStale={documents.reload}
        />
      )}

      {showUpload && (
        <DocumentUploadDrawer
          kinds={kindItems}
          businesses={businessItems}
          isMobile={isMobile}
          onClose={() => setShowUpload(false)}
          onUploaded={(id, title, isLink) => {
            if (!isLink) setIndexing((current) => ({ ...current, [id]: title }))
            documents.reload()
          }}
        />
      )}
    </div>
  )
}
