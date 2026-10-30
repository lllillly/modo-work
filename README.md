# MODO WORKAX 웹 프론트엔드

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

초기화 스타일은 Ant Design reset을 사용하며 충돌 가능성이 있어서 Tailwind Preflight는 제외했습니다.