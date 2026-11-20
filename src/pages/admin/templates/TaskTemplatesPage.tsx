import { useCallback } from 'react'
import { Button, Result, Spin } from 'antd'
import { Link, Route, Routes, useOutletContext, useParams } from 'react-router'

import { getApiErrorMessage } from '../../../api/client'
import { getCourseOptions } from '../../../api/courses'
import { getDocuments } from '../../../api/documents'
import { getTaskTemplate, getTaskTemplates, getTemplateTags } from '../../../api/taskTemplates'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import TemplateEditor from './components/TemplateEditor'
import TemplateList from './components/TemplateList'

const notFound = (
  <Result status="404" title="페이지를 찾을 수 없어요" extra={<Link to="/admin/task-templates">목록으로</Link>} />
)

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
      <Result
        status="warning"
        title="템플릿을 불러오지 못했어요"
        subTitle={getApiErrorMessage(query.error)}
        extra={
          <>
            <Button onClick={query.reload}>다시 시도</Button>
            <Link to="/admin/task-templates">목록으로</Link>
          </>
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

  if (!user?.roles.some((role) => role.role === 'ADMIN')) {
    return (
      <Result
        status="403"
        title="이 화면에 접근할 권한이 없어요"
        subTitle="할 일 템플릿은 관리자만 관리할 수 있어요."
        extra={
          <Link to="/">
            <Button type="primary">홈으로</Button>
          </Link>
        }
      />
    )
  }
  if (!selectedBusinessId) return <Result status="info" title="선택할 수 있는 사업이 없어요" />

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
