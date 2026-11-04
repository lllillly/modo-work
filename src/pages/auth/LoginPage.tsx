import { useState } from 'react'
import { Alert, App, Button, Card, Spin, Tag } from 'antd'
import { Navigate, useNavigate } from 'react-router'

import TestLoginForm from './components/TestLoginForm'

import { loginEmails, loginPreviewStates } from './loginMockData'
import type { LoginStatus } from './loginMockData'

import { AuthApiError } from '../../api/auth'
import { useAuth } from '../../providers/AuthContext'
import type { AuthErrorResponse, TestLoginRequest } from '../../types/auth'

const statusMessages = {
  pending: {
    type: 'info',
    title: '승인을 기다리고 있어요',
    description: '리더나 관리자가 역할을 지정하면 업무 화면을 이용할 수 있어요.',
  },
  invalid: {
    type: 'warning',
    title: '회사 계정으로 로그인해 주세요',
    description: `${loginEmails.invalid} 계정은 사용할 수 없어요. 회사 Google 계정으로 다시 로그인해 주세요.`,
  },
  inactive: {
    type: 'error',
    title: '사용이 중지된 계정이에요',
    description: '다시 사용하려면 관리자에게 문의해 주세요.',
  },
  nameRequired: {
    type: 'info',
    title: '처음 로그인하는 이메일이에요',
    description: '이름을 입력하면 계정이 만들어지고, 리더나 관리자의 승인을 기다려요.',
  },
  credentialsError: {
    type: 'error',
    title: '이메일 또는 비밀번호를 확인해 주세요',
    description: '입력한 정보를 확인한 후 다시 시도해 주세요.',
  },
  error: {
    type: 'warning',
    title: '잠시 연결이 원활하지 않아요',
    description: '네트워크나 서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요.',
  },
  expired: {
    type: 'info',
    title: '로그인 시간이 지났어요',
    description: '30분 동안 사용하지 않으면 자동으로 로그아웃돼요. 다시 로그인해 주세요.',
  },
} as const

