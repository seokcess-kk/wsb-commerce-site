# WSB 종합몰 — 어드민 운영 화면 설계 (신규 도메인 + 주문관리 보강)

> 작성일: 2026-06-09 · 범위: 신규 고객 도메인(취소/반품·쿠폰·문의·리뷰)의 **운영자 관리 화면** + 기존 어드민 **주문관리 UX 보강** · 근거: 실제 코드(`src/db/schema`, `src/app/admin`, `src/lib`) 직접 확인

## 0. 배경과 목적

기존 어드민(Plan 5: 대시보드·상품·주문·배너)은 main에 머지되어 동작한다. 그러나 이후 P0/P1 고객 여정 plan(`2026-06-09-p0-p1-parallel-implementation.md`)이 신규 도메인 테이블을 추가하면서 **운영(어드민)을 명시적으로 제외**했다. 그 결과 다음 고객 기능들을 운영자가 다룰 화면이 비어 있다:

- **쿠폰** — 운영자가 생성하지 않으면 고객이 코드를 등록해 받을 수 없다.
- **취소/반품 요청** — 고객이 요청해도 운영자가 승인·환불할 경로가 없다.
- **1:1 문의** — 운영자가 답변할 화면이 없다.
- **리뷰** — 부적절 리뷰를 숨기거나 삭제할 수단이 없다.

이 문서는 이 공백을 메우는 어드민 운영 화면을 설계한다. 추가로, 기존 주문관리 화면의 운영 편의(상태 필터·검색·택배 추적·페이지네이션)를 보강한다.

### 현재 코드 전제 (확인됨)

| 자원 | 위치 | 비고 |
|---|---|---|
| 어드민 게이트 | `src/lib/admin/require-admin.ts` (`requireAdmin()`) | `ADMIN_EMAILS` 화이트리스트 |
| 어드민 레이아웃·NAV | `src/app/admin/layout.tsx` | NAV 배열에 항목 추가 |
| 주문 상태 헬퍼 | `src/lib/admin/order-status.ts` | `ORDER_STATUSES/STATUS_LABEL/nextStatuses` |
| 토스 결제 | `src/lib/payments/toss.ts` | `confirmTossPayment`, `getTossSecretKey` 존재 |
| 취소요청 라벨(고객측) | `src/lib/orders/cancellation.ts` | `REQUEST_TYPE_LABEL`, `availableRequestTypes` |
| 쿠폰 자가수령 | `src/db/queries/coupons.ts` (`claimCoupon`) | 고객이 **코드 등록**으로 수령 |
| 스키마(신규) | `coupons`, `user_coupons`, `order_cancellations`, `inquiries`, `reviews` | 아래 §부록 컬럼 표 |

## 1. 설계 결정 (확정)

| 항목 | 결정 | 근거 |
|---|---|---|
| 범위 | 신규 도메인 운영 화면 **전체** + 기존 어드민 **주문관리 UX 보강** | 사용자 합의 |
| 구현 방식 | **도메인별 점진 구현(접근법 A)** — 한 섹션씩 독립 완성·머지 | 토스 환불(최고 위험)을 첫 섹션에서 격리 검증, 나머지는 CRUD 패턴 반복 |
| 취소/반품 환불 | **토스 `cancelPayment` API 자동 연동** (멱등·재고복원·상태전이 트랜잭션) | 운영 자동화, 수동 오류 방지 |
| 리뷰 모더레이션 | reviews에 **`isHidden` 플래그 추가**(숨김/복원) | 삭제 없이 복원 가능·감사이력 유지 |
| 쿠폰 어드민 | **CRUD + 발급/사용 현황 조회** (개별/일괄 발급 제외) | 고객 코드 자가수령 모델로 충분 |
| 주문 UX 보강 | 상태 필터·검색·페이지네이션 + 택배 추적 링크 | 운영 편의 |

## 2. 공통 규약 (기존 어드민 패턴 재사용)

