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

## 로그인 연동

`/login`은 시험 로그인 화면으로 시작합니다. 이메일, 시험 비밀번호, 이름을 입력하며 이름은 처음 로그인할 때만 필요합니다.
백엔드 실행은 [백엔드 로컬 실행 안내](../../docs/development/backend-local.md)를 참고해 주세요.
`apps/web/.env.local`에 아래 주소를 설정한 뒤 프론트 개발 서버를 실행합니다. 프론트와 백엔드의 호스트는 `localhost`로 통일합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

- `로그인`: 시험 로그인 API를 호출하고 ACTIVE는 홈으로 이동하며 PENDING은 승인 대기 화면 표시
- 새로고침: `/me`로 로그인 상태 확인. 로그인 전이나 승인 대기 상태에서는 업무 화면 접근 제한
- `승인 상태 확인`: `/me`를 다시 호출하며 승인 후 홈으로 이동. 자동 새로고침은 사용하지 않음
- `로그아웃`: 승인 대기 화면과 헤더 모두 서버에 로그아웃 요청 후 로그인 화면으로 이동
- `담당자`, `리더`, `관리자`: 백엔드 시드 문서 기준의 시연 계정 이메일만 채우며 비밀번호는 직접 입력
- 입력 오류는 해당 입력란 아래 표시하며 비밀번호 오류와 사용 중지, 일시 오류는 각각 안내
- 헤더의 이름과 역할, 홈 인사말은 로그인한 사용자 정보 사용

세션 만료는 서버의 UNAUTHENTICATED 응답으로 판단하도록 하였습니다.
업무 화면 이동과 창으로 돌아왔을 때도 로그인 상태를 확인합니다. 네트워크 오류나 서버 오류는 세션 만료로 처리하지 않습니다.
API 요청은 응답 대기 시간이 30초를 넘으면 중단하며 다시 시도할 수 있습니다.

로그인과 로그아웃은 `async/await`로 서버 응답을 기다린 뒤 상태를 변경합니다. 로그인은 `Promise<AuthUser>`로 사용자 정보를 받고 로그아웃은 `Promise<void>`로 요청 완료를 기다립니다. 처리 중에는 버튼을 잠가 중복 요청을 막고 실패하면 오류를 안내합니다.

로그인 상태를 바꾸는 확인용 버튼은 제거했습니다. 이름 누락, 승인 대기, 사용 중지, 일시 오류와 세션 만료 안내는 실제 API 응답에 따라 표시합니다.
Google 로그인 화면과 시험 로그인 화면 사이의 전환 버튼은 유지했습니다. 현재는 시험 로그인만 API에 연결되어 있으며 Google 계정으로 로그인 버튼은 눌러도 이동하거나 API를 호출하지 않습니다.

로그인 관련 파일은 `src/pages/auth/`에 두었습니다.

- `src/api/auth.ts`: 시험 로그인, 현재 사용자 조회, 로그아웃 요청과 오류 처리
- `src/types/auth.ts`: 인증 요청, 사용자와 오류 응답 타입
- `src/providers/AuthProvider.tsx`, `AuthContext.ts`: 공통 로그인 상태
- `src/layouts/RequireAuth.tsx`: 업무 화면 접근 검사
- `LoginPage.tsx`: 로그인 상태별 화면과 API 연결
- `components/TestLoginForm.tsx`: 시험 로그인 입력과 검증
- `demoAccounts.ts`: 시연 계정 이메일

## 담당자 홈

선택한 사업의 과정과 할 일을 보여주는 화면입니다. 사업 1은 샘플 데이터가 있고, 사업 2는 배정된 과정이 없는 화면 버전으로 작성하였습니다.

- 내 알림은 기한 지남, D-day, 임박 순으로 표시하며 알림이 없으면 카드를 숨깁니다.
- 달력에서 날짜를 선택하면 해당 날짜의 할 일이 표시됩니다.
- 내 영역의 미완료 할 일은 체크박스를 눌러 완료할 수 있습니다. 제목이나 설명을 눌러도 완료되지 않습니다. 완료하면 처리자와 초록색 완료 배지가 표시되고 진행률에도 반영됩니다. 담당자 화면에서 완료 취소는 불가능하게 하였습니다.
- 마감 배지와 알림 분류는 마감일과 한국 오늘 날짜로 계산합니다. 현재 목업에서는 달력일 기준 D-day부터 D-2까지는 임박, D-3부터 D-7까지는 배경색으로 표시합니다. API 연동 시 임박 분류는 서버의 `dueSoonBusinessDays`와 영업일 기준에 맞춰 변경할 예정입니다. D-day, D-3 등 배지 문구는 달력일 기준으로 유지합니다.
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

