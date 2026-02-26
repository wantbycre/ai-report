# AI Report

SSR Next.js(App Router) 포트폴리오 프로젝트입니다.

## 기술 스택

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

## 실행

```bash
yarn dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

## 프로젝트 구조 (App Router 권장 패턴)

```
src/
├── app/                    # 라우팅 + 레이아웃
│   ├── layout.tsx          # 루트 레이아웃, 메타데이터, 폰트
│   ├── page.tsx            # 홈 (/)
│   ├── error.tsx           # 전역 에러 바운더리 (클라이언트)
│   ├── not-found.tsx       # 404
│   ├── globals.css
│   ├── api/reports/        # API Route: GET /api/reports
│   │   └── route.ts
│   └── reports/
│       ├── page.tsx        # SSR 페이지
│       ├── loading.tsx     # Suspense 로딩 UI
│       └── _components/    # 라우트 전용 컴포넌트 (URL에 노출 안 됨)
│           └── ReportCard.tsx
├── components/             # 공통 UI
│   └── layout/
│       └── AppNav.tsx
├── lib/                    # 유틸, 데이터 접근
│   ├── utils.ts            # cn() 등
│   └── mock-reports.ts
└── types/                  # 공통 타입
    └── report.ts
```

- **Co-location**: 라우트 전용 코드는 해당 라우트 폴더의 `_components`, `_hooks` 등에 두고, `_` 접두사로 라우팅에서 제외.
- **Server Components 기본**: 페이지는 async로 서버에서 데이터 조회. 클라이언트가 필요할 때만 `"use client"`.
- **error.tsx / not-found.tsx**: 에러·404 처리로 UX 개선.

## 참고

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Next.js 프로젝트 구조 가이드](https://nextjs.org/docs/app/building-your-application/routing)
