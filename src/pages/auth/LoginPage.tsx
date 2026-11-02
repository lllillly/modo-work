import { Button } from 'antd'
import { useNavigate } from 'react-router'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-lg">
      <h1 className="m-0 text-center text-section-title">로그인</h1>
      <Button type="primary" block onClick={() => navigate('/', { replace: true })}>
        로그인
      </Button>
    </div>
  )
}
