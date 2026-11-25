# 목업과 상태 확인

## 목업 화면

`/tasks?source=mock`은 빈 과정, 불러오는 중, 오류, 종료된 과정처럼 실제 데이터로 만들기 어려운 상태를 시연 영상에 쓰려고 남겨 둔 화면입니다.

- 새로고침하면 처음으로 돌아가고, 실제 API 화면과 상태를 나누지 않습니다.
- `source=mock`은 화면을 가르는 값일 뿐이라 서버에는 보내지 않습니다.
- 데이터는 `*MockData.ts` 파일에 있습니다(`courseTasksMockData.ts`, `assigneeHomeMockData.ts`, `leaderHomeMockData.ts`).
- 시연 영상 촬영이 끝나면 배포 전에 목업 화면과 `*MockData.ts`를 모두 지웁니다.

## 상태 확인용 `preview`

디자인을 확인할 때 쓰는 값입니다. 실제 저장 오류와 CSV 결과는 서버 응답을 씁니다.

| 화면 | 값 |
| --- | --- |
| 목업 할 일 `/tasks?source=mock` | `?preview=ended`, `empty`, `loading`, `error` |
| 과정 관리 목록 `/admin/courses` | `?preview=empty`, `loading`, `error` |

`?preview=loading`처럼 붙입니다. 이미 `courseId`가 붙은 주소에는 `&preview=loading`으로 이어 붙입니다. 할 일 상세는 `taskId`로 지정할 수 있습니다.