export default function LoginPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const { user, isLoading, error, notice, login, logout, refreshUser, clearNotice } = useAuth()

  const [preview, setPreview] = useState<LoginStatus | null>(null)
  const [formStatus, setFormStatus] = useState<LoginStatus>('test')
  const [formError, setFormError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [formKey, setFormKey] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  let status = formStatus
  if (notice === 'expired' && formStatus === 'test') status = 'expired'
  if (user?.status === 'PENDING') status = 'pending'
  if (notice === 'inactive') status = 'inactive'
  if (error) status = 'error'
  if (preview) status = preview

  const showForm = status === 'test' || status === 'nameRequired' || status === 'credentialsError' || status === 'expired'
  const showIntroduction = status === 'login' || status === 'pending' || status === 'invalid' || status === 'inactive'
  const statusMessage = status === 'login' || status === 'test' ? null : statusMessages[status]
  const isBusy = isSubmitting || isChecking || isLoggingOut
  const accountEmail = preview ? email : user?.email

  function previewStatus(nextStatus: LoginStatus) {
    setPreview(nextStatus === 'test' ? null : nextStatus)
    setEmail(nextStatus === 'test' ? '' : nextStatus === 'nameRequired' ? loginEmails.newUser : loginEmails.existing)
    setFormStatus('test')
    setFormError(null)
    setFormKey((previous) => previous + 1)
    clearNotice()
  }

  async function submitTestLogin(values: TestLoginRequest): Promise<AuthErrorResponse['fieldErrors'] | undefined> {
    if (preview) {
      setPreview('pending')
      return
    }
    if (isSubmitting) return

    setIsSubmitting(true)
    setFormError(null)
    clearNotice()

    try {
      await login(values)
      setFormStatus('test')
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.code === 'VALIDATION_ERROR' && error.fieldErrors.length > 0) {
          return error.fieldErrors
        }
        if (error.code === 'INVALID_CREDENTIALS') {
          setFormStatus('credentialsError')
          setFormError(error.message)
          return
        }
        if (error.code === 'ACCOUNT_INACTIVE') return
        if (error.status < 500) {
          message.error(error.message)
          return
        }
      }

      setFormStatus('error')
      setFormError(error instanceof AuthApiError ? error.message : null)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function checkApproval() {
    if (preview) {
      message.info('아직 승인 대기 중이에요.')
      return
    }
    if (isBusy) return

    setIsChecking(true)
    try {
      const currentUser = await refreshUser()
      if (currentUser?.status === 'PENDING') message.info('아직 승인 대기 중이에요.')
    } finally {
      setIsChecking(false)
    }
  }

  async function handleLogout() {
    if (preview) {
      previewStatus('test')
      return
    }
    if (isBusy) return

    setIsLoggingOut(true)
    try {
      await logout()
      setEmail('')
      setFormStatus('test')
      setFormError(null)
      setFormKey((previous) => previous + 1)
    } catch {
      message.error('로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  async function retry() {
    if (preview) {
      previewStatus('test')
    } else if (error) {
      setIsChecking(true)
      try {
        await refreshUser()
      } finally {
        setIsChecking(false)
      }
    } else {
      setFormStatus('test')
      setFormError(null)
    }
  }

  if (isLoading) return <Spin fullscreen aria-label="로그인 상태 확인 중" />
  if (!preview && !error && user?.status === 'ACTIVE') return <Navigate to="/" replace />

  return (
    <div className="relative">
      <Card
        variant="borderless"
        className="shadow-none"
        classNames={{ body: 'px-lg py-10 min-[992px]:px-10' }}
      >
        <div className="flex flex-col gap-5">
          <img
            src={`${import.meta.env.BASE_URL}images/logo.svg`}
            alt="MODO WORK"
            width={120}
            height={30}
            className="h-auto w-[120px] max-w-full"
          />

          {showIntroduction && (
            <div className="flex flex-col gap-xxs">
              <h1 className="m-0 text-section-title leading-[30px]">
                교육 운영 업무관리 포털
              </h1>
              <p className="m-0 text-body leading-[21px] text-(--ant-color-text-secondary)">
                과정별 할 일과 마감을 한곳에서 확인해요.
              </p>
            </div>
          )}

          {!showIntroduction && <h1 className="sr-only">로그인</h1>}

          {showForm && status !== 'expired' && (
            <Tag color="gold" className="m-0 self-start">개발/시연용 로그인</Tag>
          )}

          {statusMessage && (
            <Alert
              type={statusMessage.type}
              title={statusMessage.title}
              description={preview ? statusMessage.description : error ?? formError ?? statusMessage.description}
              className="px-md py-sm"
              classNames={{
                title: 'mb-xxs text-body leading-[21px] font-medium',
                description: 'text-[13px] leading-[20px] text-(--ant-color-text-secondary)',
              }}
            />
          )}

          {showForm && (
            <TestLoginForm
              key={formKey}
              email={email}
              requireName={status === 'nameRequired'}
              showDemoAccounts={status === 'test'}
              isSubmitting={isSubmitting}
              onSubmit={submitTestLogin}
            />
          )}

          {status === 'pending' && (
            <>
              <div className="flex items-center gap-[10px] rounded-lg bg-(--ant-color-bg-layout) px-sm py-[10px]">
                <img
                  src={`${import.meta.env.BASE_URL}images/avatar-account.svg`}
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
                    로그인한 계정
                  </p>
                  <p className="m-0 break-all text-body leading-[21px]">
                    {accountEmail}
                  </p>
                </div>
              </div>

              <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
                승인되면 버튼을 눌러 바로 업무 화면으로 이동해요. 다시 로그인하지 않아도 돼요.
              </p>
              <Button type="primary" size="large" block loading={isChecking} disabled={isLoggingOut} onClick={checkApproval}>
                승인 상태 확인
              </Button>
              <Button size="large" block loading={isLoggingOut} disabled={isChecking} onClick={handleLogout}>로그아웃</Button>
            </>
          )}

          {(status === 'invalid' || status === 'inactive') && (
            <Button
              type={status === 'invalid' ? 'primary' : 'default'}
              size="large"
              block
              onClick={() => previewStatus(status === 'invalid' ? 'login' : 'test')}
            >
              다른 계정으로 로그인
            </Button>
          )}

          {status === 'error' && (
            <Button type="primary" size="large" block loading={isChecking} onClick={retry}>
              다시 시도
            </Button>
          )}

          {status === 'login' && (
            <>
              <Button
                type="primary"
                size="large"
                block
                disabled
                title="Google 로그인은 아직 연동되지 않았어요"
                className="font-medium"
              >
                Google 계정으로 로그인
              </Button>

              <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
                회사 계정만 사용할 수 있어요.
              </p>
            </>
          )}
        </div>
      </Card>

      {import.meta.env.DEV && (
        <aside
          aria-label="로그인 화면 상태 확인"
          className="mt-lg flex flex-wrap gap-xs min-[992px]:absolute min-[992px]:top-0 min-[992px]:left-full min-[992px]:mt-0 min-[992px]:ml-lg min-[992px]:flex-col min-[992px]:whitespace-nowrap"
        >
          {loginPreviewStates.map((item) => (
            <Button
              key={item.value}
              type={status === item.value ? 'primary' : 'default'}
              aria-pressed={status === item.value}
              disabled={isBusy}
              onClick={() => previewStatus(item.value)}
            >
              {item.label}
            </Button>
          ))}
          <Button disabled={isBusy} onClick={() => navigate('/', { replace: true })}>
            홈 화면
          </Button>
        </aside>
      )}
    </div>
  )
}
