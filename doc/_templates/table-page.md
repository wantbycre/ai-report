# table-page.md

# Cursor 프롬프트 템플릿 — 테이블 페이지 생성

# 사용법: 아래 TASK 섹션만 채워서 Cursor 채팅창에 붙여넣기

# 참조: @.cursorrules @doc/\_templates/table-page.md

---

## CONTEXT

@.cursorrules
@src/hooks/useTableState.ts
@src/components/TablePagination.tsx

---

## ARCHITECTURE

생성할 파일 목록 (순서대로 생성):

```
src/app/(admin)/[feature]/
├── page.tsx                        # 진입점 (Suspense + layout만)
└── _components/
    └── [Feature]Table.tsx          # 테이블 본체
src/app/(admin)/[feature]/_hooks/
└── use[Feature]List.ts             # React Query 훅 + API 함수
```

의존 관계:

- page.tsx → [Feature]Table.tsx → useTableState + use[Feature]List
- TablePagination은 [Feature]Table 내부에서 사용

---

## CONSTRAINTS

### 반드시 지킬 것

- useTableState(data, meta, ...) 를 반드시 사용. 자체 page/sort 상태 생성 금지.
- 테이블 UI는 shadcn/ui <Table> 직접 구성. data-table 사용 금지.
- 페이지네이션은 <TablePagination> 컴포넌트 사용.
- API 응답은 반드시 ApiResponse<T> 래핑 구조: { success, data, message }
- useQuery select로 ApiResponse 언래핑: select: (res) => res.data.data
- onPageChange / onPageSizeChange → params state 변경 → useQuery 재호출 흐름 유지.
- 로딩: <Spinner /> 사용. Skeleton 금지.
- 삭제/확인 다이얼로그: <AlertDialog> 사용. 브라우저 confirm() 금지.
- useMutation onSuccess는 컴포넌트에서 처리. 훅 내부 작성 금지.

### 체크박스가 있는 경우

- useTableState의 selectedIds, isAllSelected, isIndeterminate, handleSelectAll, handleSelectRow 사용.
- Checkbox indeterminate 처리:
  ```tsx
  <Checkbox
    checked={isAllSelected || (isIndeterminate ? "indeterminate" : false)}
    onCheckedChange={handleSelectAll}
  />
  ```

### 정렬이 있는 경우

- useTableState의 handleSort, sortKey, sortOrder, sorted 사용.
- 정렬 아이콘: asc=ChevronUp / desc=ChevronDown / 미정렬=ChevronsUpDown (lucide-react)
- sorted 배열을 map. data 직접 map 금지.

### 행 클릭 → 상세 이동인 경우

- TableRow에 onClick + cursor-pointer 클래스 추가.
- router.push(`/[feature]/${row.id}`) 패턴 사용.

---

## API SPEC

# 아래 내용을 실제 스펙으로 교체하세요.

```
Endpoint : GET /api/oms/[resource]
Params   : page(number, 1-based), size(number)
Response : {
  success      : boolean
  message      : string
  data: {
    content      : [Feature]Item[]   ← 실제 데이터 배열
    page         : number            ← 요청 페이지
    size         : number
    totalElements: number
    totalPages   : number
    number       : number            ← 현재 페이지 (1-based)
  }
}
```

---

## TYPES

# 아래 타입을 실제 필드로 교체하세요.

```typescript
interface [Feature]Item {
  id      : string | number   // 필수 (useTableState 제네릭 제약)
  // 실제 필드 추가
}

interface [Feature]ListParams {
  page: number   // 1-based
  size: PageSize
  // 검색 조건 추가
}
```

---

## TASK

# 아래 내용을 작업 내용으로 교체한 뒤 Cursor에 붙여넣으세요.

```
[feature]  = order          ← 실제 feature명 (소문자, 라우트 폴더명)
[Feature]  = Order          ← PascalCase
[resource] = orders         ← API endpoint 리소스명

컬럼 구성:
- 체크박스 (전체/개별 선택)
- 주문번호 (정렬 가능)
- 주문일시 (정렬 가능)
- 상태
- 금액

인터랙션:
- [ ] 행 클릭 → 상세 이동     ← 해당하면 체크
- [x] 체크박스 선택 → 일괄 삭제
- [ ] 기타: _____________

검색/필터 조건:
- 없음  (있으면 필드명과 타입 기재)
```

---

## OUTPUT FORMAT

Cursor에게 요청할 출력 형식:

1. 생성할 파일 목록 먼저 나열
2. 각 파일 전체 코드 (파일명 주석 포함)
3. 수정이 필요한 기존 파일이 있으면 마지막에 명시
4. TODO 항목은 코드 내 주석으로 표시 (TODO: [태그] 형식)

---

## EXAMPLE PROMPT

# 실제 Cursor 채팅창 입력 예시

```
@.cursorrules @doc/_templates/table-page.md @src/hooks/useTableState.ts @src/components/TablePagination.tsx

다음 스펙으로 주문 목록 테이블 페이지를 생성해줘.

feature  = order
Feature  = Order
resource = orders

컬럼: 체크박스 | 주문번호(정렬) | 주문일시(정렬) | 상태 | 금액
인터랙션: 체크박스 선택 → 일괄 삭제 (AlertDialog 확인 필요)
API: GET /api/oms/orders, params: { page, size }
타입:
  OrderItem { id: string; orderNo: string; createdAt: string; status: string; amount: number }
```
