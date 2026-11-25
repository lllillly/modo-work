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

하위 경로에 배포할 때는 빌드나 실행 전에 `BASE_PATH`를 지정합니다. 값이 없으면 `/`입니다.

```bash
BASE_PATH=/portal npm run build
```

화면 주소, 정적 파일, API 요청(`/portal/api`)과 문서 PDF 주소가 모두 이 경로 아래로 바뀝니다. 로컬에서 `BASE_PATH=/portal npm run dev`로 실행하면 Vite가 `/portal/api`를 백엔드의 `/api`로 전달합니다.

## 화면과 연동 상태

| 화면 | 주소 | 현재 상태 |
| --- | --- | --- |
| 로그인 | `/login` | 시험 로그인, 내 정보 조회, 로그아웃 API 연결 |
| 담당자 홈 (S03) | `/` | 알림, 달력, 날짜별 할 일 완료, 과정 진행률 API 연결 |
| 리더 홈 (S04) | `/` | 리더와 관리자에게 표시. 요약, 알림, 처리 기록과 확인, 과정별 진행률 API 연결 |
| 과정별 할 일과 상세 (S05, S06) | `/tasks` | API 연결 |
| 목업 할 일 화면 | `/tasks?source=mock` | 디자인 확인과 시연 영상 촬영용. 배포 전에 삭제 |
| 과정 & 담당 배정 (S10) | `/admin/courses` | 실제 API 연결. 삭제, 보관 목록, 복원 포함 |
| CSV 가져오기 | `/admin/courses/import` | 미리보기, 적용, 취소 API 연결 |
| 물어보기 (S16) | `/ask` | 질문 보내기, 되묻기 후보 선택, 근거 표시 API 연결 |
| 문서 (S08) | `/documents` | 문서 목록, 종류 필터, 제목 검색, 앱 안 PDF 보기, 버전 기록과 지난 판 열람 API 연결. 본문 검색과 연결된 할 일은 API가 없어 비활성 |
| 문서 업로드 (S13) | `/admin/documents` | 목록, PDF와 외부 링크 등록, 파일 교체, 버전 복원, 삭제 확인, 읽기 다시 시도 API 연결. 템플릿 연결은 비활성 |
| 사용자와 승인 (S11) | `/admin/users` | 승인 대기와 전체 사용자 목록, 가입 승인, 역할 수정, 활성 상태 변경, 목록 관리 API 연결. 조직 단위 리더는 소속 조직으로 승인과 역할 추가 |
| 할 일 템플릿 (S12) | `/admin/task-templates` | 템플릿 목록, 추가, 수정, 사용 켜고 끄기, 태그 관리, 연결 문서 선택 API 연결 |
| 휴무일 설정 (S15) | `/admin/settings` | 공휴일과 회사 휴무일 조회, 회사 휴무일 추가, 수정, 삭제 API 연결. 그 밖의 설정값은 화면 없이 서버 설정으로 변경 |
| 서비스 토큰 관리 | `/admin/service-tokens` | 토큰 발급(원문 한 번만 표시)과 발급 ID로 폐기 API 연결. 발급 목록 조회 API가 없어 이번 화면에서 발급한 토큰만 표시 |
| 설정 내보내기 & 가져오기 | `/admin/config` | 기준 목록, 할 일 템플릿, 설정값, 의도, Q&A 파일 내려받기와 미리보기, 적용 API 연결 |

`courseId`가 없으면 진행 중인 첫 과정을 엽니다. 관리자는 관리자 과정 API로, 리더와 담당자는 홈 API의 과정 목록으로 과정을 고릅니다. 일정 수정 권한이 없으면 일정 조회가 403이라 수정 버튼 없이 보여줍니다.

목업 화면은 새로고침하면 초기화되고 실제 API 화면과 상태를 공유하지 않습니다. `source=mock`은 프론트 화면 구분용이며 서버에는 보내지 않습니다.

목업은 빈 과정, 불러오는 중, 오류, 종료된 과정처럼 실제 데이터로 만들기 어려운 상태를 시연 영상 촬영에 활용하기 위해서 남겨 두었습니다. 시연 영상 촬영이 끝나면 배포 전에 목업 화면과 목업 데이터 파일(`*MockData.ts`)을 모두 지울 예정입니다.

## 공통 구조

