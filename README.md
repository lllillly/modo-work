# MODO WORK 웹 프론트엔드

React 19, TypeScript, Vite, Ant Design 6, Tailwind CSS 4로 만들었고 패키지 매니저는 npm입니다.

## 실행

```bash
cd apps/web
npm ci
npm run dev
```

- 빌드는 `npm run build`입니다. TypeScript 검사도 같이 합니다.
- 린트는 `npm run lint`입니다.
- 백엔드는 [백엔드 로컬 실행](../../docs/development/backend-local.md)을 따라 먼저 켜 둡니다.

API는 세션 쿠키를 쓰고 `/api` 상대 경로로 부릅니다. 로컬에서는 Vite가 `http://localhost:8080`으로 넘기고, Docker에서는 Nginx가 넘깁니다.

### 하위 경로에 올릴 때

주소 앞에 경로를 붙여야 하면 빌드나 실행 전에 `BASE_PATH`를 정합니다. 정하지 않으면 `/`입니다.

```bash
BASE_PATH=/portal npm run build
```

화면 주소, 정적 파일, API(`/portal/api`), 문서 PDF 주소가 모두 이 경로 아래로 바뀝니다. 개발 서버도 `BASE_PATH=/portal npm run dev`로 같은 방식으로 띄울 수 있고, Vite가 `/portal/api`를 백엔드의 `/api`로 넘깁니다. Docker로 빌드할 때는 `--build-arg BASE_PATH=/portal`로 넘깁니다.

## 문서

| 문서 | 내용 |
| --- | --- |
| [화면과 연동 상태](docs/screens.md) | 화면별 주소 및 연동 상태 |
| [폴더 구조와 공통 규칙](docs/structure.md) | 폴더별 역할, 공용 컴포넌트와 함수, 스타일 규칙 |
| [홈과 과정별 할 일](docs/home-tasks.md) | 로그인, 담당자·리더 홈, 할 일 화면 |
| [과정 관리](docs/courses.md) | 과정 목록과 수정, CSV 가져오기, 보관과 복원 |
| [문서와 물어보기](docs/documents-ask.md) | 문서 보기와 본문 검색, 업로드, 물어보기 |
| [관리자 화면](docs/admin.md) | 사용자와 승인, 할 일 템플릿, 설정 내보내기와 가져오기, 휴무일, 서비스 토큰 |
| [목업과 상태 확인](docs/mock-preview.md) | 목업 화면과 `preview` 주소 |

API 형식은 [contracts/api](../../contracts/api/)의 문서를 따릅니다.
