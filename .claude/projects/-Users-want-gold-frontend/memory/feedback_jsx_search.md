---
name: jsx 파일 검색 포함
description: 파일 검색 시 .jsx 확장자도 반드시 포함해야 함
type: feedback
---

파일 검색 및 import 경로 변경 작업 시 `.ts`, `.tsx`만 검색하지 말고 `.js`, `.jsx`도 항상 포함할 것.

**Why:** `src/components/Layout/index.jsx`에서 `@features/auth` import를 누락해 에러가 발생했음. `.jsx` 확장자를 검색 범위에서 빠뜨린 것이 원인.

**How to apply:** grep, 파일 탐색, import 경로 변경 작업 시 `--include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"` 를 항상 함께 사용.