| 경로 | 역할 |
| --- | --- |
| `src/router.tsx`, `src/layouts/` | 화면 연결, 접근 검사, 공통 레이아웃 |
| `src/components/layout/` | 헤더, 사이드바(데스크탑에서 접기), 화면 제목을 헤더에 표시하는 `PageHeader`, `PageTitle` |
| `src/providers/AppProvider.tsx`, `src/styles/` | Ant Design 테마, 디자인 토큰, 폰트와 공통 스타일 |
| `src/providers/AuthProvider.tsx`, `AuthContext.ts` | 로그인 상태 관리 |
| `src/api/`, `src/types/` | API 요청과 데이터 타입 |
| `src/hooks/useApiQuery.ts` | 조회 상태, 요청 취소, 재조회 |
| `src/hooks/useApiErrorHandler.ts` | 오류 문구 표시(`showError`)와 로그인 상태 재확인(`checkLogin`) |
| `src/hooks/useMediaQuery.ts` | 화면 폭 조건 확인 |
| `src/utils/date.ts` | 날짜 계산과 표시 형식(서울 시간 기준) |
| `src/utils/roles.ts` | 관리자 확인(`isAdmin`) |
| `src/api/client.ts`, `src/api/pagination.ts` | 오류 문구, 충돌 확인(`isConflict`), 한 쪽 개수(`PAGE_SIZE`) |
| `src/pages/auth/` | 로그인과 인증 상태별 화면 |
| `src/pages/home/` | 담당자와 리더 홈 |
| `src/pages/tasks/` | 과정별 할 일, 상세, 일정과 월 주기 |
| `src/pages/admin/courses/` | 과정 관리와 CSV 가져오기 |
| `src/pages/ask/` | 물어보기 |
| `src/pages/documents/`, `src/pages/admin/documents/` | 문서 보기와 문서 업로드 |
| `src/components/common/NoticeCard.tsx` | 상태 안내 카드의 기본 틀 |
| `LoadingError`, `NoPermission`, `PageNotFound`, `EmptyData`, `NoSearchResult` | 불러오기 실패와 다시 시도, 권한 없음, 없는 페이지, 아직 없음, 검색 결과 없음. 모든 화면이 같은 모양을 씁니다 |
| `ContentCard`, `tableStyle.ts`(`smallTableStyle`) | 본문 카드 여백, 작은 표 모양 |
| `src/components/common/` | 아이콘 버튼, 필터칩, 검색창, 안내 툴팁, 줄 전체 클릭, 사용 방법 창 |
| `src/pages/admin/users/` | 사용자와 승인 |
| `src/pages/admin/config/` | 설정 내보내기와 가져오기 |
| `src/pages/admin/settings/` | 휴무일 설정 |
| `src/pages/admin/service-tokens/` | 서비스 토큰 발급과 폐기 |

Pretendard는 `public/fonts/`에서 불러옵니다. Ant Design reset과 겹치지 않도록 Tailwind Preflight는 제외했습니다.
992px 이상은 데스크탑, 그 미만은 모바일입니다. 본문과 사이드바는 각각 스크롤하며 모바일에서는 메뉴 버튼으로 사이드바를 엽니다. 모바일 스크롤바는 숨기되 스크롤은 유지합니다.
데스크탑 사이드바는 접을 수 있고 접은 상태는 브라우저에 저장합니다. 화면 제목은 헤더에 표시합니다.
아이콘은 Ant Design 아이콘을 쓰고, 없는 것만 lucide-react에서 가져옵니다.

## 로그인

`AuthProvider`에서 사용자와 로그인 상태를 관리하고 `RequireAuth`에서 업무 화면 접근을 확인합니다. 로그인 화면은 인증 상태에 따라 입력 폼과 안내 화면을 표시합니다.

`src/api/auth.ts`는 시험 로그인, 내 정보 조회와 로그아웃 요청을 담당합니다. `async/await`로 응답을 기다린 뒤 상태를 변경하며 로그인은 `Promise<AuthUser>`, 로그아웃은 `Promise<void>`를 반환합니다. 세션 상태는 `/me`와 서버의 인증 오류 응답으로 확인합니다.

## 담당자 홈과 리더 홈

`HomePage.tsx`에서 사용자 역할에 따라 담당자 홈과 리더 홈을 표시합니다.

- `AssigneeHomePage.tsx`: 알림, 달력, 날짜별 할 일과 과정 진행률
- `LeaderHomePage.tsx`: 요약, 확인 범위, 알림, 처리 기록과 과정별 진행률
- `assigneeHomeData.ts`, `leaderHomeData.ts`: 홈 API 응답을 화면용 할 일과 과정으로 변환
- `assigneeHomeMockData.ts`, `leaderHomeMockData.ts`: 목업 할 일 화면이 쓰는 데이터

