# 과정 관리

`CoursesPage.tsx`가 관리자만 들어오게 막고 하위 화면을 연결합니다. 목록은 서버 쪽수 단위로 불러옵니다.

| 파일 | 역할 |
| --- | --- |
| `CourseList.tsx`, `CourseLabels.tsx` | 목록, 검색과 필터, 상태 표시, 삭제. 행을 누르면 과정 보기로 이동 |
| `CourseEditor.tsx` | 과정 등록, 보기, 수정. 보기에서 수정 버튼을 누르면 같은 화면에서 수정 |
| `ArchivedCourses.tsx` | 보관 목록과 복원 |
| `AssigneeFields.tsx`, `AssigneeSearch.tsx` | 영역별 담당 배정, 이름과 이메일 검색 |
| `CourseCorrectionModal.tsx` | 종료일 정정과 담당 배정 변경 |
| `CourseHistoryModal.tsx` | 일정 변경 이력(할 일 화면에서도 씀) |
| `CourseChangesModal.tsx` | 관리자용 통합 변경 이력 |
| `CourseImport.tsx`, `CourseImportPreview.tsx` | CSV 선택과 업로드, 미리보기와 적용 |

## 저장

`courseManagementApi.ts`는 기본 정보, 담당 배정, 일정 순서로 저장합니다. 직전 응답의 `version`을 다음 요청에 넘기고, 일부만 저장됐으면 저장된 항목을 같이 알려 줍니다.

## CSV 가져오기

- 파일은 `FormData`로 보냅니다. 서버가 검사한 행별 변경 내용, 오류, 경고를 보여 줍니다.
- 확인한 경고 키를 적용 요청에 같이 보냅니다.
- 작업 조회에는 주소의 `jobId`를 씁니다.
- 양식은 `public/templates/courses_template.csv`이고 `/templates/courses_template.csv`로 내려받습니다. 작성 규칙은 CSV 입력 명세(원 저장소 계약서)를 따릅니다.

## 삭제, 보관, 복원

- 삭제는 목록의 `version`을 같이 보냅니다.
- 처리 기록(완료, 확인, 메모)이 있는 과정은 서버가 삭제하지 않고 보관합니다. 확인 창에서 두 경우를 같이 안내하고, 응답의 `disposition`으로 삭제됐는지 보관됐는지 알려 줍니다.
- 보관 목록은 `state=archived`로 불러옵니다. 복원하면 서버가 미완료 할 일의 마감을 다시 계산하고, 화면은 과정 목록으로 돌아옵니다.
- 보관한 과정의 이름을 누르면 읽기 전용 상세가 열립니다. 상세 위에 "보관된 과정이에요"라고 안내하고 수정은 막습니다. 일정 변경 이력은 서버가 보관 과정에는 409로 답해서 보이지 않습니다.

## 변경 이력

통합 변경 이력은 변경 전후 값, 수정한 사람, 시각을 보여 줍니다. 사유는 종료일 정정과 종료된 과정의 관리자 예외 교체에만 나옵니다.
