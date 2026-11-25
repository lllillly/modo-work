import { Route, Routes, useOutletContext } from 'react-router'

import EmptyData from '../../components/common/EmptyData'
import PageNotFound from '../../components/common/PageNotFound'
import type { AppLayoutContext } from '../../layouts/AppLayout'
import DocumentList from './components/DocumentList'
import DocumentViewer from './components/DocumentViewer'

export default function DocumentsPage() {
  const { isMobile, selectedBusiness, selectedBusinessId } = useOutletContext<AppLayoutContext>()

  if (!selectedBusinessId) {
    return (
      <EmptyData title="사업 정보를 불러오지 못해서 문서를 볼 수 없어요" description="담당 관리자에게 문의해 주세요." />
    )
  }

  return (
    <Routes key={selectedBusinessId}>
      <Route
        index
        element={<DocumentList businessId={selectedBusinessId} businessName={selectedBusiness} isMobile={isMobile} />}
      />
      <Route
        path=":documentId"
        element={<DocumentViewer businessId={selectedBusinessId} businessName={selectedBusiness} isMobile={isMobile} />}
      />
      <Route
        path="*"
        element={
          <PageNotFound backTo="/documents" backLabel="문서 목록으로" />
        }
      />
    </Routes>
  )
}
