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
| 물어보기 (S16) | `/ask` | 질문 보내기, 되묻기 후보 선택, 근거 표시 API 연결 |

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
| `src/pages/ask/` | 물어보기 |

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
| `CourseList.tsx`, `CourseLabels.tsx` | 과정 목록, 검색과 필터, 상태 표시. 행을 누르면 과정 보기로 이동 |
| `CourseEditor.tsx` | 과정 등록, 보기, 수정. 보기 화면에서 수정 버튼을 누르면 같은 화면에서 수정 |
| `AssigneeFields.tsx`, `AssigneeSearch.tsx` | 공동 담당 배정과 이름, 이메일 검색 |
| `CourseCorrectionModal.tsx` | 종료일 정정과 담당 배정 변경 |
| `CourseHistoryModal.tsx` | 일정 변경 이력 조회 (할 일 화면에서도 사용) |
| `CourseChangesModal.tsx` | 관리자용 통합 변경 이력 조회 |
| `CourseImport.tsx` | CSV 파일 선택과 업로드 |
| `CourseImportPreview.tsx` | 미리보기, 경고 확인, 적용과 취소 |

`courseManagementApi.ts`는 변경된 정보, 담당 배정, 일정 순서로 저장합니다. 직전 응답의 `version`을 다음 요청에 전달하고 일부 요청만 성공하면 완료된 항목을 함께 안내합니다.

CSV 파일은 `FormData`로 전송합니다. 서버에서 검사한 행별 변경 내용과 오류, 경고를 표시하며 확인한 경고 키를 적용 요청에 전달합니다. 작업 조회에는 URL의 `jobId`를 사용합니다.

### 미연동 항목 (추후 연동 예정)

구현과 연동이 끝난 항목은 표에서 삭제합니다.

| 항목 | 현재 상태 |
| --- | --- |
| 삭제, 보관, 복원과 보관 목록 | 비활성, 백엔드 구현 후 연결 |

통합 변경 이력은 변경 전후 값과 수정자, 시각을 표시합니다. 사유는 종료일 정정과 종료 과정의 관리자 예외 교체 이력에서만 표시합니다.

## 문서와 문서 업로드

`DocumentsPage.tsx`에서 사업 선택 여부를 확인하고 목록과 보기 화면을 연결합니다.

| 파일 | 역할 |
| --- | --- |
| `DocumentList.tsx` | 종류 필터, 제목 검색, 문서 목록. 외부 링크 문서는 새 탭에서 열기 |
| `DocumentViewer.tsx` | 앱 안 PDF 보기, 쪽 이동과 전체 화면. 쪽은 `?page=` 로 유지 |
| `documentData.ts` | 종류 목록, 안내 문구, 색인 상태 표시 |
| `AdminDocumentList.tsx` | 관리자 문서 목록, 검색과 필터, 삭제, 읽기 다시 시도 |
| `DocumentUploadDrawer.tsx` | PDF 올리기. 10MB 이하 PDF만 받고 제목은 파일명으로 채움 |

PDF는 `iframe`으로 표시하므로 문서 안에서 직접 스크롤해도 위쪽 쪽수는 바뀌지 않습니다. 추후 방안을 찾아 변경 예정입니다. 업로드는 `metadata`와 `file`을 `FormData`로 전송하고, 삭제는 목록에서 받은 `contentRevision`을 함께 보냅니다. 삭제한 문서의 제목은 다시 사용할 수 없습니다. 작성 규칙은 [문서 API](../../contracts/api/documents.md)를 따릅니다.

### 미연동 항목 (추후 연동 예정)

| 항목 | 현재 상태 |
| --- | --- |
| 문서 안 구절 검색 | 검색창은 제목만 검색, 구절 검색은 비활성 |
| 문서 보기의 연결된 할 일 | 비활성 |
| 새 파일로 교체, 버전, 연결할 템플릿 | 비활성 |
| 외부 링크 등록 | 비활성 |

## 물어보기

`AskPage.tsx`에서 대화 상태를 관리합니다. 선택한 사업으로 질문을 보내고, 응답의 `conversationId`를 같은 대화의 다음 요청에 사용합니다. 새 대화를 시작하거나 사업이 바뀌거나 로그인이 풀리면 대화를 초기화합니다. 선택할 수 있는 사업이 없으면 안내 카드를 표시합니다.

| 파일 | 역할 |
| --- | --- |
| `components/BotMessage.tsx` | 응답 상태별 말풍선. 즉답, 되묻기 후보와 해당 없음, 답 없음, 개인정보 경고, 오류 |
| `components/EvidenceView.tsx` | 근거 표시. 등록 안내, 문서 구절과 문서 보기 이동, 관련 화면 열기 |
| `components/QuestionInput.tsx` | 질문 입력. 500자 제한과 개인정보 패턴 경고 |
| `askData.ts` | 글자 수 계산, 출처 문구, 이동 가능한 화면 경로, 오류 안내 문구 |

응답은 `answered`, `clarify`, `no_answer`, `pii_warning` 네 가지입니다. 되묻기에서 후보를 고르면 해당 근거를 답으로 보여 주고 `candidateSelected`로 알립니다. 해당 없음은 `noneSelected`로 알리고, 이후 안내 문구는 응답의 `guide.text`를 그대로 표시합니다. 안내 종류가 `contact`이면 입력을 막고 새 대화를 시작하게 합니다.

질문은 500자(유니코드 코드 포인트 기준)까지 입력합니다. 전화번호, 주민등록번호, 이메일 형식이 들어 있으면 입력칸에서 먼저 경고하며 전송은 막지 않습니다. 관련 화면은 앱에 있는 경로만 버튼으로 표시하고 관리자 화면은 관리자에게만 엽니다. 요청과 응답 형식은 [물어보기 API](../../contracts/api/questions.md)를 따릅니다.

## 상태별 화면 확인

아래 `preview`는 목업과 목록 디자인 확인용입니다. 실제 저장 오류와 CSV 결과는 서버 응답을 사용합니다.

| 화면 | 파라미터 |
| --- | --- |
| 담당자 홈 `/` | `?preview=empty`, `no-alerts`, `loading`, `error` |
| 리더 홈 `/` | `?preview=empty`, `no-reviews`, `closed-org`, `loading`, `error` |
| 목업 할 일 `/tasks` | `?preview=ended`, `empty`, `loading`, `error` |
| 과정 관리 목록 `/admin/courses` | `?preview=empty`, `loading`, `error` |

각 값은 `?preview=loading`처럼 사용합니다. 이미 `courseId`가 붙은 주소에는 `&preview=loading`처럼 이어 붙입니다. 할 일 상세는 `taskId`로 지정할 수 있습니다.
