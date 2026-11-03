import { useState } from 'react'
import { Alert, Button, Card } from 'antd'
import { useNavigate } from 'react-router'

import { currentUser, invalidEmail } from '../home/assigneeHomeMockData'

type LoginStatus = 'login' | 'pending' | 'invalid' | 'inactive'

const statusMessages = {
  pending: {
    type: 'info',
    title: '승인을 기다리고 있어요',
    description: '리더나 관리자가 역할을 지정하면 업무 화면을 이용할 수 있어요.',
  },
  invalid: {
    type: 'warning',
    title: '회사 계정으로 로그인해 주세요',
    description: `${invalidEmail} 계정은 사용할 수 없어요. 회사 Google 계정으로 다시 로그인해 주세요.`,
  },
  inactive: {
    type: 'error',
    title: '사용이 중지된 계정이에요',
    description: '다시 사용하려면 관리자에게 문의해 주세요.',
  },
} as const

const previewStates = [
  { value: 'pending', label: '승인 대기' },
  { value: 'invalid', label: '회사 계정 X' },
  { value: 'inactive', label: '사용 중지' },
] as const

export default function LoginPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<LoginStatus>('login')
  const statusMessage = status === 'login' ? null : statusMessages[status]

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

          <div className="flex flex-col gap-xxs">
            <h1 className="m-0 text-section-title leading-[30px]">
              교육 운영 업무관리 포털
            </h1>
            <p className="m-0 text-body leading-[21px] text-(--ant-color-text-secondary)">
              과정별 할 일과 마감을 한곳에서 확인해요.
            </p>
          </div>

          {statusMessage ? (
            <>
              <Alert
                type={statusMessage.type}
                title={statusMessage.title}
                description={statusMessage.description}
                className="px-md py-sm"
                classNames={{
                  title: 'mb-xxs text-body leading-[21px] font-medium',
                  description: 'text-[13px] leading-[20px] text-(--ant-color-text-secondary)',
                }}
              />

              {status === 'pending' && (
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
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              )}

              <Button
                type={status === 'invalid' ? 'primary' : 'default'}
                size="large"
                block
                onClick={() => setStatus('login')}
              >
                {status === 'pending' ? '로그아웃' : '다른 계정으로 로그인'}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => setStatus('pending')}
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

      {status !== 'login' && (
        <aside
          className="mt-lg flex flex-wrap gap-xs min-[992px]:absolute min-[992px]:top-0 min-[992px]:left-full min-[992px]:mt-0 min-[992px]:ml-lg min-[992px]:flex-col min-[992px]:whitespace-nowrap"
        >
          {previewStates.map((item) => (
            <Button
              key={item.value}
              type={status === item.value ? 'primary' : 'default'}
              aria-pressed={status === item.value}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </Button>
          ))}
          <Button onClick={() => navigate('/', { replace: true })}>
            로그인
          </Button>
        </aside>
      )}
    </div>
  )
}
