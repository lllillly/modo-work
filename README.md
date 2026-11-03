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
- `src/components/common/ThemeToggle.tsx`: 헤더 다크 모드 전환 버튼
- `src/pages/`: 홈, 로그인, 과정별 할 일 화면
- `src/pages/home/AssigneeHomePage.tsx`: S03 담당자 홈

홈은 `/`, 로그인은 `/login`, 과정별 할 일은 `/tasks`에서 확인 부탁드립니다.

## 로그인 상태 관련 화면

현재 인증 API가 없어서 임시 데이터로 넣었습니다. 아직 만들지 않은 메뉴는 비활성화했습니다.
로그인 화면에서 옆의 버튼으로 승인 대기, 회사 계정 X, 사용 중지 상태별로 화면 확인할 수 있게 버튼을 임시로 넣었습니다.

- `로그인`: 홈으로 이동
- `로그아웃`, `다른 계정으로 로그인`: 로그인 화면으로 돌아가기

## 담당자 홈

선택한 사업의 과정과 할 일을 보여주는 화면입니다. 사업 1은 샘플 데이터가 있고, 사업 2는 배정된 과정이 없는 화면 버전으로 작성하였습니다.

- 내 알림은 기한 지남, D-day, 임박 순으로 표시하며 알림이 없으면 카드를 숨깁니다.
- 달력에서 날짜를 선택하면 해당 날짜의 할 일이 표시됩니다.
- 내 영역의 미완료 할 일은 행을 눌러 완료할 수 있습니다. 완료하면 처리자와 상태가 표시되고 진행률에도 반영됩니다. 담당자 화면에서 완료 취소는 불가능하게 하였습니다.
- 전체 보기에서는 다른 영역의 할 일도 보여주며 체크박스 없이 보기만 가능합니다. 과정 진행률과 달력의 점도 보기 범위에 맞춰 표시합니다.
- 내 과정은 과정 필터, 마감순과 과정명순 정렬을 지원합니다. 모바일은 과정 필터를 숨기고 처음 3개 과정과 더 보기 버튼을 표시합니다.

화면 상태는 아래 주소에서도 확인할 수 있습니다.

| 주소 | 확인할 화면 |
| --- | --- |
| `/` | 기본 화면 |
| `/?preview=empty` | 배정된 과정 없음 |
| `/?preview=no-alerts` | 알림 0건 |
| `/?preview=loading` | 불러오는 중 |
| `/?preview=error` | 불러오기 실패 |

확인용 화면들이라 추후 삭제 예정입니다.

홈 관련 파일은 `src/pages/home/`에 두었습니다.

- `AssigneeHomePage.tsx`: 화면 구성, 보기 범위와 완료 상태
- `assigneeHomeData.ts`: 사업과 보기 범위(내 영역 or 전체)에 따른 목록, 진행률과 홈 알림 건수 계산
- `assigneeHomeMockData.ts`: 임시 사용자, 사업, 과정과 할 일 데이터
- `dateUtils.ts`: 달력과 날짜 표시 형식 변환
- `components/`: 달력, 할 일과 과정 목록, 상태 배지, 로딩과 오류 화면

## 임시 데이터

사용자, 사업 목록, 알림 건수, 예시 이메일, 담당자 홈의 과정과 할 일은 `src/pages/home/assigneeHomeMockData.ts`에 모았습니다.
진행률은 샘플 할 일 기준이며 선택한 사업과 완료 상태는 새로고침하면 초기화됩니다.

`assigneeHomeData.ts`는 목업 파일을 직접 불러오지 않고 전달받은 데이터로 계산하는 로직입니다.API 연동 후 수정예정입니다.

## 반응형 작업

992px 이상은 데스크탑, 그 미만은 모바일로 구성했습니다. 전체 레이아웃은 화면 높이에 맞추고 본문과 사이드바를 각각 스크롤하도록 하였습니다.

모바일에서는 사이드바 대신 메뉴 버튼으로 Drawer를 열도록 하였습니다. 홈 달력은 주간 날짜 띠로 표시하고 월 전체 보기 버튼으로 펼칠 수 있습니다.

본문 여백은 데스크탑 24px, 모바일 16px입니다. 로그인 카드는 좌우 여백 16px을 두고 화면 너비에 맞게 늘어나며 최대 width는 400px로 고정했습니다.
