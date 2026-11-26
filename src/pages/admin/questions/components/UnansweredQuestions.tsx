import { useCallback, useState } from 'react'
import { App, Button, Card, Form, Input, Modal, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'

import { getApiErrorMessage } from '../../../../api/client'
import { getIntentDetail, getUnhandledQuestions, handleQuestion, updateIntent } from '../../../../api/nlpAdmin'
import { PAGE_SIZE } from '../../../../api/pagination'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { QuestionLog } from '../../../../types/nlpAdmin'
import type { NlpOptions } from '../nlpAdminData'
import QaDrawer from './QaDrawer'
import LoadingError from '../../../../components/common/LoadingError'
import EmptyData from '../../../../components/common/EmptyData'
import { formatDateTime } from '../../../../utils/date'

type UnansweredQuestionsProps = {
  options: NlpOptions
  isMobile: boolean
  onKnowledgeChanged: () => void
}

export default function UnansweredQuestions({ options, isMobile, onKnowledgeChanged }: UnansweredQuestionsProps) {
  const { message } = App.useApp()
  const [page, setPage] = useState(0)
  const load = useCallback((signal: AbortSignal) => getUnhandledQuestions(page, PAGE_SIZE, signal), [page])
  const query = useApiQuery(`unhandled-questions:${page}`, load)
  const [exampleTarget, setExampleTarget] = useState<QuestionLog | null>(null)
  const [qaTarget, setQaTarget] = useState<QuestionLog | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  // 마지막 페이지를 다 처리하면 앞 페이지로 돌아간다.
  if (query.data && query.data.items.length === 0 && page > 0) setPage(Math.max(0, query.data.totalPages - 1))

  // 지식 저장은 이미 끝났으므로 처리 표시가 실패해도 저장을 되돌리지 않고 안내만 한다.
  async function markHandled(log: QuestionLog) {
    setBusyId(log.id)
    try {
      await handleQuestion(log.id)
      message.success('처리했어요.')
    } catch (error) {
      message.error(`처리 표시를 못 했어요. ${getApiErrorMessage(error)}`)
    } finally {
      setBusyId(null)
      query.reload()
    }
  }

  const columns = [
    { title: '질문', dataIndex: 'maskedQuery', render: (text: string) => <span className="break-all">{text}</span> },
    {
      title: '종류',
      dataIndex: 'requestType',
      className: 'whitespace-nowrap',
      render: (type: QuestionLog['requestType']) => (type === 'NONE_SELECTED' ? '후보 중 없음' : '질문'),
    },
    {
      title: '받은 시각',
      dataIndex: 'createdAt',
      className: 'whitespace-nowrap',
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '',
      key: 'actions',
      className: 'whitespace-nowrap',
      render: (_, log) => (
        <span className="flex justify-end gap-xs">
          <Button
            size="small"
            disabled={busyId !== null}
            onClick={() => setExampleTarget(log)}
            className={busyId === null ? 'border-(--ant-color-info) text-(--ant-color-primary-text)' : ''}
          >
            예시로 추가
          </Button>
          <Button size="small" disabled={busyId !== null} onClick={() => setQaTarget(log)}>
            Q&A로 등록
          </Button>
          <Button
            size="small"
            type="text"
            loading={busyId === log.id}
            disabled={busyId !== null}
            onClick={() => markHandled(log)}
            className={busyId === null ? 'text-(--ant-color-text-tertiary)' : ''}
          >
            처리만
          </Button>
        </span>
      ),
    },
  ] satisfies TableColumnsType<QuestionLog>

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-xs' : 'p-lg' }}>
      {query.error ? (
        <LoadingError plain title="답 없음 질문을 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : (
        <Table<QuestionLog>
          rowKey="id"
          columns={columns}
          dataSource={query.data?.items}
          loading={query.isLoading}
          size="small"
          scroll={{ x: 640 }}
          locale={{ emptyText: <EmptyData plain compact title="처리할 답 없음 질문이 없어요" /> }}
          pagination={{
            current: page + 1,
            pageSize: PAGE_SIZE,
            total: query.data?.totalElements,
            showSizeChanger: false,
            onChange: (next) => setPage(next - 1),
          }}
        />
      )}
      <p className="mt-sm mb-0 text-caption text-(--ant-color-text-tertiary)">
        개인정보는 가려진 채로 보여요. 예시나 Q&A로 등록하면 그 질문은 처리됨으로 바뀌어요.
      </p>
      {exampleTarget && (
        <AddExampleModal
          log={exampleTarget}
          intents={options.intents}
          onClose={() => setExampleTarget(null)}
          onSaved={async () => {
            setExampleTarget(null)
            onKnowledgeChanged()
            await markHandled(exampleTarget)
          }}
        />
      )}
      {qaTarget && (
        <QaDrawer
          item={null}
          initialQuestion={qaTarget.maskedQuery}
          options={options}
          isMobile={isMobile}
          onClose={() => setQaTarget(null)}
          onSaved={async () => {
            onKnowledgeChanged()
            await markHandled(qaTarget)
          }}
        />
      )}
    </Card>
  )
}

type AddExampleModalProps = {
  log: QuestionLog
  intents: NlpOptions['intents']
  onClose: () => void
  onSaved: () => Promise<void>
}

function AddExampleModal({ log, intents, onClose, onSaved }: AddExampleModalProps) {
  const [form] = Form.useForm<{ intentId: string; example: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit({ intentId, example }: { intentId: string; example: string }) {
    setIsSaving(true)
    setError('')
    try {
      // 전체 예시를 보내야 기존 예시가 지워지지 않는다(nlp-management.md 8장).
      const { id, ...detail } = await getIntentDetail(intentId)
      await updateIntent(id, { ...detail, examples: [...detail.examples, { example: example.trim() }] })
    } catch (caught) {
      setError(getApiErrorMessage(caught))
      setIsSaving(false)
      return
    }
    await onSaved()
  }

  return (
    <Modal
      open
      title="기존 의도의 예시로 추가"
      okText="추가"
      cancelText="취소"
      confirmLoading={isSaving}
      onOk={() => form.submit()}
      onCancel={onClose}
      mask={{ blur: false, closable: !isSaving }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" disabled={isSaving} initialValues={{ example: log.maskedQuery }} onFinish={submit}>
        <Form.Item name="intentId" label="의도" rules={[{ required: true, message: '의도를 선택해 주세요.' }]}>
          <Select showSearch optionFilterProp="label" options={intents} placeholder="의도 선택" />
        </Form.Item>
        <Form.Item
          name="example"
          label="예시 문장"
          extra="가려진 부분(개인정보 등)은 자연스러운 말로 고쳐 주세요."
          rules={[{ required: true, whitespace: true, message: '예시 문장을 입력해 주세요.' }, { max: 500 }]}
        >
          <Input.TextArea autoSize={{ minRows: 2 }} />
        </Form.Item>
        {error && <p className="m-0 text-caption text-(--ant-color-error)">{error}</p>}
      </Form>
    </Modal>
  )
}
