import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { useOutletContext } from 'react-router'

import { getApiErrorMessage } from '../../../api/client'
import { getBusinesses } from '../../../api/courses'
import { getAdminDocuments } from '../../../api/documents'
import { getIntents, getKnowledgeSync, getQaList, retryKnowledgeSync } from '../../../api/nlpAdmin'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import type { IntentItem, KnowledgeSync, QaItem } from '../../../types/nlpAdmin'
import PageHeader from '../../../components/layout/PageHeader'
import PageGuide from '../../../components/common/PageGuide'
import LoadingError from '../../../components/common/LoadingError'
import NoPermission from '../../../components/common/NoPermission'
import { isAdmin } from '../../../utils/roles'
import UsersTabs from '../users/components/UsersTabs'
import EvalView from './components/EvalView'
import IntentDrawer from './components/IntentDrawer'
import QaDrawer from './components/QaDrawer'
import QuestionStatsView from './components/QuestionStatsView'
import UnansweredQuestions from './components/UnansweredQuestions'
import { smallTableStyle } from '../../../components/common/tableStyle'
import { businessNames, type NlpOptions } from './nlpAdminData'
import { questionsGuide } from './questionsGuide'
import { formatDateTime } from '../../../utils/date'

type Tab = 'unanswered' | 'intents' | 'qa' | 'stats' | 'eval'

const syncLabels: Record<KnowledgeSync['status'], { text: string; color: string }> = {
  PENDING: { text: '반영 대기', color: 'default' },
  SYNCING: { text: '반영 중', color: 'processing' },
  SYNCED: { text: '반영됨', color: 'success' },
  RETRYING: { text: '자동 재시도 대기', color: 'warning' },
  FAILED: { text: '반영 실패', color: 'error' },
}

// nlp-management.md 4장 error 값
const syncErrors: Record<string, string> = {
  INVALID_KNOWLEDGE: '지식 데이터가 올바르지 않아요. 최근 수정한 의도·Q&A를 확인해 주세요.',
  UNAUTHORIZED: '물어보기 서버 인증에 실패했어요. 서버 설정을 확인해 주세요.',
  STALE_REVISION: '물어보기 쪽 판이 더 높아요. 다시 반영을 누르면 현재 내용으로 덮어써요.',
  BAD_RESPONSE: '물어보기 서버 응답이 올바르지 않아요.',
  RETRYABLE: '물어보기 서버에 잠시 연결하지 못했어요. 자동으로 다시 시도해요.',
  INTERNAL_ERROR: '반영 중 서버 오류가 났어요.',
}

const activeTag = (active: boolean) => (active ? <Tag color="success">사용</Tag> : <Tag>숨김</Tag>)

function SyncStatus({ refreshKey }: { refreshKey: number }) {
  const { message } = App.useApp()
  const load = useCallback((signal: AbortSignal) => getKnowledgeSync(signal), [])
  const query = useApiQuery(`knowledge-sync:${refreshKey}`, load)
  const [isRetrying, setIsRetrying] = useState(false)
  const sync = query.data

  async function retry() {
    setIsRetrying(true)
    try {
      await retryKnowledgeSync()
      message.success('다시 반영하도록 예약했어요.')
      query.reload()
    } catch (error) {
      message.error(getApiErrorMessage(error))
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'flex flex-wrap items-center gap-sm px-lg py-sm' }}>
      <span className="font-medium">물어보기 반영</span>
      {query.error ? (
        <span className="text-caption text-(--ant-color-error)">상태를 불러오지 못했어요.</span>
      ) : sync ? (
        <>
          <Tag color={syncLabels[sync.status].color}>{syncLabels[sync.status].text}</Tag>
          <span className="text-caption text-(--ant-color-text-secondary)">
            저장된 판 {sync.revision} · 물어보기 판 {sync.nlpRevision ?? '확인 전'}
            {sync.checkedAt && ` · 마지막 확인 ${formatDateTime(sync.checkedAt)}`}
            {sync.error && ` · ${syncErrors[sync.error] ?? `오류 ${sync.error}`}`}
          </span>
        </>
      ) : null}
      <span className="ml-auto flex gap-xs">
        <Button size="small" onClick={query.reload}>
          새로 고침
        </Button>
        {sync && (sync.status === 'FAILED' || sync.status === 'RETRYING') && (
          <Button size="small" type="primary" loading={isRetrying} onClick={retry}>
            다시 반영
          </Button>
        )}
      </span>
    </Card>
  )
}

