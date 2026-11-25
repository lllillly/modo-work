import { useState } from 'react'

import SearchInput from '../../../components/common/SearchInput'
import useDocumentSearch from '../useDocumentSearch'
import DocumentPassages from './DocumentPassages'

type DocumentSearchPanelProps = {
  businessId: string
  documentId: string
  autoFocus?: boolean
}

export default function DocumentSearchPanel({ businessId, documentId, autoFocus }: DocumentSearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const search = useDocumentSearch(businessId, keyword, documentId)

  return (
    <div className="flex min-h-0 flex-col gap-xs">
      <SearchInput
        label="이 문서에서 찾기"
        maxLength={500}
        autoFocus={autoFocus}
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
      />
      {search.active ? (
        <div className="min-h-0 overflow-y-auto">
          <DocumentPassages
            passages={search.passages}
            query={search.query}
            isLoading={search.isLoading}
            isLoadingMore={search.isLoadingMore}
            error={search.error}
            hasMore={search.hasMore}
            onMore={search.loadMore}
            onRetry={search.retry}
            linkTo={(passage) => `?page=${passage.page}`}
            showTitle={false}
          />
          {!search.isLoading && !search.error && search.passages.length === 0 && (
            <p className="m-0 py-md text-center text-caption text-(--ant-color-text-tertiary)">
              검색 상위 결과에 이 문서의 구절이 없어요. 다른 단어로 찾아 보세요.
            </p>
          )}
        </div>
      ) : (
        <p className="m-0 text-caption text-(--ant-color-text-tertiary)">2글자 이상 입력하면 이 문서의 구절을 찾아요.</p>
      )}
    </div>
  )
}
