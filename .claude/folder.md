# Folder & Move & Import Refactor Guide

## 폴더 구조

```
src/
├── page/                   # 실제 페이지
│   ├── auth
│       ├── page.tsx
│       ├── components/
│       ├── queries.ts
│       ├── fetchers.ts
│       ├── hooks/
│       └── types.ts
├── components/             # 공통 UI
├── lib/                    # 유틸, 데이터 접근
│   ├── api/ -
│   ├── styles/
│   ├── const.ts
│   ├── types/
│   └── utils
└── store/
```

## 목적

src/features의 사용되는 폴더 및 파일을
src/pages/[folder] 로 일괄 취합하여
하나의 폴더에서 index.tsx, component, api, fetchers, hooks, types 를 관리 한다.

---

## 작업 대상

### 이동 전

- src/features/ 각 폴더 pages와 매칭된 폴더

### 이동 후

- src/pages/ 각 features와 매칭된 폴더

---

## 작업 내용

기존:
src/features/ui/auth/AuthPage.tsx

변경:
src/pages/auth/Auth.tsx

--

기존:
src/features/auth/ui/ **AuthPage.tsx** 페이지를 제외한 전부

변경:
src/pages/auth/components/ 이동

--

기존:
src/features/auth/hooks

변경:
src/pages/auth/hooks

--

기존:
src/features/auth/model/

변경:
src/pages/types.ts

--

기존:
src/features/auth/api/

변경:
src/pages/fetchers.ts, queres/ts

---

## 규칙

1. import 경로만 수정하고 내부 로직은 변경하지 않는다
2. .ts, .jsx 모든 파일 참조한다.
3. 사용되지 않는 파일은 삭제한다.

---

## 작업 범위

- feartures
- pages

---

## 주의사항

- 기존 기능 동작 유지 필수
- 잘못된 경로 수정 방지
- 작업대상 및 작업 내용 외 건드리지 말것

## 완료조건

- [ ] src/pages/ 작업완료된 파일들의 import 확인
- [ ] index.tsx, component, queries.ts, fetchers.ts, hooks, types.ts 구조 확인
- [ ] src/features/ 작업완료시 제거 확인

## 테스트

- build 테스트
