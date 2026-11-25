import { RightOutlined } from '@ant-design/icons'
import { Card, Skeleton } from 'antd'
import { Link } from 'react-router'

import LoadingError from '../../../components/common/LoadingError'
import EmptyData from '../../../components/common/EmptyData'
import NoSearchResult from '../../../components/common/NoSearchResult'
import PageHeader from '../../../components/layout/PageHeader'
import type { DocumentItem } from '../../../types/documents'
import { ALL_TYPES, getDocumentMeta, getDocumentTypes, getExternalHref, isSearchExcluded } from '../documentData'
import useSearchDraft from '../../../hooks/useSearchDraft'
import useUrlFilters from '../../../hooks/useUrlFilters'
import useDocuments from '../useDocuments'
import useDocumentSearch from '../useDocumentSearch'
import DocumentPassages from './DocumentPassages'
import SearchInput from '../../../components/common/SearchInput'
import FilterChip from '../../../components/common/FilterChip'

type DocumentListProps = {
  businessId: string
  businessName: string
  isMobile: boolean
}

export default function DocumentList({ businessId, businessName, isMobile }: DocumentListProps) {
  const { getFilter, setFilters } = useUrlFilters()
  const typeId = getFilter('type', ALL_TYPES)
  const [keyword, setKeyword] = useSearchDraft(getFilter('q'), (value) => setFilters({ q: value }))
  const query = useDocuments(businessId)
  const passages = useDocumentSearch(businessId, keyword)
  const documents = query.data ?? []
  const types = getDocumentTypes(documents)
  const trimmedKeyword = keyword.trim().toLowerCase()
  const visibleDocuments = documents.filter(
    (item) =>
      (typeId === ALL_TYPES || item.documentTypeId === typeId) &&
      item.title.toLowerCase().includes(trimmedKeyword),
  )

  const search = (
    <SearchInput
      maxLength={500}
      label="문서 제목·본문 검색"
      onPage
      value={keyword}
      onChange={(event) => setKeyword(event.target.value)}
    />
  )

  const filters = (
    <div
      className={`flex items-center gap-xs ${
        isMobile ? 'overflow-x-auto' : 'flex-wrap'
      }`}
    >
      {[{ id: ALL_TYPES, name: '전체' }, ...types].map((type) => (
        <FilterChip key={type.id} selected={typeId === type.id} onClick={() => setFilters({ type: type.id === ALL_TYPES ? null : type.id })} className="text-caption">
          {type.name}
        </FilterChip>
      ))}
      {!isMobile && (
        <span className="text-caption text-(--ant-color-text-tertiary)">사업: {businessName} + 공통</span>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-md">
      <PageHeader title="문서" description="운영에 필요한 문서를 보고, 문서 안의 내용을 찾을 수 있어요." />

      {query.isLoading ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: isMobile ? 'p-md' : 'p-lg' }}
          aria-label="문서 목록 불러오는 중"
          aria-busy="true"
        >
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : query.error ? (
        <LoadingError title="문서 목록을 불러오지 못했어요" onRetry={query.reload} />
      ) : documents.length === 0 ? (
        <EmptyData
          title="아직 볼 수 있는 문서가 없어요"
          description="관리자가 문서를 올리면 여기에 보여요. 필요한 문서가 있으면 관리자에게 요청해 주세요."
        />
      ) : (
        <>
          {isMobile ? (
            <>
              {search}
              {filters}
            </>
          ) : (
            <div className="flex items-center justify-between gap-md">
              {filters}
              <div className="w-60 shrink-0">{search}</div>
            </div>
          )}
          {visibleDocuments.length === 0 && trimmedKeyword && !passages.active ? (
            <NoSearchResult
              title={`"${keyword.trim()}"이 나온 문서가 없어요`}
              description="다른 단어로 찾거나, 물어보기에 질문해 보세요. 검색어는 2글자 이상 넣어 주세요."
            />
          ) : (
            <>
              {(visibleDocuments.length > 0 || !passages.active) && (
                <div className="rounded-lg bg-(--ant-color-bg-container) px-md min-[992px]:px-lg">
                  <p className="m-0 py-2.5 text-caption text-(--ant-color-text-secondary)">
                    {trimmedKeyword ? '제목이 맞는 문서' : '볼 수 있는 문서'} {visibleDocuments.length}개
                  </p>
                  {visibleDocuments.map((item) => (
                    <DocumentRow
                      key={item.id}
                      item={item}
                      meta={getDocumentMeta(item, businessName)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}
              {passages.active && (
                <div className="rounded-lg bg-(--ant-color-bg-container) px-md pb-sm min-[992px]:px-lg">
                  <p className="m-0 py-2.5 text-caption text-(--ant-color-text-secondary)">
                    문서 본문에서 찾은 구절
                    {passages.notIndexedCount > 0 && (
                      <span className="text-(--ant-color-text-tertiary)">
                        {' '}
                        · 본문을 아직 읽지 못한 문서 {passages.notIndexedCount}개는 제목으로만 찾아요
                      </span>
                    )}
                  </p>
                  <DocumentPassages
                    passages={passages.passages}
                    query={passages.query}
                    isLoading={passages.isLoading}
                    isLoadingMore={passages.isLoadingMore}
                    error={passages.error}
                    hasMore={passages.hasMore}
                    onMore={passages.loadMore}
                    onRetry={passages.retry}
                    linkTo={(passage) => `/documents/${passage.documentId}?page=${passage.page}`}
                  />
                  {!passages.isLoading && !passages.error && passages.passages.length === 0 && (
                    <p className="m-0 border-0 border-t border-solid border-(--ant-color-border-secondary) py-md text-center text-caption text-(--ant-color-text-tertiary)">
                      본문에서 찾은 구절이 없어요. 다른 단어로 찾거나 물어보기에 질문해 보세요.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

type DocumentRowProps = {
  item: DocumentItem
  meta: string
  isMobile: boolean
}

function DocumentRow({ item, meta, isMobile }: DocumentRowProps) {
  const className = `flex items-center justify-between gap-sm border-0 border-t border-solid
    border-(--ant-color-border-secondary) py-2.5 text-(--ant-color-text) hover:text-(--ant-color-text)`

  const content = (
    <>
      <span className="flex min-w-0 flex-col gap-xxs">
        <span className={`truncate font-medium ${isMobile ? 'text-body' : 'text-body'}`}>{item.title}</span>
        <span className="text-caption text-(--ant-color-text-tertiary)">
          {meta}
          {isSearchExcluded(item) && (
            <span className="text-(--ant-color-warning-text)"> · 텍스트 없음, 검색 제외</span>
          )}
        </span>
      </span>
      {isMobile && <RightOutlined aria-hidden className="shrink-0 text-caption text-(--ant-color-text-tertiary)" />}
    </>
  )

  const externalHref = item.sourceType === 'LINK' ? getExternalHref(item) : null

  if (externalHref) {
    return (
      <a href={externalHref} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={`/documents/${item.id}`} className={className}>
      {content}
    </Link>
  )
}