## 리더 홈

리더와 관리자 계정은 `/`에서 S04 홈이 표시됩니다. 관리자는 선택한 사업의 전체 범위, 담당자는 기존 담당자 홈을 표시합니다.
`lead01`은 조직 리더라 자기 조직의 과정만 보이며 영역 리더 역할도 있으면 해당 영역의 다른 조직 과정을 함께 표시합니다.

- 영역 리더는 자기 조직의 다른 영역을 보기만 가능. 조회 가능한 진행률은 표시하며 확인 버튼과 일괄 확인 대상에서는 제외
- 폐쇄 조직은 모든 리더와 관리자가 조회 및 확인 가능
- 리더 알림은 기한 지남 -> D-day -> 임박 순으로 표시
- 처리 기록은 최근 완료순. 확인해도 순서는 유지하며 확인 대기가 0건이면 일괄 확인 버튼 숨김
- 과정별 진행률과 다음 마감 표시. 범위 밖 영역은 진행률 대신 범위 밖으로 표시
- 모바일에서는 알림, 기록과 과정 목록을 더 보기로 펼침

리더 홈 데이터와 확인 처리는 목업이며 새로고침하면 초기화됩니다. 과정 선택은 `/tasks?courseId=...`로 이동하며 S05 화면 구현은 진행예정입니다.
`/?preview=empty`, `/?preview=loading`, `/?preview=error`, `/?preview=no-reviews`에서 상태별 화면을 확인할 수 있습니다.
`/?preview=closed-org`에서는 조직 단위 2를 폐쇄 상태로 표시해 리더의 조회와 확인을 확인할 수 있습니다.

- `HomePage.tsx`: 계정 역할에 따라 담당자 홈과 리더 홈 분기
- `LeaderHomePage.tsx`: 리더 홈 화면과 확인 처리
- `leaderHomeMockData.ts`: 과정, 영역별 진행률과 할 일 샘플
- `leaderHomeData.ts`: 확인 범위, 알림과 요약 계산
- `components/LeaderReviewList.tsx`, `LeaderCourseList.tsx`: 처리 기록과 과정별 진행

할 일 목록은 담당자 홈과 리더 홈 모두 `TaskList`를 사용합니다. `T extends HomeTask`로 공통 필드를 유지하면서 전달받은 할 일 타입을 그대로 사용합니다. 리더 홈에서 추가로 필요한 조직, 담당자 목록과 조회 권한도 별도의 타입 변환 없이 설명에 표시할 수 있습니다. 설명 부분은 `renderDescription`으로 전달하며 담당자 홈은 기존 설명을 그대로 사용합니다.

`leaderHomeData.ts`는 조회 가능한 할 일을 과정별로 모아 계산합니다. 다음 마감은 목록 전체를 정렬하지 않고 한 번 순회하며 찾고 같은 순회에서 기한이 지난 할 일 수도 계산합니다.

## 임시 데이터

사업 목록, 알림 건수, 담당자 홈의 과정과 할 일은 `src/pages/home/assigneeHomeMockData.ts`에 모았습니다.
진행률은 샘플 할 일 기준이며 선택한 사업과 완료 상태는 새로고침하면 초기화됩니다.

`assigneeHomeData.ts`는 목업 파일을 직접 불러오지 않고 전달받은 데이터로 계산하는 로직입니다.API 연동 후 수정예정입니다.

## 반응형 작업

992px 이상은 데스크탑, 그 미만은 모바일로 구성했습니다. 전체 레이아웃은 화면 높이에 맞추고 본문과 사이드바를 각각 스크롤하도록 하였습니다.

모바일에서는 사이드바 대신 메뉴 버튼으로 Drawer를 열도록 하였습니다. 홈 달력은 주간 날짜 띠로 표시하고 월 전체 보기 버튼으로 펼칠 수 있습니다.

본문 여백은 데스크탑 24px, 모바일 16px입니다. 로그인 카드는 좌우 여백 16px을 두고 화면 너비에 맞게 늘어나며 최대 width는 400px로 고정했습니다.
