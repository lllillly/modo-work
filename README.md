# MODO WORK 웹 프론트엔드

React + TypeScript + Vite + Ant Design + Tailwind CSS를 사용합니다. 패키지 매니저는 npm입니다.

## 실행

```bash
cd apps/web
npm ci
npm run dev
```

- 빌드: `npm run build` (TypeScript 검사 포함)
- 린트: `npm run lint`
- 백엔드 실행: [로컬 실행 안내](../../docs/development/backend-local.md)

API 요청은 세션 쿠키와 동일 출처 상대 경로 `/api`를 사용합니다. 로컬에서는 Vite가 `http://localhost:8080`으로 전달하고 Docker에서는 Nginx 프록시를 사용합니다.

## 화면과 연동 상태

| 화면 | 주소 | 현재 상태 |
| --- | --- | --- |
| 로그인 | `/login` | 시험 로그인, 내 정보 조회, 로그아웃 API 연결 |
| 담당자 홈 (S03) | `/` | 목업 |
| 리더 홈 (S04) | `/` | 리더와 관리자에게 표시, 목업 |
| 과정별 할 일과 상세 (S05, S06) | `/tasks` | 기본 경로는 목업 |
| S10에서 연결한 할 일과 상세 | `/tasks?courseId=실제ID&source=api` | 관리자용 실제 API 연결 |
| 과정 & 담당 배정 (S10) | `/admin/courses` | 실제 API 연결 |
| CSV 가져오기 | `/admin/courses/import` | 미리보기, 적용, 취소 API 연결 |

홈과 기존 할 일 화면의 목업은 새로고침하면 초기화됩니다. 실제 API 화면과 목업 상태는 공유하지 않습니다. `source=api`는 프론트 화면 구분용이며 서버에는 보내지 않습니다.

## 공통 구조

| 경로 | 역할 |
| --- | --- |
| `src/router.tsx`, `src/layouts/` | 화면 연결, 접근 검사, 공통 레이아웃 |
| `src/components/layout/` | 헤더와 사이드바 |
| `src/providers/AppProvider.tsx`, `src/styles/` | Ant Design 테마, 디자인 토큰, 폰트와 공통 스타일 |
| `src/providers/AuthProvider.tsx`, `AuthContext.ts` | 로그인 상태 관리 |
| `src/api/`, `src/types/` | API 요청과 데이터 타입 |
| `src/hooks/useApiQuery.ts` | 조회 상태, 요청 취소, 재조회 |
| `src/pages/auth/` | 로그인과 인증 상태별 화면 |
| `src/pages/home/` | 담당자와 리더 홈 |
| `src/pages/tasks/` | 과정별 할 일, 상세, 일정과 월 주기 |
| `src/pages/admin/courses/` | 과정 관리와 CSV 가져오기 |

Pretendard는 `public/fonts/`에서 불러옵니다. Ant Design reset과 겹치지 않도록 Tailwind Preflight는 제외했습니다.
992px 이상은 데스크탑, 그 미만은 모바일입니다. 본문과 사이드바는 각각 스크롤하며 모바일에서는 메뉴 버튼으로 사이드바를 엽니다. 모바일 스크롤바는 숨기되 스크롤은 유지합니다.

## 로그인

`AuthProvider`에서 사용자와 로그인 상태를 관리하고 `RequireAuth`에서 업무 화면 접근을 확인합니다. 로그인 화면은 인증 상태에 따라 입력 폼과 안내 화면을 표시합니다.

`src/api/auth.ts`는 시험 로그인, 내 정보 조회와 로그아웃 요청을 담당합니다. `async/await`로 응답을 기다린 뒤 상태를 변경하며 로그인은 `Promise<AuthUser>`, 로그아웃은 `Promise<void>`를 반환합니다. 세션 상태는 `/me`와 서버의 인증 오류 응답으로 확인합니다.

## 담당자 홈과 리더 홈

`HomePage.tsx`에서 사용자 역할에 따라 담당자 홈과 리더 홈을 표시합니다.

- `AssigneeHomePage.tsx`: 알림, 달력, 날짜별 할 일과 과정 진행률
- `LeaderHomePage.tsx`: 요약, 확인 범위, 알림, 처리 기록과 과정별 진행률
- `assigneeHomeData.ts`, `leaderHomeData.ts`: 보기 범위와 권한, 알림과 진행률 계산
- `assigneeHomeMockData.ts`, `leaderHomeMockData.ts`: 화면 확인용 데이터

두 홈은 `TaskList`를 재사용합니다. `T extends HomeTask`로 화면별 추가 필드의 타입을 유지하고 설명은 `renderDescription`으로 전달합니다. 리더 홈의 다음 마감과 기한 지난 건수는 목록을 한 번 순회해 계산합니다.

