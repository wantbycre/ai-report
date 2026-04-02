# api-hook.md

# Cursor 프롬프트 템플릿 — API Hook 생성 (useQuery / useMutation)

# 사용법: 아래 TASK 섹션만 채워서 Cursor 채팅창에 붙여넣기

# 참조: @.cursorrules @doc/\_templates/api-hook.md

---

## CONTEXT

@.cursorrules
@src/types/api.ts

---

## ARCHITECTURE

### 파일 위치 규칙

```
# feature 전용 훅 (해당 페이지에서만 사용)
src/app/(admin)/[feature]/_hooks/use[Feature][Action].ts

# 전역 공용 훅 (2개 이상 feature에서 공유)
src/hooks/use[Feature][Action].ts
```

### 파일 1개 = 훅 1개

- use[Feature]List.ts → useQuery (목록 조회)
- use[Feature]Detail.ts → useQuery (단건 조회)
- use[Feature]Create.ts → useMutation (등록)
- use[Feature]Update.ts → useMutation (수정)
- use[Feature]Delete.ts → useMutation (삭제)

---

## CONSTRAINTS

### 공통

- API 함수는 훅 파일 상단에 함께 위치. 별도 api/ 파일 분리 금지.
- named export만 사용. default export 금지.
- any 타입 금지. ApiResponse<T> 래핑 구조 준수.

### useMutation 규칙 ★ 핵심

- 훅 내부에 onSuccess / onError 작성 금지.
- mutationFn 만 정의하고 반환.
- onSuccess의 분기 처리(알림, 페이지 이동, 상태 변경 등)는
  반드시 호출하는 컴포넌트(tsx)에서 useMutation의 두 번째 인자로 처리.

```typescript
// ✅ 훅 — mutationFn만
export const useOrderCreate = () => {
  return useMutation({
    mutationFn: postOrder,
  });
};

// ✅ 컴포넌트 — onSuccess는 여기서
const { mutate } = useOrderCreate();

const handleSubmit = () => {
  mutate(payload, {
    onSuccess: (res) => {
      if (!res.data.success) {
        // TODO: [ALERT] AlertDialog로 교체
        return;
      }
      // 성공 후 처리 (페이지 이동, 상태 변경, 목록 갱신 등)
      queryClient.invalidateQueries({ queryKey: ['orderList'] });
      router.push('/order');
    },
  });
};

// ❌ 금지 — 훅 내부 onSuccess
export const useOrderCreate = () => {
  return useMutation({
    mutationFn: postOrder,
    onSuccess: (res) => { ... },  // 금지
  });
};
```

### useQuery 규칙

- select로 ApiResponse 언래핑 필수: `select: (res) => res.data.data`
- queryKey: ['리소스명', params객체] 형태 통일.
- params가 없는 단건 조회: ['리소스명', { id }]

```typescript
// ✅ 목록 조회
export const useOrderList = (params: OrderListParams) => {
  return useQuery({
    queryKey: ["orderList", params],
    queryFn: () => getOrderList(params),
    select: (res) => res.data.data,
  });
};

// ✅ 단건 조회
export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ["orderDetail", { id }],
    queryFn: () => getOrderDetail(id),
    select: (res) => res.data.data,
    enabled: !!id, // id 없을 때 호출 방지
  });
};
```

---

## TASK

# 아래 내용을 실제 작업으로 교체한 뒤 Cursor에 붙여넣으세요.

```
[feature]  = order          ← 소문자, 폴더명
[Feature]  = Order          ← PascalCase
[resource] = orders         ← API endpoint 리소스명

생성할 훅:
- [x] useOrderList.ts     (useQuery — 목록)
- [ ] useOrderDetail.ts   (useQuery — 단건)
- [x] useOrderCreate.ts   (useMutation — 등록)
- [ ] useOrderUpdate.ts   (useMutation — 수정)
- [x] useOrderDelete.ts   (useMutation — 삭제)

onSuccess 처리 위치: 호출 컴포넌트 (훅 내부 작성 금지)
```

---

## EXAMPLE PROMPT

# 실제 Cursor 채팅창 입력 예시 (mutation)

```
@.cursorrules @doc/_templates/api-hook.md @src/types/api.ts

다음 스펙으로 주문 등록/삭제 훅을 생성해줘.

feature  = order
Feature  = Order
resource = orders

생성할 훅: useOrderCreate.ts, useOrderDelete.ts
onSuccess는 훅 내부에 작성하지 말 것. 컴포넌트에서 처리.

타입:
  OrderCreatePayload { customerId: string; items: { productId: string; qty: number }[] }
  OrderItem { id: string; orderNo: string; status: string; amount: number }

API:
  POST   /api/oms/orders           → ApiResponse<OrderItem>
  DELETE /api/oms/orders/:id       → ApiResponse<null>
```

---

## EXAMPLE PROMPT

# 실제 Cursor 채팅창 입력 예시 (query)

```
@.cursorrules @doc/_templates/api-hook.md @src/types/api.ts

다음 스펙으로 주문 목록/단건 조회 훅을 생성해줘.

feature  = order
Feature  = Order
resource = orders

생성할 훅: useOrderList.ts, useOrderDetail.ts

타입:
  OrderItem        { id: string; orderNo: string; createdAt: string; status: string; amount: number }
  OrderListParams  { page: number; size: PageSize; status?: string }

API:
  GET /api/oms/orders          params: OrderListParams  → ApiResponse<{ content: OrderItem[] } & PageMeta>
  GET /api/oms/orders/:id                               → ApiResponse<OrderItem>
```