두 홈은 `TaskList`를 재사용합니다. `T extends HomeTask`로 화면별 추가 필드의 타입을 유지하고 설명은 `renderDescription`으로 전달합니다. 건수와 진행률, 다음 할 일은 서버 집계를 그대로 사용합니다.

담당자 홈의 날짜별 할 일은 할 일 API에 선택한 날짜를 마감 범위로 넘겨 조회하고, 달을 넘기면 그 달의 달력 집계를 다시 받습니다. 내 영역과 전체 보기 전환은 담당 영역에 다른 영역 열람이 허용된 경우에만 보입니다. 다시 불러오는 동안에는 이전 화면을 유지합니다.

리더 홈의 확인은 한 건은 확인 API, 모두 확인은 일괄 확인 API를 사용합니다. 확인 버튼은 서버의 `canReview`로 표시하고 확인 범위 밖 업무는 보기만 가능으로 표시합니다. 리더 범위 표시는 `roles[].orgUnit`과 `roles[].area`를 사용합니다. 마감 배지는 한국 날짜로 계산하고 임박은 서버 알림에 포함된 업무만 표시합니다.

## 과정별 할 일과 상세

`TasksPage.tsx`에서 과정 선택과 태그 필터를 관리합니다. 기본 경로는 `ApiCourseTasks.tsx`에서 서버 데이터를 조회하고 `courseTasksApiData.ts`에서 기존 컴포넌트에 맞게 변환합니다.

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
| `CourseList.tsx`, `CourseLabels.tsx` | 과정 목록, 검색과 필터, 상태 표시, 삭제. 행을 누르면 과정 보기로 이동 |
| `ArchivedCourses.tsx` | 보관 목록과 복원 |
| `CourseEditor.tsx` | 과정 등록, 보기, 수정. 보기 화면에서 수정 버튼을 누르면 같은 화면에서 수정 |
| `AssigneeFields.tsx`, `AssigneeSearch.tsx` | 공동 담당 배정과 이름, 이메일 검색 |
| `CourseCorrectionModal.tsx` | 종료일 정정과 담당 배정 변경 |
| `CourseHistoryModal.tsx` | 일정 변경 이력 조회 (할 일 화면에서도 사용) |
| `CourseChangesModal.tsx` | 관리자용 통합 변경 이력 조회 |
| `CourseImport.tsx` | CSV 파일 선택과 업로드 |
| `CourseImportPreview.tsx` | 미리보기, 경고 확인, 적용과 취소 |

`courseManagementApi.ts`는 변경된 정보, 담당 배정, 일정 순서로 저장합니다. 직전 응답의 `version`을 다음 요청에 전달하고 일부 요청만 성공하면 완료된 항목을 함께 안내합니다.

CSV 파일은 `FormData`로 전송합니다. 서버에서 검사한 행별 변경 내용과 오류, 경고를 표시하며 확인한 경고 키를 적용 요청에 전달합니다. 작업 조회에는 URL의 `jobId`를 사용합니다.

CSV 양식은 `public/templates/courses_template.csv`를 `/templates/courses_template.csv`로 내려받습니다. 작성 규칙은 [CSV 입력 명세](../../contracts/api/course-import.md)를 따릅니다.

삭제는 목록의 `version`을 함께 보냅니다. 처리 기록(완료, 확인, 메모)이 있는 과정은 서버가 삭제 대신 보관하므로 확인 창에서 두 경우를 함께 안내하고, 응답의 `disposition`으로 삭제와 보관 결과를 나눠 알려 줍니다. 보관 목록은 `state=archived`로 조회하고, 복원하면 미완료 할 일의 마감을 서버가 다시 계산한 뒤 과정 목록으로 돌아갑니다. 보관 과정은 일정과 배정 정보를 조회할 수 없어 목록에서 과정 보기로 이동하지 않습니다.

통합 변경 이력은 변경 전후 값과 수정자, 시각을 표시합니다. 사유는 종료일 정정과 종료 과정의 관리자 예외 교체 이력에서만 표시합니다.

## 문서와 문서 업로드

`DocumentsPage.tsx`에서 사업 선택 여부를 확인하고 목록과 보기 화면을 연결합니다.

