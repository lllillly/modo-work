import { useCallback, useState } from 'react'
import { App, Button, Drawer, Form, Input, InputNumber, Select, Spin, Switch } from 'antd'

import { getApiErrorMessage, isConflict } from '../../../../api/client'
import { createQa, getKnowledgeRevision, getQaDetail, updateQa } from '../../../../api/nlpAdmin'
import useApiQuery from '../../../../hooks/useApiQuery'
import LoadingError from '../../../../components/common/LoadingError'
import type { QaForm, QaItem } from '../../../../types/nlpAdmin'
import {
  ALL_BUSINESSES,
  fieldErrorsOf,
  fromScope,
  normalizeBusinesses,
  toScope,
  withScopedBusinesses,
  type NlpOptions,
} from '../nlpAdminData'

type FormValues = Omit<QaForm, 'revision' | 'businessScope'>

const fieldNames = ['qaKey', 'question', 'answer', 'businessIds', 'sourceDocumentId', 'sourcePage'] as const

type QaDrawerProps = {
  item: QaItem | null // null이면 새 Q&A
  initialQuestion?: string // 답 없음 질문에서 열 때 질문 칸 초기값
  options: NlpOptions
  isMobile: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
}

export default function QaDrawer({ item, initialQuestion, options, isMobile, onClose, onSaved }: QaDrawerProps) {
  const qaId = item?.id
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (qaId) return getQaDetail(qaId, signal)
      const { revision } = await getKnowledgeRevision(signal)
      const blank: QaForm = {
        revision,
        qaKey: '',
        question: initialQuestion ?? '',
        answer: '',
        businessScope: 'ALL',
        businessIds: [],
        sourceDocumentId: null,
        sourcePage: null,
        active: true,
      }
      return blank
    },
    [qaId, initialQuestion],
  )
  const query = useApiQuery(`qa-detail:${qaId ?? 'new'}:${initialQuestion ?? ''}`, load)

  return (
    <Drawer open size={isMobile ? '100%' : 560} title={item ? 'Q&A 편집' : '새 Q&A'} onClose={onClose} destroyOnHidden>
      {query.error ? (
        <LoadingError plain title="Q&A를 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : !query.data ? (
        <Spin className="m-auto block" aria-label="Q&A 불러오는 중" />
      ) : (
        <QaEditor
          qaId={qaId}
          initial={query.data}
          businessOptions={withScopedBusinesses(options.businesses, item?.businesses)}
          documentOptions={
            item?.source && !options.documents.some((doc) => doc.value === item.source?.documentId)
              ? [...options.documents, { value: item.source.documentId, label: `${item.source.documentTitle}(삭제됨)` }]
              : options.documents
          }
          onReload={query.reload}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Drawer>
  )
}

type QaEditorProps = {
  qaId?: string
  initial: QaForm
  businessOptions: NlpOptions['businesses']
  documentOptions: NlpOptions['documents']
  onReload: () => void
  onClose: () => void
  onSaved: () => void | Promise<void>
}

function QaEditor({ qaId, initial, businessOptions, documentOptions, onReload, onClose, onSaved }: QaEditorProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const sourceDocumentId = Form.useWatch('sourceDocumentId', form) ?? initial.sourceDocumentId
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<unknown>()

  async function submit(values: FormValues) {
    const payload: QaForm = {
      revision: initial.revision,
      qaKey: values.qaKey,
      question: values.question,
      answer: values.answer,
      ...toScope(values.businessIds),
      sourceDocumentId: values.sourceDocumentId ?? null,
      sourcePage: values.sourceDocumentId ? values.sourcePage ?? null : null,
      active: values.active,
    }
    setIsSaving(true)
    setError(undefined)
    try {
      if (qaId) await updateQa(qaId, payload)
      else await createQa(payload)
      message.success('저장했어요. 물어보기에는 잠시 뒤 반영돼요.')
      await onSaved()
      onClose()
    } catch (caught) {
      setError(caught)
      form.setFields(fieldErrorsOf(caught, fieldNames))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={isSaving}
      initialValues={{ ...initial, businessIds: fromScope(initial.businessScope, initial.businessIds) }}
      onFinish={submit}
    >
      <Form.Item
        name="qaKey"
        label="Q&A 키"
        rules={[{ required: true, whitespace: true, message: '키를 입력해 주세요.' }, { max: 100 }]}
      >
        <Input placeholder="QA-01" />
      </Form.Item>
      <Form.Item name="question" label="질문" rules={[{ required: true, whitespace: true, message: '질문을 입력해 주세요.' }]}>
        <Input.TextArea autoSize={{ minRows: 2 }} />
      </Form.Item>
      <Form.Item name="answer" label="답변" rules={[{ required: true, whitespace: true, message: '답변을 입력해 주세요.' }]}>
        <Input.TextArea autoSize={{ minRows: 4 }} />
      </Form.Item>
      <Form.Item
        name="businessIds"
        label="사업"
        getValueFromEvent={normalizeBusinesses}
        rules={[{ required: true, type: 'array', min: 1, message: '사업을 선택해 주세요.' }]}
      >
        <Select mode="multiple" options={[{ value: ALL_BUSINESSES, label: '공통' }, ...businessOptions]} />
      </Form.Item>
      <div className="grid grid-cols-[1fr_120px] gap-x-md">
        <Form.Item name="sourceDocumentId" label="근거 문서">
          <Select allowClear showSearch optionFilterProp="label" placeholder="없음" options={documentOptions} />
        </Form.Item>
        <Form.Item name="sourcePage" label="쪽" rules={[{ type: 'integer', min: 1, message: '1 이상' }]}>
          <InputNumber min={1} precision={0} disabled={!sourceDocumentId} className="w-full" />
        </Form.Item>
      </div>
      <Form.Item name="active" label="물어보기에 사용" valuePropName="checked" extra="끄면 삭제하지 않고 숨겨요.">
        <Switch />
      </Form.Item>
      {error !== undefined && (
        <div role="alert" className="mb-sm flex flex-col gap-xs text-caption text-(--ant-color-error)">
          {getApiErrorMessage(error)}
          {isConflict(error) && (
            <Button size="small" className="self-start" onClick={onReload}>
              최신 내용 불러오기(입력한 내용은 사라져요)
            </Button>
          )}
        </div>
      )}
      <div className="flex justify-end gap-xs">
        <Button disabled={isSaving} onClick={onClose}>
          취소
        </Button>
        <Button type="primary" htmlType="submit" loading={isSaving}>
          저장
        </Button>
      </div>
    </Form>
  )
}
