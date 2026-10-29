# MODO WORKAX 웹 프론트엔드

기술스택 : React + TypeScript + Vite + Ant Design + CSS
패키지 매니저 : npm

```bash
cd apps/web
npm ci
npm run dev
```

```bash
npm run build
npm run lint
```

- `src/App.tsx`, `src/App.css`: 앱 화면과 전용 스타일
- `src/providers/AppProvider.tsx`: Ant Design 공통 설정과 한국어·테마 적용
- `src/styles/theme.ts`: 브랜드 포인트 색상, Pretendard, 라이트·다크 테마 설정 — 상태 색 추가 예정
- `src/styles/fonts.css`: 웹폰트 선언
- `src/styles/index.css`: 전역 스타일
- `public/fonts/`: 웹폰트와 원본 라이선스
