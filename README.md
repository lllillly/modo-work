# MODO WORK 웹 프론트엔드

React + TypeScript + Vite + Ant Design + Tailwind CSS

패키지 매니저는 npm을 사용합니다.

## 실행

```bash
cd apps/web
npm ci
npm run dev
```

빌드: `npm run build` / 린트: `npm run lint`

## 공통 설정

- `src/providers/AppProvider.tsx`: Ant Design 테마 설정
- `src/styles/theme.ts`: 폰트, 라이트-다크 테마
- `src/styles/tokens.css`: 색상, 간격, 모서리, 글자 토큰
- `src/styles/index.css`: Tailwind와 reset 연결
- `src/styles/fonts.css`: 로컬 폰트 선언
- `public/fonts/`: Pretendard 폰트와 라이선스
- `public/images/logo.svg`: 임시 로고
- `public/favicon.png`: 임시 파비콘

초기화 스타일은 Ant Design reset을 사용하며 충돌 가능성이 있어서 Tailwind Preflight는 제외했습니다.

## 구조

- `src/router.tsx`: 화면 라우터(링크) 연결
- `src/layouts/AppLayout.tsx`: 헤더, 사이드바, 콘텐츠 영역
- `src/layouts/AuthLayout.tsx`: 로그인 화면 레이아웃
- `src/components/layout/`: 헤더, 사이드바
- `src/components/common/ThemeToggle.tsx`: 임시 다크 모드 전환 버튼(사용자 메뉴 UI가 확정되면 수정 예정입니다)
- `src/pages/`: 홈, 로그인, 과정별 할 일 화면

홈은 `/`, 로그인은 `/login`, 과정별 할 일은 `/tasks`에서 확인 부탁드립니다

## 로그인 상태 관련 화면

현재 인증 API가 없어서 임시 데이터로 넣었습니다. 아직 만들지 않은 메뉴는 비활성화했습니다.
로그인 화면에서 옆의 버튼으로 승인 대기, 회사 계정 X, 사용 중지 상태별로 화면 확인할 수 있게 버튼을 임시로 넣었습니다.

- `로그인`: 홈으로 이동
- `로그아웃`, `다른 계정으로 로그인`: 로그인 화면으로 돌아가기

## 반응형 작업
모바일에서는 사이드바 대신 메뉴 버튼으로 Drawer하도록 하였습니다. 로그인 카드는 모바일 크기에서 좌우 여백 16px을 두고 화면 너비에 맞게 늘어나게 하였고 최대 width는 400px로 고정했습니다.