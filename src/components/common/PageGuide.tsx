import { useState } from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Collapse, Modal } from 'antd'

export type GuideContent = {
  title: string
  steps: string[]
  sections: { title: string; items: string[] }[]
}

export default function PageGuide({ title, steps, sections }: GuideContent) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button icon={<QuestionCircleOutlined aria-hidden />} onClick={() => setOpen(true)}>
        사용 방법
      </Button>
      <Modal
        open={open}
        title={title}
        width={560}
        style={{ top: 40 }}
        onCancel={() => setOpen(false)}
        footer={
          <Button type="primary" onClick={() => setOpen(false)}>
            알겠어요
          </Button>
        }
      >
        <div className="flex flex-col gap-md pt-xs">
          <div className="rounded-lg bg-(--ant-color-fill-quaternary) p-md">
            <p className="m-0 mb-sm text-caption font-medium text-(--ant-color-text-secondary)">한눈에 보기</p>
            <ol className="m-0 flex list-none flex-col gap-sm p-0">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-sm text-body">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--ant-color-primary-bg) text-caption font-medium text-(--ant-color-primary-text)">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="m-0 mb-xs text-caption font-medium text-(--ant-color-text-secondary)">자세히 보기</p>
            <Collapse
              accordion
              expandIconPlacement="end"
              items={sections.map((section) => ({
                key: section.title,
                label: <span className="font-medium">{section.title}</span>,
                children: (
                  <ul className="m-0 flex list-disc flex-col gap-xxs pl-md text-body leading-relaxed text-(--ant-color-text-secondary)">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              }))}
            />
          </div>
        </div>
      </Modal>
    </>
  )
}
