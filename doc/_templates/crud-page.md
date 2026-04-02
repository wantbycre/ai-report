# crud-page.md

# Cursor 프롬프트 템플릿 — CRUD 페이지 생성

# 사용법: 아래 TASK 섹션만 채워서 Cursor 채팅창에 붙여넣기

# 참조: @.cursorrules @doc/\_templates/crud-page.md

---

## CONTEXT

@.cursorrules
@src/hooks/useTableState.ts
@src/components/TablePagination.tsx
@src/types/api.ts

---

## ARCHITECTURE

### 파일 구조

```
src/app/(admin)/[feature]/
├── page.tsx                          # 진입점: Suspense + Spinner. 로직 없음.
└── _components/
    ├── [Feature]List.tsx             # 테이블 + 페이징 + Dialog 트리거
    ├── [Feature]FormDialog.tsx       # 등록/수정 Dialog (등록·수정 공용)
    └── [Feature]DeleteDialog.tsx     # 삭제 확인 AlertDialog (필요시)
src/app/(admin)/[feature]/_hooks/
├── use[Feature]List.ts               # useQuery — 목록
├── use[Feature]Detail.ts             # useQuery — 단건 (수정 시 초기값)
├── use[Feature]Create.ts             # useMutation — 등록
├── use[Feature]Update.ts             # useMutation — 수정
└── use[Feature]Delete.ts             # useMutation — 삭제
```

### 컴포넌트 책임 분리

```
page.tsx
└── Suspense → [Feature]List

[Feature]List
├── init 설정 (params 초기값, selectbox 옵션 등)
├── useTableState — 페이징/정렬/체크박스 상태
├── use[Feature]List — 목록 데이터
├── Dialog open 상태 관리 (isDialogOpen, selectedId)
├── window 팝업 메시지 수신 → queryClient.invalidateQueries (useEffect 허용)
└── return: 검색 영역 + Table + TablePagination + [Feature]FormDialog

[Feature]FormDialog
├── props: open, mode('create'|'edit'), id, onClose
├── mode='edit' 일 때 use[Feature]Detail 호출 → setValue
├── useEffect: data(수정 초기값) → form.reset(data) 단 1개만 허용
├── useForm + zod resolver
└── onSuccess 처리: 호출한 [Feature]List에서 처리
```

---

## CONSTRAINTS

### page.tsx 규칙

```tsx
// ✅ 로딩은 Spinner. Skeleton 금지.
"use client";
export default function [Feature]Page() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        }
      >
        <[Feature]List />
      </Suspense>
    </div>
  );
}
```

### [Feature]List 초기화 규칙

```tsx
// ✅ selectbox 옵션, params 초기값 등 init은 컴포넌트 상단에 선언
const STATUS_OPTIONS = [
  { label: '전체', value: '' },
  { label: '활성', value: 'active' },
  { label: '비활성', value: 'inactive' },
] as const;

const DEFAULT_PARAMS: [Feature]ListParams = {
  page: 1,
  size: 100,
};
```

### useEffect 허용 케이스 (이 3가지 외 useEffect 생성 금지)

**케이스 1 — 수정 초기값 세팅 (FormDialog 내부)**

```tsx
// ✅ 수정 데이터 → form reset. [Feature]FormDialog 내부에서만 허용.
useEffect(() => {
  if (data) form.reset(data);
}, [data]);
```

**케이스 2 — window 팝업 → 부모 list 갱신**

```tsx
// ✅ window 팝업(별도 브라우저 창)에서 작업 완료 후 list 갱신.
// BroadcastChannel 방식 (같은 도메인 내 탭/창 간 통신)
useEffect(() => {
  const channel = new BroadcastChannel("[feature]-channel");
  channel.onmessage = (e) => {
    if (e.data === "refresh") {
      queryClient.invalidateQueries({ queryKey: ["[feature]List"] });
    }
  };
  return () => channel.close();
}, [queryClient]);

// ✅ window 팝업 쪽(자식 창)에서 완료 시 전송
// src/app/(admin)/[feature]-popup/page.tsx 또는 별도 팝업 페이지에서:
const channel = new BroadcastChannel("[feature]-channel");
channel.postMessage("refresh");
channel.close();
window.close();
```

**케이스 3 — props data 조합 (부모→자식 데이터 가공)**

```tsx
// ✅ 부모에서 받은 여러 props를 조합해 로컬 상태로 가공할 때만 허용.
useEffect(() => {
  if (parentData && extraData) {
    setMergedData(merge(parentData, extraData));
  }
}, [parentData, extraData]);
```

### Dialog (등록/수정 공용) 규칙