- **게이트:** 모든 어드민 페이지/서버액션 첫 줄 `await requireAdmin()`.
- **계층 분리:** 조회는 `src/db/queries/admin-*.ts`, 데이터 변경은 라우트별 `actions.ts`(`"use server"`), 순수 로직은 `src/lib/**` + Vitest TDD.
- **지연 초기화:** `getDb()` / `env`(Proxy) 패턴 준수 — 모듈 최상위에서 env/db 캡처 금지.
- **디자인:** WSB 쉘 톤(`wsb-green`/`wsb-carbon`/JetBrains Mono), 이모지 금지, 포커스링·접근성 준수, 데이터 친화 테이블 UI.
- **레이아웃:** `src/app/admin/layout.tsx` 의 `NAV` 배열에 다음을 추가한다.
  ```ts
  { href: "/admin/orders/cancellations", label: "취소/반품" },
  { href: "/admin/coupons",   label: "쿠폰관리" },
  { href: "/admin/inquiries", label: "문의관리" },
  { href: "/admin/reviews",   label: "리뷰관리" },
  ```
- **마이그레이션:** 본 작업에서 발생하는 스키마 변경은 **단 하나** — `reviews.isHidden`. 나머지 도메인 테이블은 이미 존재한다.

## 3. 컴포넌트 설계 (Task 단위 — 독립 머지 가능, 순서대로 누적)

### Task 1 — 취소/반품 관리 + 토스 환불 *(먼저: 최고 위험, 격리 검증)*

**목표:** 운영자가 고객의 취소/반품 요청을 검토해 **승인(자동 환불)** 또는 **반려**한다. 승인은 토스 환불·재고 원복·상태 전이를 하나의 멱등 흐름으로 처리한다.

**순수 헬퍼 (TDD)** — `src/lib/orders/cancellation.ts` 확장:
- `ADMIN_CANCELLATION_STATUSES = ["requested", "refunded", "rejected"] as const` + 라벨.
- `nextCancellationStatuses(current): ("refunded"|"rejected")[]` — `requested`만 전이 가능, 그 외 `[]`.
- `refundAmount(order): number` — v1 전체취소 = `order.totalAmount`. (부분취소/부분환불은 비범위.)
- 기존 `REQUEST_TYPE_LABEL`/`availableRequestTypes`는 유지.