| 파일 | 역할 |
| --- | --- |
| `DocumentList.tsx` | 종류 필터, 제목 검색, 문서 목록. 외부 링크 문서는 새 탭에서 열기 |
| `DocumentViewer.tsx` | 앱 안 PDF 보기, 쪽 이동과 전체 화면, 개정 표시와 버전 기록. 쪽은 `?page=` 로 유지 |
| `documentData.ts` | 종류 목록, 안내 문구, 색인 상태 표시 |
| `AdminDocumentList.tsx` | 관리자 문서 목록, 검색과 필터, 교체, 버전, 삭제 확인, 읽기 다시 시도 |
| `DocumentUploadDrawer.tsx` | PDF 또는 외부 링크 등록. 10MB 이하 PDF만 받고 제목은 파일명으로 채움 |
| `DocumentReplaceModal.tsx` | 새 파일로 교체. 현재 판 번호를 함께 보냄 |
| `DocumentVersionsDrawer.tsx` | 버전 기록. 지난 판 보기, 관리자는 복원 |

PDF는 `iframe`으로 표시하므로 문서 안에서 직접 스크롤해도 위쪽 쪽수는 바뀌지 않습니다. 추후 방안을 찾아 변경 예정입니다. 업로드는 `metadata`와 `file`을 `FormData`로 전송하고, 교체와 복원은 목록의 `contentRevision`을, 삭제는 삭제 확인 정보의 `contentRevision`을 함께 보냅니다. 삭제한 문서와 같은 제목으로 새 문서를 등록할 수 있습니다. 작성 규칙은 [문서 API](../../contracts/api/documents.md)를 따릅니다.

### 미연동 항목 (추후 연동 예정)

| 항목 | 현재 상태 |
| --- | --- |
| 문서 안 구절 검색 | 검색창은 제목만 검색, 구절 검색은 비활성 |
| 문서 보기의 연결된 할 일 | 비활성 |
| 연결할 템플릿 | 비활성 |

## 물어보기

`AskPage.tsx`에서 대화 상태를 관리합니다. 선택한 사업으로 질문을 보내고, 응답의 `conversationId`를 같은 대화의 다음 요청에 사용합니다. 새 대화를 시작하거나 사업이 바뀌거나 로그인이 풀리면 대화를 초기화합니다. 선택할 수 있는 사업이 없으면 안내 카드를 표시합니다.

| 파일 | 역할 |
| --- | --- |
| `components/BotMessage.tsx` | 응답 상태별 말풍선. 즉답, 되묻기 후보와 해당 없음, 답 없음, 개인정보 경고, 오류 |
| `components/EvidenceView.tsx` | 근거 표시. 등록 안내와 문서 구절, 출처 문서 보기 이동, 관련 화면 열기 |
| `components/QuestionInput.tsx` | 질문 입력. 500자 제한과 개인정보 패턴 경고 |
| `askData.ts` | 글자 수 계산, 출처 문구, 이동 가능한 화면 경로, 오류 안내 문구 |

응답은 `answered`, `clarify`, `no_answer`, `pii_warning` 네 가지입니다. 되묻기에서 후보를 고르면 해당 근거를 답으로 보여 주고 `candidateSelected`로 알립니다. 해당 없음은 `noneSelected`로 알리고, 이후 안내 문구는 응답의 `guide.text`를 그대로 표시합니다. 안내 종류가 `contact`이면 입력을 막고 새 대화를 시작하게 합니다.

질문은 500자(유니코드 코드 포인트 기준)까지 입력합니다. 전화번호, 주민등록번호, 이메일 형식이 들어 있으면 입력칸에서 먼저 경고하며 전송은 막지 않습니다. 관련 화면은 앱에 있는 경로만 버튼으로 표시하고 관리자 화면은 관리자에게만 엽니다. 요청과 응답 형식은 [물어보기 API](../../contracts/api/questions.md)를 따릅니다.

## 사용자와 승인

`UsersPage.tsx`에서 역할에 따라 관리자 화면과 조직 단위 리더 화면을 나눕니다. 영역 리더만 가진 사용자는 사용할 수 없습니다. 승인이나 수정 후에는 목록을 다시 불러옵니다.