function QuestionsAdminContent({ isMobile }: { isMobile: boolean }) {
  const [tab, setTab] = useState<Tab>('unanswered')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingIntent, setEditingIntent] = useState<IntentItem | null | undefined>()
  const [editingQa, setEditingQa] = useState<QaItem | null | undefined>()

  const load = useCallback(async (signal: AbortSignal) => {
    const [intents, qas, businesses, documents] = await Promise.all([
      getIntents(signal),
      getQaList(signal),
      getBusinesses(signal),
      getAdminDocuments(signal),
    ])
    return { intents, qas, businesses: businesses.items, documents }
  }, [])
  const query = useApiQuery(`nlp-admin:${refreshKey}`, load)
  const refresh = () => setRefreshKey((key) => key + 1)

  if (query.error) {
    return (
      <LoadingError title="물어보기 관리 정보를 불러오지 못했어요" error={query.error} onRetry={query.reload} />
    )
  }

  const data = query.data
  const options: NlpOptions = {
    businesses: (data?.businesses ?? []).map((item) => ({ value: item.id, label: item.name })),
    documents: (data?.documents ?? []).map((doc) => ({ value: doc.id, label: doc.title })),
    qas: (data?.qas ?? []).map((qa) => ({ value: qa.id, label: `${qa.qaKey} · ${qa.question}` })),
    intents: (data?.intents ?? []).map((intent) => ({ value: intent.id, label: `${intent.name} (${intent.intentKey})` })),
  }

  const intentColumns = [
    { title: '의도명', dataIndex: 'name', render: (name: string, item) => <Button type="link" className="h-auto p-0 text-caption" onClick={() => setEditingIntent(item)}>{name}</Button> },
    { title: '키', dataIndex: 'intentKey' },
    { title: '사업', key: 'business', render: (_, item) => businessNames(item.businessScope, item.businesses) },
    {
      title: '연결 대상',
      key: 'target',
      render: (_, { target }) =>
        target.type === 'QA' ? `Q&A ${target.qaKey}` : target.type === 'DOC' ? `문서 ${target.documentTitle}` : `화면 ${target.path}`,
    },
    { title: '예시', dataIndex: 'exampleCount', className: 'whitespace-nowrap' },
    { title: '상태', dataIndex: 'active', render: activeTag },
  ] satisfies TableColumnsType<IntentItem>

  const qaColumns = [
    { title: '키', dataIndex: 'qaKey', render: (key: string, item) => <Button type="link" className="h-auto p-0 text-caption" onClick={() => setEditingQa(item)}>{key}</Button> },
    { title: '질문', dataIndex: 'question', render: (text: string) => <span className="line-clamp-2">{text}</span> },
    { title: '사업', key: 'business', render: (_, item) => businessNames(item.businessScope, item.businesses) },
    {
      title: '근거 문서',
      key: 'source',
      render: (_, { source }) =>
        source ? `${source.documentTitle}${source.page ? ` ${source.page}쪽` : ''}${source.deleted ? '(삭제됨)' : ''}` : '-',
    },
    { title: '상태', dataIndex: 'active', render: activeTag },
  ] satisfies TableColumnsType<QaItem>

  const listCard = (button: string, onAdd: () => void, table: ReactNode) => (
    <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-xs' : 'p-lg' }}>
      <div className="mb-sm flex justify-end">
        <Button type="primary" icon={<PlusOutlined />} disabled={!data} onClick={onAdd}>
          {button}
        </Button>
      </div>
      {table}
    </Card>
  )

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="물어보기 관리"
        description="물어보기가 답하는 의도와 Q&A를 관리하고, 답하지 못한 질문을 정리해요."
        actions={<PageGuide {...questionsGuide} />}
      />
      <SyncStatus refreshKey={refreshKey} />
      <UsersTabs
        ariaLabel="물어보기 관리 화면"
        isMobile={isMobile}
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'unanswered',
            label: '답 없음 질문',
            children: <UnansweredQuestions options={options} isMobile={isMobile} onKnowledgeChanged={refresh} />,
          },
          {
            key: 'intents',
            label: '의도',
            children: listCard(
              '새 의도',
              () => setEditingIntent(null),
              <Table<IntentItem>
                rowKey="id"
                columns={intentColumns}
                dataSource={data?.intents}
                loading={query.isLoading}
                size="small"
                scroll={{ x: 720 }}
                classNames={smallTableStyle}
              />,
            ),
          },
          {
            key: 'qa',
            label: 'Q&A',
            children: listCard(
              '새 Q&A',
              () => setEditingQa(null),
              <Table<QaItem>
                rowKey="id"
                columns={qaColumns}
                dataSource={data?.qas}
                loading={query.isLoading}
                size="small"
                scroll={{ x: 720 }}
                classNames={smallTableStyle}
              />,
            ),
          },
          {
            key: 'stats',
            label: '통계',
            children: <QuestionStatsView businesses={options.businesses} isMobile={isMobile} />,
          },
          { key: 'eval', label: '평가', children: <EvalView isMobile={isMobile} /> },
        ]}
      />
      {editingIntent !== undefined && (
        <IntentDrawer
          item={editingIntent}
          options={options}
          isMobile={isMobile}
          onClose={() => setEditingIntent(undefined)}
          onSaved={refresh}
        />
      )}
      {editingQa !== undefined && (
        <QaDrawer
          item={editingQa}
          options={options}
          isMobile={isMobile}
          onClose={() => setEditingQa(undefined)}
          onSaved={refresh}
        />
      )}
    </div>
  )
}

export default function QuestionsAdminPage() {
  const { isMobile } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()

  if (!isAdmin(user)) {
    return (
      <NoPermission description="물어보기 관리는 관리자만 할 수 있어요." />
    )
  }
  return <QuestionsAdminContent isMobile={isMobile} />
}