**토스 취소 클라이언트** — `src/lib/payments/toss.ts` 에 추가:
- 순수 분리(TDD 가능): `buildTossCancelRequest({ paymentKey, cancelReason, cancelAmount? })` → `{ url, headers, body }` 반환. URL = `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, 인증 헤더는 `getTossSecretKey()` 기반 Basic(`confirmTossPayment`와 동일 규약), body = `{ cancelReason, (cancelAmount) }`.
- 통합 함수: `cancelTossPayment(input)` → 위 빌더로 `fetch`, 응답 파싱(`{ status, cancels?, ... }`), 실패 시 throw.

**서버 액션** — `src/app/admin/orders/cancellations/actions.ts` (`"use server"`):
- `approveCancellation(id: string)`:
  1. `requireAdmin()`.
  2. cancellation(`requested` 한정)·order·payment 조회. 없거나 상태 불일치면 에러.
  3. **멱등 가드:** cancellation이 이미 `refunded`면 no-op 반환.
  4. `cancelTossPayment({ paymentKey: payment.paymentKey, cancelReason: reason })` 호출.
  5. 성공 시 **하나의 트랜잭션**으로:
     - `order_cancellations.status` → `refunded`
     - `orders.status` → `cancelled`
     - **재고 원복:** 해당 주문의 `order_items` 각 행에 대해 `productVariants.stock = stock + quantity` (variantId 기준)
     - `payments.status` → `cancelled`
  6. 토스 호출 실패 시 상태 변경 없이 에러를 화면에 표면화.
  7. `revalidatePath` (목록·상세·주문관리).
- `rejectCancellation(id: string, reason: string)`: `requireAdmin` → `requested`만 `rejected`로 전이 + revalidate.

> **멱등성 근거:** 승인은 `requested → refunded` 전이가 1회만 성공하도록 조건부 업데이트(`where status='requested'`)로 보호한다. 결제 승인 흐름(spec §결제)과 동일한 "조건부 전이 1회 성공" 패턴.

**쿼리** — `src/db/queries/admin-cancellations.ts`:
- `listCancellations(statusFilter?)` — cancellation + order(번호·금액·상태) 조인, 최신순.
- `getCancellation(id)` — 단건 + order + items.

**페이지** — `src/app/admin/orders/cancellations/page.tsx` (force-dynamic):
- 목록 테이블: 요청유형(`REQUEST_TYPE_LABEL`)·사유·주문번호(링크)·환불예정액·상태·요청일.
- 상태 필터(요청/환불완료/반려).
- 인라인 승인/반려: `requested` 행에 server-action `<form>` 버튼(승인) + 반려 사유 입력 폼.

**검증:** cancellation/toss-cancel 빌더 순수 TDD red→green · `tsc` · `build` · 토스 테스트키로 환불 1회 + 멱등 재호출 수동 확인. 커밋: `feat(admin): cancellation/return approval with Toss refund`.

---

### Task 2 — 쿠폰 관리 (CRUD + 현황)

**목표:** 운영자가 쿠폰을 생성·수정·활성화/비활성화하고, 발급/사용 현황을 본다. 고객은 별도 `account/coupons`에서 코드를 등록해 수령한다(기존).

**순수 헬퍼 (TDD)** — `src/lib/admin/coupon-input.ts`:
- `validateCouponInput(input): { ok: true } | { ok: false; error: string }`
  - `discountType ∈ {"amount","rate"}`
  - `rate`면 `1 ≤ discountValue ≤ 100`; `amount`면 `discountValue > 0`
  - `minSubtotal ≥ 0`, `maxDiscount`(있으면) `> 0`
  - 기간 둘 다 있으면 `startsAt ≤ endsAt`
  - `code` 비어있지 않음·형식(영숫자/하이픈, 정규식) — 트림·대문자 정규화 규칙 명시.

**쿼리** — `src/db/queries/admin-coupons.ts`:
- `listCouponsWithStats()` — 각 쿠폰의 `issued = count(user_coupons)`, `used = count(user_coupons where used_at not null)` 집계(서브쿼리 또는 group by 조인).
- `getCoupon(id)`.

**액션** — `src/app/admin/coupons/actions.ts` (`"use server"`):
- `createCoupon(formData)` / `updateCoupon(id, formData)` — `validateCouponInput` 통과 시 insert/update. `code` 유니크 충돌은 사용자 친화 에러로 변환.
- `toggleCoupon(id, isActive)`.
- `deleteCoupon(id)` — ⚠️ `user_coupons` FK가 `onDelete cascade`. **발급이력이 있으면 삭제를 차단하고 비활성화를 안내**(이력 보존). 발급 0건일 때만 hard delete 허용.

**페이지** — `src/app/admin/coupons/page.tsx`:
- 목록: 코드·이름·할인(타입+값)·최소주문·기간·활성·발급/사용 수.
- 생성/수정: client `src/components/admin/coupon-form.tsx` — 필드 전부 렌더(code, name, discountType select, discountValue, minSubtotal, maxDiscount, startsAt, endsAt, isActive). 제출 시 server action 호출.

**검증:** coupon-input TDD · `tsc` · `build` · 수동(쿠폰 생성 → `account/coupons` 코드등록 → 체크아웃 적용까지 1회). 커밋: `feat(admin): coupon CRUD with issuance/usage stats`.

---

### Task 3 — 1:1 문의 관리

**목표:** 운영자가 고객 문의를 읽고 답변한다.

**쿼리** — `src/db/queries/admin-inquiries.ts`:
- `listInquiries(statusFilter?)` — 최신순, `open`/`answered` 필터.
- `getInquiry(id)`.

**액션** — `src/app/admin/inquiries/actions.ts`:
- `answerInquiry(formData: { id, answer })` — `requireAdmin` → `answer` 저장 + `status` `open→answered` + revalidate. (이메일 발송은 비범위; 화면에 "이메일 발송은 별도" 표기.)

**페이지** — `src/app/admin/inquiries/page.tsx`:
- 목록: 카테고리·제목·작성자(email)·상태·일시. 미답변/답변완료 필터.
- 상세(또는 행 확장): 본문 + 답변 textarea + 저장. 답변 완료 건은 기존 답변 표시.

**검증:** `tsc` · `build` · 수동(문의 생성 → 답변 → 상태 전환). 커밋: `feat(admin): 1:1 inquiry answering`.

---

### Task 4 — 리뷰 관리 *(스키마 변경)*

**목표:** 운영자가 리뷰를 숨김/복원/삭제한다. 숨긴 리뷰는 고객 화면(PDP 평점·목록)에서 제외된다.

**스키마 변경:** `src/db/schema/reviews.ts` 에 `isHidden: boolean("is_hidden").notNull().default(false)` 추가. 배럴 영향 없음(이미 export). `src/db/schema/schema.test.ts` 형상 테스트에 `reviews.isHidden` 단언 추가. `db:generate`(다음 순번 `00NN_*`) → `db:migrate`.

**⚠️ 크로스 영향 (필수):** `src/db/queries/reviews.ts` 의 PDP용 조회·집계(평균 평점·리뷰 목록·개수)가 **`isHidden = false` 만** 포함하도록 `where` 조건 추가. 관련 기존 테스트(`reviews` 집계)도 숨김 제외를 반영하도록 갱신/추가.

**쿼리** — `src/db/queries/admin-reviews.ts`:
- `listReviewsAdmin(filter?: { productId?; rating?; hidden? }, page)` — 상품명 조인, 페이지네이션(offset/limit).

**액션** — `src/app/admin/reviews/actions.ts`:
- `hideReview(id)` / `unhideReview(id)` / `deleteReview(id)` — 각 작업 후 해당 상품 PDP·`/products` revalidate.

**페이지** — `src/app/admin/reviews/page.tsx`:
- 목록: 상품·평점·작성자·내용 미리보기·이미지 수·숨김상태·일시 + 숨김/복원/삭제 버튼. 숨김여부·평점·상품 필터.

**검증:** reviews 집계 isHidden 반영 TDD · 형상 테스트 · `db:migrate` · `tsc` · `build` · 수동(숨김 → PDP에서 사라짐 확인). 커밋: `feat(admin): review moderation (hide/restore/delete) + isHidden`.

---

### Task 5 — 주문 관리 UX 보강 *(기존 보강)*

**목표:** 주문 목록을 상태로 거르고 검색·페이지네이션하며, 상세에서 택배 추적 링크를 제공한다.

**순수 헬퍼 (TDD)** — `src/lib/orders/tracking.ts`:
- `trackingUrl(courier: string, trackingNumber: string): string | null` — 주요 택배사(CJ대한통운·한진택배·우체국택배·롯데택배 등) 코드→조회 URL 매핑에 `trackingNumber` 삽입. 미지원 택배사·빈 송장은 `null`.

**쿼리** — `src/db/queries/admin-orders.ts` `listAllOrders` 확장:
- 인자 `{ status?, q?, page? }` — `status` 필터, `q`(주문번호/주문자명) `ilike` 검색, `limit/offset` 페이지네이션. 총 건수도 반환(페이지 계산용).

**페이지** — `src/app/admin/orders/page.tsx` (force-dynamic):
- 상단 상태 필터 탭(`STATUS_LABEL`) + 검색창 + 페이지네이션. `searchParams` 기반.
- 주문 상세(`[orderNumber]/page.tsx`): 송장이 있으면 `trackingUrl(...)` 로 "배송조회" 외부 링크 노출(없으면 텍스트만).

**(선택) 대시보드 미처리 카드:** `src/app/admin/page.tsx` 에 "미답변 문의 수", "대기 취소요청 수" KPI 추가(가벼우면 포함, 비싸면 후속).

**검증:** tracking TDD · `tsc` · `build` · 수동(필터·검색·페이지네이션·추적링크). 커밋: `feat(admin): order list filter/search/pagination + tracking link`.

## 4. 테스트·검증 전략

- **순수 도메인 로직 TDD (red→green):** cancellation 전이/환불액 · toss cancel 요청 빌더 · coupon-input 검증 · tracking URL · reviews 집계 isHidden 반영.
- **인증/DB/서버액션/PG 호출:** jsdom 단위테스트 부적합 → `npx tsc --noEmit` + `npm run build` + 시드 DB 수동 검증(어드민 로그인).
- **토스 환불:** 테스트 시크릿키로 실제 취소 1회 + **멱등 재호출**(두 번째는 no-op) 수동 확인.
- 각 Task 종료 시 `npx vitest run` 전체 통과 후 커밋.

## 5. 리스크 / 주의

- **토스 환불 실패 경로:** 네트워크/PG 오류 시 상태를 바꾸지 않고 에러 표면화 — 부분 상태(환불됐는데 DB 미반영) 방지가 핵심. 토스 호출 성공 후 DB 트랜잭션이 실패하면 운영자가 재시도해도 멱등 가드로 이중환불 없음(이미 토스에서 cancelled → 두 번째 토스 호출은 토스가 거부; DB는 그때 정합화). 이 경계를 액션 주석으로 명시.
- **쿠폰 삭제 vs 비활성화:** `user_coupons` cascade로 발급이력 유실 위험 → 발급 존재 시 삭제 차단.
- **리뷰 isHidden 누락 위험:** PDP 집계에 `isHidden=false` 필터를 빠뜨리면 숨김이 무력화 → 크로스 영향으로 명시하고 테스트로 고정.
- **취소 가능 상태:** 고객측 `availableRequestTypes`는 `paid/preparing→cancel`, `shipped/delivered→exchange/return`. 어드민 승인은 요청 존재(`requested`) 기준으로 처리하되, 이미 `cancelled`/`delivered` 주문의 모순 요청은 반려 유도.
- **부분취소/부분환불 비범위:** v1은 전체취소·전액환불만. order_items 단위 부분취소는 후속.

## 6. 비범위 (후속)

부분취소/부분환불 · 교환 물류(반송 송장) · 쿠폰 개별/일괄 발급(`user_coupons` 직접 주입) · 문의 답변 이메일 발송 · 리뷰 운영자 답글 · 권한 세분화(마스터/매니저) · CSV 내보내기 · 이미지 Supabase Storage 업로드(상품).

## 부록 A. 관련 스키마 컬럼 (확인된 현재 상태)

| 테이블 | 핵심 컬럼 |
|---|---|
| `coupons` | code(unique)·name·discountType·discountValue·minSubtotal·maxDiscount·startsAt·endsAt·isActive |
| `user_coupons` | couponId(FK cascade)·userId·usedAt·orderId · unique(couponId,userId) |
| `order_cancellations` | orderId(FK cascade)·userId·type·reason·status(default `requested`,len12) |
| `inquiries` | userId?·email·category·subject·body·status(default `open`)·answer? |
| `reviews` | productId·userId·orderId·rating·title?·body·images(jsonb) · unique(orderId,productId) · **+isHidden(신규)** |
| `order_items` | orderId·productId·variantId·productName·variantName·unitPrice·quantity·lineTotal |
| `payments` | orderId·paymentKey(unique)·method?·amount·status |

## 부록 B. 신규/수정 파일 맵

```
신규:
  src/lib/admin/coupon-input.ts (+ .test.ts)
  src/lib/orders/tracking.ts (+ .test.ts)
  src/db/queries/admin-cancellations.ts
  src/db/queries/admin-coupons.ts
  src/db/queries/admin-inquiries.ts
  src/db/queries/admin-reviews.ts
  src/app/admin/orders/cancellations/page.tsx + actions.ts
  src/app/admin/coupons/page.tsx + actions.ts
  src/app/admin/inquiries/page.tsx + actions.ts
  src/app/admin/reviews/page.tsx + actions.ts
  src/components/admin/coupon-form.tsx

수정:
  src/lib/orders/cancellation.ts (+ .test.ts)   # 어드민 전이/환불액
  src/lib/payments/toss.ts                       # buildTossCancelRequest + cancelTossPayment
  src/db/schema/reviews.ts                        # isHidden
  src/db/schema/schema.test.ts                    # isHidden 단언
  src/db/queries/reviews.ts                       # PDP 집계 isHidden=false 필터
  src/db/queries/admin-orders.ts                  # 필터/검색/페이지네이션
  src/app/admin/orders/page.tsx                   # 필터/검색/페이지네이션 UI
  src/app/admin/orders/[orderNumber]/page.tsx     # 추적 링크
  src/app/admin/layout.tsx                        # NAV 항목 추가
  src/app/admin/page.tsx                          # (선택) 미처리 카운트 카드
  drizzle/00NN_*.sql                              # reviews.isHidden 마이그레이션
```
