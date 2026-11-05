import { Button, Form, Input } from 'antd'

import { demoAccounts } from '../demoAccounts'

import type { AuthErrorResponse, TestLoginRequest } from '../../../types/auth'

type TestLoginFormProps = {
  showDemoAccounts: boolean
  isSubmitting: boolean
  onSubmit: (values: TestLoginRequest) => Promise<AuthErrorResponse['fieldErrors'] | undefined>
}

export default function TestLoginForm({ showDemoAccounts, isSubmitting, onSubmit }: TestLoginFormProps) {
  const [form] = Form.useForm<TestLoginRequest>()

  async function handleSubmit(values: TestLoginRequest) {
    if (isSubmitting) return
    const fieldErrors = await onSubmit(values)

    if (!fieldErrors) return

    form.setFields(
      (['email', 'password', 'name'] as const).map((field) => ({
        name: field,
        errors: fieldErrors
          .filter((error) => error.field === field)
          .map((error) => error.message),
      })),
    )
  }

  return (
    <Form
      form={form}
      name="test-login"
      layout="vertical"
      requiredMark={false}
      disabled={isSubmitting}
      onFinish={handleSubmit}
      scrollToFirstError={{ focus: true }}
      noValidate
      className="flex flex-col gap-md"
    >
      <Form.Item
        label="이메일"
        name="email"
        rules={[
          { required: true, message: '이메일을 입력해 주세요.' },
          { type: 'email', transform: (value: string) => value.trim(), message: '이메일 형식을 확인해 주세요.' },
        ]}
        className="mb-0"
      >
        <Input
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="이메일 입력"
          maxLength={255}
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="시험 비밀번호"
        name="password"
        rules={[{ required: true, message: '시험 비밀번호를 입력해 주세요.' }]}
        extra={
          <span className="text-caption text-(--ant-color-text-tertiary)">
            팀에서 공유한 공통 비밀번호예요.
          </span>
        }
        className="mb-0"
      >
        <Input.Password
          autoComplete="current-password"
          placeholder="공통 시험 비밀번호 입력"
          size="large"
        />
      </Form.Item>

      <Form.Item
        label="이름"
        name="name"
        rules={[{ type: 'string', max: 100, message: '이름은 100자 이하로 입력해 주세요.' }]}
        extra={
          <span className="text-caption text-(--ant-color-text-tertiary)">
            처음 로그인할 때만 입력해요. 이미 가입한 계정이면 비워도 돼요.
          </span>
        }
        className="mb-0"
      >
        <Input autoComplete="name" placeholder="예: 담당자 A" maxLength={100} size="large" />
      </Form.Item>

      <Button type="primary" htmlType="submit" size="large" block loading={isSubmitting} className="font-medium">
        로그인
      </Button>

      {showDemoAccounts && (
        <div className="flex flex-col gap-sm">
          <p className="m-0 text-body text-(--ant-color-text-secondary)">
            시연용 계정 이메일 채우기 (비밀번호는 직접 입력해주세요)
          </p>
          <div className="grid grid-cols-3 gap-xs">
            {demoAccounts.map((account) => (
              <Button
                key={account.email}
                htmlType="button"
                onClick={() => form.setFieldValue('email', account.email)}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Form>
  )
}
