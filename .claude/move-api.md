TODO: 수정 해야함, 특히 Domain 붙히는부분

목표

- 레거시 단일 파일 `src/lib/apis.ts`를 도메인별로 분리한다.
- `src/pages/*` 각 도메인 폴더에 `api.ts`, `types.ts`를 생성/정리한다.
- 기존 `@lib/apis` import를 각 도메인 파일 import로 교체한다.
- 최종적으로 `src/lib/apis.ts`를 제거한다.
- 동작(엔드포인트, 파라미터, 반환 타입)은 절대 변경하지 않는다.

중요 제약

- 리팩토링만 수행 (비즈니스 로직 변경 금지).
- URL, HTTP method, query/body shape, response select 구조 유지.
- 타입 안정성 강화는 허용하되 런타임 동작은 동일해야 함.
- 기존 워크트리에 다른 변경사항이 있어도 건드리지 않는다.
- 하나의 큰 PR이 아니라 “도메인 단위 커밋”으로 쪼개기.

작업 방식 (반드시 순서대로)

1. 인벤토리 작성

- `src/lib/apis.ts`의 export를 모두 수집하고 도메인별로 분류:
  - auth, order, shipping, preDelivery, settlement, shoppingmall, erpCode, supply, scm, myPage, common/shared
- 각 export에 대해 “현재 사용 파일 목록”을 매핑한다.
- 결과를 `migration-map.md`(또는 작업 로그)로 남긴다.

2. 도메인별 파일 생성 규칙

- 각 도메인 폴더에 아래 파일 생성:
  - `src/pages/<domain>/<Domain>.api.ts` (또는 `api.ts`)
  - `src/pages/<domain>/<Domain>.types.ts` (또는 `types.ts`)
- 규칙:
  - API 함수: `<domain>.api.ts`
  - 해당 도메인 전용 타입: `<domain>.types.ts`
  - 여러 도메인에서 공통 사용되는 타입은 우선 `src/lib/types` 또는 `src/shared/types`로 이동 검토
  - 순환 의존 발생 시 타입 전용 파일을 먼저 분리해 해결

3. import 교체

- 기존:
  - `import { ... } from '@lib/apis'`
  - `import type { ... } from '@lib/apis'`
- 변경:
  - 각 파일이 속한 도메인의 api/types 경로로 교체
  - 타 도메인 타입 참조가 필요한 경우 해당 도메인 `types.ts`를 직접 import
- 배럴(index.ts) 사용 시:
  - 초기엔 직접 경로 import로 명확히 변경 후, 마지막에 필요 시 배럴 추가

4. 단계적 마이그레이션 순서 (권장)

- 1차: `shoppingmall`, `erpCode` (상대적으로 범위 명확)
- 2차: `shipping`, `preDelivery`, `settlement`
- 3차: `order`, `supply`, `scm`, `auth`, `myPage`
- 각 단계마다:
  - 타입 체크/린트
  - 깨진 import/unused import 정리
  - 기능 smoke check 후 커밋

5. 최종 제거

- `@lib/apis` 참조가 0건인지 검색으로 확인
- `src/lib/apis.ts` 삭제
- 남은 타입/함수 재export가 필요하면 최소 배럴만 추가
- 전체 타입 체크/빌드/린트 통과 확인

검증 체크리스트 (필수)

- `rg "from '@lib/apis'" src` 결과 0건
- `rg "from \"@lib/apis\"" src` 결과 0건
- 타입 에러 0건
- 린트 신규 에러 0건
- 주요 페이지 smoke:
  - shoppingmall 목록/수정
  - erpCode 목록/일괄수정
  - shipping 조회
  - preDelivery 조회/요약
  - settlement 조회
- API 요청 URL/method/params/body가 리팩토링 전후 동일

커밋 전략

- 도메인 단위로 커밋:
  - `refactor(shoppingmall): move mall apis and types out of lib/apis`
  - `refactor(erpCode): split item apis/types by page domain`
  - ...
- 마지막 커밋:
  - `refactor(core): remove legacy src/lib/apis.ts`

산출물

- 도메인별 `api.ts`, `types.ts`
- 수정된 import 경로
- 삭제된 `src/lib/apis.ts`
- 마이그레이션 맵(선택)
- 변경 요약 + 검증 결과 리포트