리더 범위는 `roles[].orgUnit`과 `roles[].area`를 사용합니다. 마감 배지는 한국 날짜로 계산합니다. 홈 목업의 임박 범위는 D-day~D-2이며 API 연결 후 서버의 `dueSoonBusinessDays` 기준으로 변경할 예정입니다.

## 과정별 할 일과 상세

`TasksPage.tsx`에서 과정 선택과 태그 필터를 관리합니다. `source=api` 경로는 `ApiCourseTasks.tsx`에서 서버 데이터를 조회하고 `courseTasksApiData.ts`에서 기존 컴포넌트에 맞게 변환합니다.

| 컴포넌트 | 역할 |
| --- | --- |
| `TaskPhaseList.tsx` | 단계별 목록, 진행률과 완료 목록 접기 |
| `TaskDetailDrawer.tsx` | 상세 정보, 처리 버튼과 기록, 메모 입력 |
| `MonthlyWork.tsx` | 월 주기와 상시 업무 |
| `CourseSchedule.tsx` | 일정 표시와 수정, 변경 이력 연결 |

`courseTasksData.ts`에서 역할별 처리 권한과 목업 계산을 관리합니다. 실제 처리 요청에는 서버의 `version`과 요청별 `requestId`를 사용합니다. 실제 마감과 월 주기는 서버에 저장된 값을 표시합니다.

## 과정 & 담당 배정

`CoursesPage.tsx`에서 관리자 접근과 하위 화면을 연결합니다. 목록은 서버 페이지 단위로 조회하고 입력 폼의 배정 데이터는 `courseManagementData.ts`에서 화면용 구조로 변환합니다.

| 파일 | 역할 |
| --- | --- |
| `CourseList.tsx`, `CourseLabels.tsx` | 과정 목록과 상태 표시 |
| `CourseEditor.tsx` | 과정 등록과 수정 |
| `AssigneeFields.tsx`, `AssigneeSearch.tsx` | 공동 담당 배정과 이름, 이메일 검색 |
| `CourseCorrectionModal.tsx` | 종료일 정정과 담당 배정 변경 |
| `CourseHistoryModal.tsx` | 일정 변경 이력 조회 |
| `CourseImport.tsx` | CSV 파일 선택과 업로드 |
| `CourseImportPreview.tsx` | 미리보기, 경고 확인, 적용과 취소 |

`courseManagementApi.ts`는 변경된 정보, 담당 배정, 일정 순서로 저장합니다. 직전 응답의 `version`을 다음 요청에 전달하고 일부 요청만 성공하면 완료된 항목을 함께 안내합니다.

CSV 파일은 `FormData`로 전송합니다. 서버에서 검사한 행별 변경 내용과 오류, 경고를 표시하며 확인한 경고 키를 적용 요청에 전달합니다. 작업 조회에는 URL의 `jobId`를 사용합니다.

### 미연동 항목 (추후 연동 예정)

구현과 연동이 끝난 항목은 표에서 삭제합니다.

| 항목 | 현재 상태 |
| --- | --- |
| 과정명과 외부 키 검색, 조직 필터 | 비활성, 백엔드 API 추가 후 연결 |
| 진행 상태와 배정 상태 필터 | 비활성, 백엔드 후속 구현 예정 |
| 삭제, 보관, 복원과 보관 목록 | 비활성, 백엔드 구현 후 연결 |
| 정보 수정과 담당 배정 변경 이력, 마지막 수정자와 시각 | 통합 변경 이력 API 추가 후 연결 |
| 조직명과 영역명, 현재 담당자 이메일 | 비활성 담당자를 포함한 과정 응답 보완 후 연결 |
| CSV 양식 다운로드 | 백엔드에서 `courses_template.csv` 전달 후 프론트 정적 파일로 연결 |

일반 담당 배정 변경 이력은 사유 없이 변경 전후 값과 수정자, 시각을 표시할 예정입니다. 사유는 종료 과정의 관리자 예외 교체 이력에서 표시합니다.

## 상태별 화면 확인

아래 `preview`는 목업과 목록 디자인 확인용입니다. 실제 저장 오류와 CSV 결과는 서버 응답을 사용합니다.

| 화면 | 파라미터 |
| --- | --- |
| 담당자 홈 `/` | `?preview=empty`, `no-alerts`, `loading`, `error` |
| 리더 홈 `/` | `?preview=empty`, `no-reviews`, `closed-org`, `loading`, `error` |
| 목업 할 일 `/tasks` | `?preview=ended`, `empty`, `loading`, `error` |
| 과정 관리 목록 `/admin/courses` | `?preview=empty`, `loading`, `error` |

각 값은 `?preview=loading`처럼 사용합니다. 이미 `courseId`가 붙은 주소에는 `&preview=loading`처럼 이어 붙입니다. 할 일 상세는 `taskId`로 지정할 수 있습니다.
