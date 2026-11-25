import { useCallback } from 'react'
import { Button, Spin } from 'antd'
import { Link, Route, Routes, useOutletContext, useParams } from 'react-router'

import { getCourseOptions } from '../../../api/courses'
import { getDocuments } from '../../../api/documents'
import { getTaskTemplate, getTaskTemplates, getTemplateTags } from '../../../api/taskTemplates'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import LoadingError from '../../../components/common/LoadingError'
import EmptyData from '../../../components/common/EmptyData'
import NoPermission from '../../../components/common/NoPermission'
import PageNotFound from '../../../components/common/PageNotFound'
import { isAdmin } from '../../../utils/roles'
import TemplateEditor from './components/TemplateEditor'
import TemplateList from './components/TemplateList'

const notFound = <PageNotFound backTo="/admin/task-templates" backLabel="템플릿 목록으로" />

function TemplateEditorRoute({ businessId, isMobile }: { businessId: string; isMobile: boolean }) {
  const { templateId } = useParams()
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [detail, templates, options, tags, documents] = await Promise.all([
        templateId ? getTaskTemplate(templateId, signal) : undefined,
        getTaskTemplates(businessId, signal),
        getCourseOptions(businessId, signal),
        getTemplateTags(businessId, signal),
        getDocuments(businessId, signal),
      ])
      const phases = [...new Set(templates.flatMap((template) => (template.phase ? [template.phase] : [])))]
      return { template: detail?.template, areas: options.areas, tags, documents, phases }
    },
    [businessId, templateId],
  )
  const query = useApiQuery(`task-template:${businessId}:${templateId ?? 'new'}`, load)

  if (query.error) {
    return (
      <LoadingError
        title="템플릿을 불러오지 못했어요"
        error={query.error}
        onRetry={query.reload}
        extra={
          <Link to="/admin/task-templates">
            <Button className="h-7">목록으로</Button>
          </Link>
        }
      />
    )
  }
  if (!query.data) return <Spin className="m-auto" aria-label="템플릿 불러오는 중" />
  if (query.data.template && query.data.template.businessId !== businessId) return notFound

  return (
    <TemplateEditor
      key={`${templateId ?? 'new'}:${query.data.template?.version ?? 0}`}
      businessId={businessId}
      isMobile={isMobile}
      {...query.data}
      onReload={query.reload}
    />
  )
}

export default function TaskTemplatesPage() {
  const { isMobile, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()

  if (!isAdmin(user)) {
    return (
      <NoPermission description="할 일 템플릿은 관리자만 관리할 수 있어요." />
    )
  }
  if (!selectedBusinessId) return <EmptyData title="선택할 수 있는 사업이 없어요" />

  return (
    <Routes key={selectedBusinessId}>
      <Route
        index
        element={<TemplateList businessId={selectedBusinessId} isMobile={isMobile} />}
      />
      <Route path="new" element={<TemplateEditorRoute businessId={selectedBusinessId} isMobile={isMobile} />} />
      <Route path=":templateId" element={<TemplateEditorRoute businessId={selectedBusinessId} isMobile={isMobile} />} />
      <Route path="*" element={notFound} />
    </Routes>
  )
}
