# 폴더 구조와 공통 규칙

## 폴더

| 경로 | 역할 |
| --- | --- |
| `src/router.tsx`, `src/layouts/` | 화면 연결, 로그인 확인, 공통 레이아웃 |
| `src/components/layout/` | 헤더, 사이드바, 화면 제목(`PageHeader`) |
| `src/components/common/` | 여러 화면이 같이 쓰는 컴포넌트 |
| `src/providers/` | Ant Design 테마와 로그인 상태 |
| `src/api/`, `src/types/` | API 요청과 데이터 타입 |
| `src/hooks/` | 조회, 오류 처리, 화면 폭 확인 |
| `src/utils/` | 날짜, 역할 확인 |
| `src/styles/` | 디자인 토큰, 글꼴, 공통 스타일 |
| `src/pages/` | 화면. 폴더 이름이 주소와 대응합니다 (`auth`, `home`, `tasks`, `ask`, `documents`, `admin/*`) |

## 공용 컴포넌트와 함수

상태 화면은 모두 `NoticeCard`를 바탕으로 한 같은 모양입니다.

| 이름 | 쓰는 곳 |
| --- | --- |
| `LoadingError` | 불러오기 실패와 다시 시도 |
| `NoPermission` | 권한 없음 |
| `PageNotFound` | 없는 주소 |
| `EmptyData` | 아직 데이터가 없을 때 |
| `NoSearchResult` | 검색 결과 없음 |
| `ContentCard` | 본문 카드(여백 포함) |
| `smallTableStyle` (`tableStyle.ts`) | 작은 표 모양 |
| `SearchInput`, `FilterChip`, `IconAction`, `HintTooltip` | 검색창, 필터 칩, 아이콘 버튼, 안내 툴팁 |

| 이름 | 하는 일 |
| --- | --- |
| `useApiQuery` | 조회 상태, 요청 취소, 다시 불러오기 |
| `useApiErrorHandler` | 오류 문구 표시(`showError`)와 로그인 상태 재확인(`checkLogin`) |
| `useMediaQuery` | 화면 폭 조건 확인 |
| `isConflict`, `isAuthStateError` (`api/client.ts`) | 409 충돌, 로그인 상태 오류 확인 |
| `PAGE_SIZE` (`api/pagination.ts`) | 목록 한 쪽 개수 |
| `isAdmin` (`utils/roles.ts`) | 관리자 확인 |
| `utils/date.ts` | 날짜 계산과 표시 형식(서울 시간 기준) |

## 스타일과 화면 규칙

- 글꼴은 Pretendard이고 `public/fonts/`에서 불러옵니다.
- Ant Design reset과 겹치지 않게 Tailwind Preflight는 껐습니다.
- 992px 이상은 데스크탑, 그 미만은 모바일입니다.
- 본문과 사이드바는 따로 스크롤합니다. 모바일에서는 메뉴 버튼으로 사이드바를 엽니다.
- 데스크탑 사이드바는 접을 수 있고, 접은 상태는 브라우저에 저장합니다.
- 화면 제목은 헤더에 표시합니다.
- 아이콘은 Ant Design 아이콘을 쓰고, 없는 것만 `lucide-react`에서 가져옵니다.
- Tailwind의 `max-w-md`는 이 프로젝트에서 16px입니다. 폭이 필요하면 `max-w-[400px]`처럼 씁니다.
