import { useState } from 'react'
import { Alert, App, Button, Card, Spin, Tag } from 'antd'
import { Navigate } from 'react-router'

import TestLoginForm from './components/TestLoginForm'

import { AuthApiError } from '../../api/auth'
import { useAuth } from '../../providers/AuthContext'
import type { AuthErrorResponse, TestLoginRequest } from '../../types/auth'

type LoginStatus = 'test' | 'pending' | 'inactive' | 'credentialsError' | 'error' | 'expired'

const statusMessages = {
  pending: {
    type: 'info',
    title: '승인을 기다리고 있어요',
    description: '리더나 관리자가 역할을 지정하면 업무 화면을 이용할 수 있어요.',
  },
  inactive: {
    type: 'error',
    title: '사용이 중지된 계정이에요',
    description: '다시 사용하려면 관리자에게 문의해 주세요.',
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
    description: '오랫동안 사용하지 않으면 자동으로 로그아웃돼요. 다시 로그인해 주세요.',
  },
} as const

export default function LoginPage() {
  const { message } = App.useApp()
  const { user, isLoading, error, notice, login, logout, refreshUser, clearNotice } = useAuth()

  const [formStatus, setFormStatus] = useState<LoginStatus>('test')
  const [formError, setFormError] = useState<string | null>(null)
  const [loginMode, setLoginMode] = useState<'test' | 'google'>('test')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  let status = formStatus
  if (notice === 'expired' && formStatus === 'test') status = 'expired'
  if (user?.status === 'PENDING') status = 'pending'
  if (notice === 'inactive') status = 'inactive'
  if (error) status = 'error'

  const showLogin = status === 'test' || status === 'credentialsError' || status === 'expired'
  const showForm = showLogin && loginMode === 'test'
  const showGoogleLogin = showLogin && loginMode === 'google'
  const showIntroduction = showGoogleLogin || status === 'pending' || status === 'inactive'
  const statusMessage = status === 'test' ? null : statusMessages[status]
  const isBusy = isSubmitting || isChecking || isLoggingOut

  function resetLogin() {
    setFormStatus('test')
    setFormError(null)
    setLoginMode('test')
    clearNotice()
  }

  function changeLoginMode(mode: 'test' | 'google') {
    if (isBusy) return

    setLoginMode(mode)
    setFormStatus('test')
    setFormError(null)
  }

  async function submitTestLogin(values: TestLoginRequest): Promise<AuthErrorResponse['fieldErrors'] | undefined> {
    if (isSubmitting) return

    setIsSubmitting(true)
    resetLogin()

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
    if (isBusy) return

    setIsLoggingOut(true)
    try {
      await logout()
      resetLogin()
    } catch {
      message.error('로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  async function retry() {
    if (error) {
      setIsChecking(true)
      try {
        await refreshUser()
      } finally {
        setIsChecking(false)
      }
    } else {
      resetLogin()
    }
  }

  if (isLoading) return <Spin fullscreen aria-label="로그인 상태 확인 중" />
  if (!error && user?.status === 'ACTIVE') return <Navigate to="/" replace />

  return (
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
            description={error ?? formError ?? statusMessage.description}
            className="px-md py-sm"
            classNames={{
              title: 'mb-xxs text-body leading-[21px] font-medium',
              description: 'text-[13px] leading-[20px] text-(--ant-color-text-secondary)',
            }}
          />
        )}

        {showForm && (
          <>
            <TestLoginForm
              showDemoAccounts={status === 'test'}
              isSubmitting={isSubmitting}
              onSubmit={submitTestLogin}
            />
            <Button block disabled={isBusy} onClick={() => changeLoginMode('google')}>
              Google 로그인 화면으로
            </Button>
          </>
        )}

        {showGoogleLogin && (
          <>
            <Button
              type="primary"
              size="large"
              block
              title="Google 로그인은 아직 연동되지 않았어요"
              className="font-medium"
            >
              Google 계정으로 로그인
            </Button>
            <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
              회사 계정만 사용할 수 있어요.
            </p>
            <Button block onClick={() => changeLoginMode('test')}>
              시험 로그인 화면으로
            </Button>
          </>
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
                  {user?.email}
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

        {status === 'inactive' && (
          <Button
            size="large"
            block
            onClick={resetLogin}
          >
            다른 계정으로 로그인
          </Button>
        )}

        {status === 'error' && (
          <Button type="primary" size="large" block loading={isChecking} onClick={retry}>
            다시 시도
          </Button>
        )}
      </div>
    </Card>
  )
}
