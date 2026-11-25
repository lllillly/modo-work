import { useState } from 'react'
import { CopyOutlined, DeleteOutlined } from '@ant-design/icons'
import { Alert, App, Button, Form, Input, Modal, Select } from 'antd'

import type { IssuedApiClient } from '../../../../types/apiClients'
import { ApiError } from '../../../../api/client'
import { issueApiClient, revokeApiClient } from '../../../../api/apiClients'
import { getBusinesses } from '../../../../api/courses'
import useApiQuery from '../../../../hooks/useApiQuery'
import IconAction from '../../../../components/common/IconAction'
import ContentCard from '../../../../components/common/ContentCard'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'
import { formatDateTime } from '../../../../utils/date'

type IssueForm = { name: string; businesses: string[] }

export default function ServiceTokens() {
  const { modal, message } = App.useApp()
  const { showError } = useApiErrorHandler()
  const [form] = Form.useForm<IssueForm>()
  const businesses = useApiQuery('businesses', getBusinesses)
  const [issuing, setIssuing] = useState(false)
  const [issued, setIssued] = useState<IssuedApiClient[]>([])
  const [shown, setShown] = useState<IssuedApiClient | null>(null)
  const [revokeId, setRevokeId] = useState('')
  const businessOptions = (businesses.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))
  const businessName = (id: string) => businessOptions.find((option) => option.value === id)?.label ?? `사업 ${id}`
  const exampleUrl = `${window.location.origin}${import.meta.env.BASE_URL}api/integration/courses/summary?business=`

  async function issue(values: IssueForm) {
    setIssuing(true)
    try {
      const result = await issueApiClient(values.name.trim(), values.businesses)
      setIssued((current) => [result, ...current])
      setShown(result)
      form.resetFields()
    } catch (error) {
      showError(error)
    } finally {
      setIssuing(false)
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      message.success('복사했어요')
    } catch {
      message.error('복사하지 못했어요. 직접 선택해서 복사해 주세요.')
    }
  }

  function revoke(id: string, name?: string) {
    modal.confirm({
      title: '토큰을 폐기할까요?',
      content: `${name ? `${name} (발급 ID ${id})` : `발급 ID ${id}`}. 폐기하면 이 토큰으로 요약을 읽을 수 없고 되돌릴 수 없어요.`,
      okText: '폐기',
      okButtonProps: { danger: true },
      cancelText: '취소',
      onOk: async () => {
        try {
          await revokeApiClient(id)
          message.success('토큰을 폐기했어요.')
          setIssued((current) => current.filter((item) => item.id !== id))
          setRevokeId('')
        } catch (error) {
          if (error instanceof ApiError && error.status === 404) message.error('없는 발급 ID예요. 다시 확인해 주세요.')
          else showError(error)
        }
      },
    })
  }

  return (
    <div className="grid grid-cols-1 items-start gap-md min-[1200px]:grid-cols-2">
      <ContentCard>
        <h2 className="m-0 text-card-title">토큰 발급</h2>
        <p className="mt-xxs mb-sm text-caption text-(--ant-color-text-secondary)">
          토큰은 고른 사업의 과정 요약만 읽을 수 있어요. 토큰 원문은 발급할 때 한 번만 보여 줘요.
        </p>
        <Form<IssueForm> form={form} layout="vertical" requiredMark={false} onFinish={(values) => void issue(values)}>
          <Form.Item name="name" label="이름" rules={[{ required: true, whitespace: true, message: '이름을 입력해 주세요' }]} extra="예: 출석 관리 시스템 연동">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="businesses" label="읽을 수 있는 사업" rules={[{ required: true, message: '사업을 하나 이상 골라 주세요' }]}>
            <Select mode="multiple" options={businessOptions} loading={businesses.isLoading} placeholder="사업 고르기" />
          </Form.Item>
          <Form.Item label="권한" className="mb-md">
            <span className="block rounded-md bg-(--ant-color-fill-quaternary) px-sm py-xs text-body text-(--ant-color-text-secondary)">
              과정 요약 읽기 (COURSE_SUMMARY_READ)
            </span>
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={issuing}>
              발급
            </Button>
          </div>
        </Form>
      </ContentCard>

      <ContentCard>
        <h2 className="m-0 text-card-title">토큰 폐기</h2>
        <p className="mt-xxs mb-sm text-caption text-(--ant-color-text-secondary)">
          발급한 토큰 목록을 불러오는 기능이 아직 없어요. 이 화면에서 방금 발급한 토큰만 아래에 보이고, 새로고침하면 사라져요. 다른 토큰은 발급 ID로 폐기해 주세요.
        </p>
        {issued.length > 0 && (
          <ul className="m-0 mb-sm list-none p-0">
            {issued.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-sm last:border-b-0"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body font-medium">{item.name}</span>
                  <span className="text-caption text-(--ant-color-text-tertiary)">
                    발급 ID {item.id} · {item.businesses.map(businessName).join(', ')} · {formatDateTime(item.issuedAt)}
                  </span>
                </span>
                <IconAction label="폐기" ariaLabel={`${item.name} 폐기`} icon={<DeleteOutlined />} tone="danger" onClick={() => revoke(item.id, item.name)} />
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-xs">
          <Input
            aria-label="폐기할 발급 ID"
            placeholder="발급 ID"
            value={revokeId}
            onChange={(event) => setRevokeId(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
          />
          <Button danger disabled={!revokeId} onClick={() => revoke(revokeId)}>
            폐기
          </Button>
        </div>
      </ContentCard>

      {shown && (
        <Modal
          open
          title="토큰을 발급했어요"
          closable={false}
          maskClosable={false}
          keyboard={false}
          footer={<Button type="primary" onClick={() => setShown(null)}>복사했어요, 닫기</Button>}
        >
          <div className="flex flex-col gap-sm">
            <Alert type="warning" showIcon title="이 창을 닫으면 토큰을 다시 볼 수 없어요. 지금 복사해서 안전한 곳에 보관해 주세요." />
            <div>
              <p className="m-0 mb-xxs text-caption text-(--ant-color-text-secondary)">
                {shown.name} · 발급 ID {shown.id}
              </p>
              <div className="flex gap-xs">
                <Input readOnly value={shown.token} aria-label="토큰 원문" className="font-mono" />
                <Button icon={<CopyOutlined aria-hidden />} onClick={() => void copy(shown.token)}>
                  복사
                </Button>
              </div>
            </div>
            <div>
              <p className="m-0 mb-xxs text-caption text-(--ant-color-text-secondary)">호출 예시</p>
              <pre className="m-0 overflow-x-auto rounded-md bg-(--ant-color-fill-quaternary) p-sm text-caption whitespace-pre-wrap break-all">
                {`curl -H "Authorization: Bearer <토큰>" \\\n  "${exampleUrl}${shown.businesses[0]}"`}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
