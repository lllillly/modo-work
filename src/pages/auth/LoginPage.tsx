import { Button, Card } from 'antd'
import { useNavigate } from 'react-router'

export default function LoginPage() {
  const navigate = useNavigate()

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

        <div className="flex flex-col gap-xxs">
          <h1 className="m-0 text-section-title leading-[30px]">
            교육 운영 업무관리 포털
          </h1>
          <p className="m-0 text-body leading-[21px] text-(--ant-color-text-secondary)">
            과정별 할 일과 마감을 한곳에서 확인해요.
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={() => navigate('/', { replace: true })}
          className="font-medium"
        >
          Google 계정으로 로그인
        </Button>

        <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
          회사 계정만 사용할 수 있어요.
        </p>
      </div>
    </Card>
  )
}