| 파일 | 역할 |
| --- | --- |
| `AdminUsersPage.tsx` | 관리자 화면. 승인 대기, 전체 사용자, 목록 관리 탭 |
| `components/ListManagement.tsx` | 목록 관리. 사업, 업무 영역, 조직 단위, 문서 종류의 이름, 순서, 숨김과 미사용 항목 삭제 |
| `LeaderUsersPage.tsx` | 조직 단위 리더 화면. 승인 대기와 소속 조직 사용자 역할 추가 |
| `components/UsersTabs.tsx` | 관리자와 리더 화면 공통 탭. 모바일에서는 칸 나뉜 버튼 모양 |
| `components/PendingUsers.tsx` | 승인 대기 목록. 같은 이름의 활성 사용자가 있으면 안내 |
| `components/AllUsers.tsx` | 사용자 목록, 검색과 조직 단위, 역할, 상태 필터 |
| `components/LeaderApprovalDrawer.tsx` | 리더의 승인 서랍. 리더 소속 조직으로 담당자와 조직 단위 리더만 지정 |
| `components/LeaderRoleDrawer.tsx` | 리더의 역할 추가 서랍. 담당자와 조직 단위 리더만 추가 |
| `components/UserDrawer.tsx` | 승인과 수정 서랍. 역할 선택, 조직 단위와 영역 입력, 활성 상태 변경 |
| `usersData.ts` | 역할 표시, 입력 검사, 요청 형식 변환 |

목록 관리는 네 목록을 한 번에 불러오고, 고친 행만 저장 버튼으로 보냅니다. 순서는 손잡이를 끌거나 위아래 화살표 키로 바꿉니다. 사용 중인 항목은 삭제 대신 숨김만 할 수 있고, 저장이나 삭제 뒤에는 목록을 다시 불러와 최신 version을 씁니다. 사업 목록을 저장하면 사이드바 사업 선택도 다시 불러옵니다. 두 항목의 이름을 서로 맞바꾸면 한 행씩 저장하는 동안 이름이 겹쳐 서버가 거절하므로, 한 항목에 임시 이름을 넣어 저장한 뒤 다시 바꿉니다.

모바일에서는 반응형을 적용해 승인 대기, 전체 사용자, 목록 관리를 표 대신 카드 목록으로 보여 줍니다.

서랍은 역할을 먼저 고르고 필요한 칸을 그 역할 아래에 보여 줍니다. 역할을 꺼도 입력한 값은 지우지 않습니다. 영역은 한 사람에 한 개이며 담당자와 담당자 화면 열람 전용이 같이 씁니다. 관리자만 고르면 조직 단위와 영역은 비워 둘 수 있습니다.

영역이 두 개인 기존 사용자는 한 개로 정리해야 저장됩니다. 목록에 없는 기존 조직과 영역은 "기존 설정"으로 표시합니다. 영역 선택지는 사업과 관계없는 `/api/options/user-areas`를 사용합니다. 저장할 때 `version`을 함께 보내며 형식은 [인증과 사용자 API](../../contracts/api/auth.md)를 따릅니다.

## 할 일 템플릿

`TaskTemplatesPage.tsx`에서 관리자만 들어올 수 있게 막고, 목록과 추가, 수정 화면을 주소로 나눕니다.

| 파일 | 역할 |
| --- | --- |
| `TaskTemplatesPage.tsx` | 관리자 확인, 목록과 추가, 수정 화면 연결. 수정 화면에 필요한 템플릿, 영역, 태그, 문서를 한 번에 불러옴 |
| `components/TemplateList.tsx` | 단계별로 묶은 목록, 검색과 영역, 기준, 상태 필터, 사용 켜고 끄기 |
| `components/TemplateEditor.tsx` | 추가와 수정 화면, 마감 미리보기, 저장 결과 안내 |
| `components/TagManager.tsx` | 태그 관리 창. 새 태그 추가, 이름 바꾸기, 켜고 끄기 |
| `templatesData.ts` | 기준 이름, 마감 설명 문구, 단계 묶기, 마감 미리보기 계산 |

목록은 단계별로 묶고 상시 할 일은 맨 아래에 둡니다. 검색어와 필터는 주소에 담아서 수정 화면에 갔다가 돌아와도 그대로 남습니다. 줄을 누르면 수정 화면으로 가고, 사용 스위치는 확인 후 바로 저장합니다.

수정 화면은 바뀐 칸만 서버에 보내고, 저장하면 진행 중인 과정에 반영된 건수를 안내합니다. 기준을 상시로 바꾸면 일수와 리더 확인을 비웁니다. 마감 미리보기는 주말이면 앞 평일로 당겨 보여 주고, 공휴일과 회사 휴무일은 서버가 할 일을 만들 때 반영합니다. 다른 사람이 먼저 수정했으면 최신 내용을 다시 불러오도록 안내합니다.

