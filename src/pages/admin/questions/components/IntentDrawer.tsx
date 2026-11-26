import { useCallback, useState } from 'react'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Drawer, Form, Input, Select, Spin, Switch } from 'antd'

import { getApiErrorMessage, isConflict } from '../../../../api/client'
import { createIntent, getIntentDetail, getKnowledgeRevision, updateIntent } from '../../../../api/nlpAdmin'
import useApiQuery from '../../../../hooks/useApiQuery'
import LoadingError from '../../../../components/common/LoadingError'
import type { IntentForm, IntentItem, TargetType } from '../../../../types/nlpAdmin'
import {
  ALL_BUSINESSES,
  fieldErrorsOf,
  fromScope,
  normalizeBusinesses,
  toScope,
  withScopedBusinesses,
  type NlpOptions,
} from '../nlpAdminData'

type FormValues = Omit<IntentForm, 'revision' | 'businessScope'>

const fieldNames = ['intentKey', 'name', 'businessIds', 'targetType', 'qaId', 'documentId', 'path'] as const
const targetLabels: Record<TargetType, string> = { QA: 'Q&A', DOC: '문서', SCREEN: '화면' }

type IntentDrawerProps = {
  item: IntentItem | null // null이면 새 의도
  options: NlpOptions
  isMobile: boolean
  onClose: () => void
  onSaved: () => void
}

export default function IntentDrawer({ item, options, isMobile, onClose, onSaved }: IntentDrawerProps) {
  const intentId = item?.id
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (intentId) return getIntentDetail(intentId, signal)
      const { revision } = await getKnowledgeRevision(signal)
      const blank: IntentForm = {
        revision,
        intentKey: '',
        name: '',
        businessScope: 'ALL',
        businessIds: [],
        targetType: 'QA',
        qaId: null,
        documentId: null,
        path: null,
        active: true,
        examples: [{ example: '' }],
      }
      return blank
    },
    [intentId],
  )
  const query = useApiQuery(`intent-detail:${intentId ?? 'new'}`, load)

  return (
    <Drawer open size={isMobile ? '100%' : 560} title={item ? '의도 편집' : '새 의도'} onClose={onClose} destroyOnHidden>
      {query.error ? (
        <LoadingError plain title="의도를 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : !query.data ? (
        <Spin className="m-auto block" aria-label="의도 불러오는 중" />
      ) : (
        <IntentEditor
          key={query.data.revision}
          intentId={intentId}
          initial={query.data}
          businessOptions={withScopedBusinesses(options.businesses, item?.businesses)}
          options={options}
          onReload={query.reload}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Drawer>
  )
}

type IntentEditorProps = {
  intentId?: string
  initial: IntentForm
  businessOptions: NlpOptions['businesses']
  options: NlpOptions
  onReload: () => void
  onClose: () => void
  onSaved: () => void
}

function IntentEditor({ intentId, initial, businessOptions, options, onReload, onClose, onSaved }: IntentEditorProps) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const targetType = Form.useWatch('targetType', form) ?? initial.targetType
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<unknown>()

  async function submit() {
    // getFieldsValue(true): 화면에 없는 예시 id까지 함께 보낸다(빠진 기존 예시는 서버에서 삭제된다).
    const values: FormValues = form.getFieldsValue(true)
    const payload: IntentForm = {
      revision: initial.revision,
      intentKey: values.intentKey,
      name: values.name.trim(),
      ...toScope(values.businessIds),
      targetType: values.targetType,
      qaId: values.targetType === 'QA' ? values.qaId : null,
      documentId: values.targetType === 'DOC' ? values.documentId : null,
      path: values.targetType === 'SCREEN' ? values.path?.trim() ?? null : null,
      active: values.active,
      examples: values.examples.map(({ id, example }) => ({ id: id ?? null, example: example.trim() })),
    }
    setIsSaving(true)
    setError(undefined)
    try {
      if (intentId) await updateIntent(intentId, payload)
      else await createIntent(payload)
      message.success('저장했어요. 물어보기에는 잠시 뒤 반영돼요.')
      onSaved()
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
      <div className="grid grid-cols-2 gap-x-md">
        <Form.Item
          name="intentKey"
          label="의도 키"
          extra="NLP가 쓰는 이름이에요. 영문·숫자·밑줄을 권장해요."
          rules={[{ required: true, whitespace: true, message: '키를 입력해 주세요.' }, { max: 100 }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="의도명"
          rules={[{ required: true, whitespace: true, message: '의도명을 입력해 주세요.' }, { max: 255 }]}
        >
          <Input />
        </Form.Item>
      </div>
      <Form.Item
        name="businessIds"
        label="사업"
        getValueFromEvent={normalizeBusinesses}
        rules={[{ required: true, type: 'array', min: 1, message: '사업을 선택해 주세요.' }]}
      >
        <Select mode="multiple" options={[{ value: ALL_BUSINESSES, label: '공통' }, ...businessOptions]} />
      </Form.Item>
      <div className="grid grid-cols-[120px_1fr] gap-x-md">
        <Form.Item name="targetType" label="연결 대상">
          <Select options={Object.entries(targetLabels).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        {targetType === 'QA' && (
          <Form.Item name="qaId" label="Q&A" rules={[{ required: true, message: 'Q&A를 선택해 주세요.' }]}>
            <Select showSearch optionFilterProp="label" options={options.qas} />
          </Form.Item>
        )}
        {targetType === 'DOC' && (
          <Form.Item name="documentId" label="문서" rules={[{ required: true, message: '문서를 선택해 주세요.' }]}>
            <Select showSearch optionFilterProp="label" options={options.documents} />
          </Form.Item>
        )}
        {targetType === 'SCREEN' && (
          <Form.Item
            name="path"
            label="화면 경로"
            rules={[
              { required: true, whitespace: true, message: '경로를 입력해 주세요.' },
              { pattern: /^\/(?!\/)[^\\:]*$/, message: '/로 시작하는 내부 경로를 입력해 주세요.' },
            ]}
          >
            <Input placeholder="/tasks" />
          </Form.Item>
        )}
      </div>
      <Form.Item label="예시 질문" required>
        <Form.List name="examples">
          {(fields, { add, remove }) => (
            <div className="flex flex-col gap-xs">
              {fields.map((field) => (
                <div key={field.key} className="flex items-start gap-xs">
                  <Form.Item
                    name={[field.name, 'example']}
                    className="mb-0 flex-1"
                    rules={[{ required: true, whitespace: true, message: '예시를 입력하거나 지워 주세요.' }, { max: 500 }]}
                  >
                    <Input />
                  </Form.Item>
                  <Button aria-label="예시 지우기" icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                </div>
              ))}
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ example: '' })}>
                예시 추가
              </Button>
            </div>
          )}
        </Form.List>
      </Form.Item>
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