```tsx
// ✅ mode로 등록/수정 분기. 별도 컴포넌트 만들지 않는다.
interface [Feature]FormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  id?: string | number;   // edit 모드일 때만 전달
  onClose: () => void;
  onSuccess: () => void;  // 목록 갱신 트리거 — List에서 invalidateQueries
}

// ✅ Dialog 열기/닫기 상태는 [Feature]List에서 관리
const [dialogState, setDialogState] = useState<{
  open: boolean;
  mode: 'create' | 'edit';
  id?: string | number;
}>({ open: false, mode: 'create' });

const handleOpenCreate = () =>
  setDialogState({ open: true, mode: 'create' });

const handleOpenEdit = (id: string | number) =>
  setDialogState({ open: true, mode: 'edit', id });

const handleClose = () =>
  setDialogState((prev) => ({ ...prev, open: false }));
```

### 삭제 확인 규칙

```tsx
// ✅ AlertDialog 사용. 브라우저 confirm() 금지.
// 삭제 버튼 클릭 → AlertDialog open → 확인 클릭 → mutate
const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);

<AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
      <AlertDialogDescription>
        이 작업은 되돌릴 수 없습니다.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>취소</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => deleteTarget && mutateDelete(deleteTarget)}
      >
        삭제
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>;
```

### onSuccess 처리 위치

```tsx
// ✅ mutate onSuccess는 [Feature]List에서 처리. FormDialog 내부 금지.
const handleSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['[feature]List'] });
  handleClose();
};

// FormDialog에 onSuccess prop으로 전달
<[Feature]FormDialog
  open={dialogState.open}
  mode={dialogState.mode}
  id={dialogState.id}
  onClose={handleClose}
  onSuccess={handleSuccess}   // ← List에서 정의한 핸들러 주입
/>
```

---

## FORM 규칙

```tsx
// ✅ React Hook Form + zod
const schema = z.object({
  // 실제 필드 정의
});

type [Feature]FormValues = z.infer<typeof schema>;

const form = useForm<[Feature]FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { /* 초기값 */ },
});

// ✅ 수정 모드: 데이터 로드 후 reset
const { data } = use[Feature]Detail(id, { enabled: mode === 'edit' && !!id });
useEffect(() => {
  if (data) form.reset(data);
}, [data]);

// ✅ submit
const handleSubmit = form.handleSubmit((values) => {
  if (mode === 'create') {
    createMutate(values, { onSuccess: (res) => {
      if (!res.data.success) { /* AlertDialog */ return; }
      onSuccess();
    }});
  } else {
    updateMutate({ id: id!, ...values }, { onSuccess: (res) => {
      if (!res.data.success) { /* AlertDialog */ return; }
      onSuccess();
    }});
  }
});
```

---

## TASK

# 아래 내용을 실제 작업으로 교체한 뒤 Cursor에 붙여넣으세요.

```
[feature]  = order          ← 소문자, 라우트 폴더명
[Feature]  = Order          ← PascalCase
[resource] = orders         ← API endpoint 리소스명

컬럼 구성:
- (필드명과 타입 기재)

인터랙션:
- [ ] 등록 버튼 → FormDialog (create 모드)
- [ ] 행 클릭 또는 수정 버튼 → FormDialog (edit 모드)
- [ ] 삭제 버튼 → AlertDialog 확인 후 삭제
- [ ] window 팝업 → 완료 시 list 갱신 필요  (있으면 채널명 기재)
- [ ] 체크박스 선택 → 일괄 삭제

form 필드:
- (필드명, 타입, 유효성 규칙 기재)

selectbox 초기값:
- (옵션 목록 기재, 없으면 '없음')
```

---

## EXAMPLE PROMPT

```
@.cursorrules @doc/_templates/crud-page.md
@src/hooks/useTableState.ts @src/components/TablePagination.tsx @src/types/api.ts

다음 스펙으로 주문 CRUD 페이지를 생성해줘.

feature  = order
Feature  = Order
resource = orders

컬럼: 체크박스 | 주문번호(정렬) | 고객명 | 상태 | 금액 | 수정 | 삭제

인터랙션:
- 등록 버튼 → OrderFormDialog (create 모드)
- 수정 버튼 클릭 → OrderFormDialog (edit 모드, id 전달)
- 삭제 버튼 → AlertDialog 확인 후 삭제
- window 팝업 완료 시 list 갱신: BroadcastChannel 'order-channel'

form 필드:
- customerId: string (필수)
- status: 'active' | 'inactive' (필수, select)
- amount: number (필수, 양수)
- memo: string (선택)

selectbox 초기값:
- STATUS_OPTIONS: [{ label: '활성', value: 'active' }, { label: '비활성', value: 'inactive' }]

타입:
  OrderItem { id: string; orderNo: string; customerName: string; status: string; amount: number }
  OrderCreatePayload { customerId: string; status: string; amount: number; memo?: string }
  OrderUpdatePayload = OrderCreatePayload & { id: string }

API:
  GET    /api/oms/orders           → ApiResponse<{ content: OrderItem[] } & PageMeta>
  GET    /api/oms/orders/:id       → ApiResponse<OrderItem>
  POST   /api/oms/orders           → ApiResponse<OrderItem>
  PUT    /api/oms/orders/:id       → ApiResponse<OrderItem>
  DELETE /api/oms/orders/:id       → ApiResponse<null>
```