꺼진 태그는 이미 붙은 템플릿에만 보이고 새로 붙일 수 없습니다. 볼 수 없게 된 연결 문서와 꺼진 영역도 기존 설정은 그대로 보여 줍니다. 형식은 [과정과 템플릿 API](../../contracts/api/courses-and-templates.md)와 [일정과 홈 API](../../contracts/api/schedule-and-home.md)의 템플릿 변경 절을 따릅니다.

## 설정 내보내기 & 가져오기

`SettingsTransferPage.tsx`에서 관리자 접근을 확인하고 내보내기와 가져오기를 나란히 표시합니다.

| 파일 | 역할 |
| --- | --- |
| `SettingsExport.tsx` | 종류별 JSON 파일 내려받기 |
| `SettingsImport.tsx` | 파일 선택, 미리보기, 적용 |
| `settingsKinds.ts` | 설정 종류 이름과 설명 |

내보내기는 `GET /api/admin/export?kind=...` 응답을 `portal-<kind>.json` 파일로 저장합니다. 가져오기는 같은 파일을 `dryRun=true`로 먼저 검사해 항목 수를 보여 주고, 확인 창을 거쳐 `dryRun=false`로 적용합니다. 종류는 파일 안의 `kind`를 그대로 쓰고, 내보내기로 받은 파일이 아니면 고를 수 없습니다. 파일을 바꾸면 미리보기를 다시 해야 적용할 수 있습니다. 서버는 오류가 하나라도 있으면 아무것도 적용하지 않으며, 오류 위치(`fieldErrors`)는 목록으로 보여 줍니다. 적용 요청의 응답을 받지 못하면 자동으로 다시 보내지 않고 같은 종류를 내보내 확인하도록 안내합니다. 작성 규칙은 [설정 내보내기와 가져오기 API](../../contracts/api/settings-transfer.md)를 따릅니다.

## 휴무일 설정과 서비스 토큰

| 파일 | 역할 |
| --- | --- |
| `settings/components/HolidaySettings.tsx` | 연도별 공휴일과 회사 휴무일 목록, 추가, 수정, 삭제 |
| `settings/components/HolidayModal.tsx` | 회사 휴무일 추가와 수정 창 |
| `service-tokens/components/ServiceTokens.tsx` | 토큰 발급, 원문 한 번 보기와 복사, 폐기 |

공휴일(`source: API`)은 서버가 자동으로 가져오므로 수정과 삭제 버튼을 두지 않습니다. 회사 휴무일을 바꾸면 서버가 영향받는 미완료 할 일의 마감을 다시 계산하고, 마감이 바뀐 건수(`deadlineChangedTaskCount`)를 안내합니다. 수정은 바뀐 칸만 현재 `version`과 함께 보냅니다. 확신 기준값 같은 물어보기 설정값은 의뢰측 답변(11-24 질의응답)에 따라 화면을 두지 않습니다. 임박 기준과 알림 발송 시각은 설정 API가 없어 화면을 두지 않고 서버 환경변수(예: `MESSENGER_DUE_SOON_BUSINESS_DAYS`)로 바꿉니다. 설정 가져오기의 `settings` 파일에는 질문 기록 보관 일수만 들어 있습니다. 형식은 [일정과 홈 API](../../contracts/api/schedule-and-home.md)의 공휴일·회사 휴무일 절을 따릅니다.

서비스 토큰은 고른 사업의 과정 요약만 읽을 수 있는 `COURSE_SUMMARY_READ` 권한으로 발급합니다. 토큰 원문은 발급 응답에서 한 번만 받을 수 있어 닫기 전까지 창을 유지하고 복사 버튼과 호출 예시를 보여 줍니다. 발급 목록 조회 API가 없어 이번 화면에서 발급한 토큰만 목록에 두고, 그 밖의 토큰은 발급 ID로 폐기합니다. 형식은 [연동 API와 서비스 토큰](../../contracts/api/integration.md)을 따릅니다.

## 상태별 화면 확인

아래 `preview`는 목업과 목록 디자인 확인용입니다. 실제 저장 오류와 CSV 결과는 서버 응답을 사용합니다.

| 화면 | 파라미터 |
| --- | --- |
| 목업 할 일 `/tasks?source=mock` | `?preview=ended`, `empty`, `loading`, `error` |
| 과정 관리 목록 `/admin/courses` | `?preview=empty`, `loading`, `error` |

각 값은 `?preview=loading`처럼 사용합니다. 이미 `courseId`가 붙은 주소에는 `&preview=loading`처럼 이어 붙입니다. 할 일 상세는 `taskId`로 지정할 수 있습니다.
