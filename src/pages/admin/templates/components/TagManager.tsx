import { useCallback, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Alert, App, Button, Input, Modal, Space, Spin, Switch } from 'antd'

import { getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { createTemplateTag, getTemplateTags, updateTemplateTag } from '../../../../api/taskTemplates'
import useApiQuery from '../../../../hooks/useApiQuery'
import { useAuth } from '../../../../providers/AuthContext'
import type { TemplateTag } from '../../../../types/taskTemplate'

type TagManagerProps = { businessId: string; onClose: () => void }

export default function TagManager({ businessId, onClose }: TagManagerProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const load = useCallback((signal: AbortSignal) => getTemplateTags(businessId, signal), [businessId])
  const query = useApiQuery(`template-tags:${businessId}`, load)
  const [list, setList] = useState<{ source?: TemplateTag[]; tags: TemplateTag[] }>({ tags: [] })
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  if (query.data && query.data !== list.source) setList({ source: query.data, tags: query.data })
  const tags = list.tags

  function putTag(tag: TemplateTag) {
    setList((value) => {
      const exists = value.tags.some((item) => item.id === tag.id)
      const next = exists ? value.tags.map((item) => (item.id === tag.id ? tag : item)) : [...value.tags, tag]
      return { ...value, tags: next.sort((a, b) => a.name.localeCompare(b.name)) }
    })
  }

  async function run(id: string, request: () => Promise<string>) {
    setSavingId(id)
    try {
      message.success(await request())
      setEditing(null)
    } catch (error) {
      message.error(getApiErrorMessage(error))
      if (isAuthStateError(error)) void refreshUser()
      else query.reload()
    } finally {
      setSavingId(null)
    }
  }

  function addTag() {
    const name = newName.trim()
    if (!name) return
    void run('new', async () => {
      const { tag } = await createTemplateTag(businessId, name)
      putTag(tag)
      setNewName('')
      return `'${name}' 태그를 만들었어요.`
    })
  }

  function rename(tag: TemplateTag, name: string) {
    if (!name || name === tag.name) {
      setEditing(null)
      return
    }
    void run(tag.id, async () => {
      const result = await updateTemplateTag(tag.id, { version: tag.version, name })
      putTag(result.tag)
      const { updatedTaskCount, mismatchCount } = result.recalculation
      return `이름을 바꿨어요. 미완료 할 일 ${updatedTaskCount}건에 반영했어요.${
        mismatchCount > 0 ? ` 완료한 할 일 ${mismatchCount}건은 이전 이름으로 남아요.` : ''
      }`
    })
  }

  function toggle(tag: TemplateTag, isActive: boolean) {
    void run(tag.id, async () => {
      const result = await updateTemplateTag(tag.id, { version: tag.version, isActive })
      putTag(result.tag)
      return isActive ? `'${tag.name}' 태그를 다시 켰어요.` : `'${tag.name}' 태그를 껐어요.`
    })
  }

  return (
    <Modal
      open
      title="태그 관리"
      centered
      onCancel={onClose}
      mask={{ blur: false }}
      footer={<Button onClick={onClose}>닫기</Button>}
      classNames={{ body: 'max-h-[calc(100svh-240px)] overflow-y-auto break-keep' }}
    >
      <p className="mt-0 mb-sm text-caption text-(--ant-color-text-secondary)">
        off한 태그는 새로 붙일 수 없지만, 이미 붙은 템플릿과 할 일에는 그대로 남아요. 이름을 바꾸면 미완료 할 일에 바로
        반영돼요.
      </p>
      <Space.Compact className="mb-sm w-full">
        <Input
          aria-label="새 태그 이름"
          placeholder="새 태그 이름"
          maxLength={50}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onPressEnter={addTag}
        />
        <Button icon={<PlusOutlined />} loading={savingId === 'new'} onClick={addTag}>
          추가
        </Button>
      </Space.Compact>

      {query.error ? (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(query.error)}
          action={
            <Button size="small" onClick={query.reload}>
              다시 시도
            </Button>
          }
        />
      ) : !list.source ? (
        <Spin aria-label="태그 불러오는 중" />
      ) : tags.length === 0 ? (
        <p className="m-0 py-md text-center text-caption text-(--ant-color-text-tertiary)">아직 태그가 없어요.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex min-h-12 items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) py-xs last:border-b-0"
            >
              {editing?.id === tag.id ? (
                <Space.Compact className="min-w-0 flex-1">
                  <Input
                    autoFocus
                    aria-label={`${tag.name} 새 이름`}
                    maxLength={50}
                    value={editing.name}
                    onChange={(event) => setEditing({ id: tag.id, name: event.target.value })}
                    onPressEnter={() => rename(tag, editing.name.trim())}
                  />
                  <Button type="primary" loading={savingId === tag.id} onClick={() => rename(tag, editing.name.trim())}>
                    저장
                  </Button>
                  <Button onClick={() => setEditing(null)}>취소</Button>
                </Space.Compact>
              ) : (
                <>
                  <span
                    className={`min-w-0 flex-1 text-body ${tag.isActive ? '' : 'text-(--ant-color-text-tertiary)'}`}
                  >
                    {tag.name}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    className="h-auto p-0"
                    disabled={!!savingId}
                    onClick={() => setEditing({ id: tag.id, name: tag.name })}
                  >
                    이름 바꾸기
                  </Button>
                </>
              )}
              <Switch
                aria-label={`${tag.name} 사용`}
                checked={tag.isActive}
                loading={savingId === tag.id && editing?.id !== tag.id}
                disabled={!!savingId || editing?.id === tag.id}
                onChange={(checked) => toggle(tag, checked)}
              />
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
