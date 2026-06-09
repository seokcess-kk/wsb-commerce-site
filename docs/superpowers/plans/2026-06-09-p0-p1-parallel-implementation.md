# P0 + P1 Customer Journey Features — Parallel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 갭 분석(`docs/superpowers/specs/2026-06-09-customer-journey-gap-analysis.md`)의 P0 4건 + P1 13건을 충돌 없이 병렬 구현한다.

**Architecture:** 공유 자원(신규 DB 테이블·가격/할인 헬퍼·크로스-스트림 컴포넌트 계약)을 **Phase 0 Foundation**에서 단일 마이그레이션으로 먼저 확정한다. 이후 7개 워크스트림(A~G)을 각각 git worktree에서 **병렬** 구현한다 — 각 스트림은 자기 소유 파일만 수정하고, 핫스팟 페이지(PDP·체크아웃·마이페이지)에 들어갈 기능은 **독립 컴포넌트 + 합의된 인터페이스(stub)** 로 만든다. **Phase 2 Integration**에서 stub을 실제 컴포넌트로 교체하고 핫스팟 페이지를 조립한다.

**Tech Stack:** Next.js 16 App Router(Server Components/Actions) · Drizzle ORM + postgres-js · Supabase Auth · 토스페이먼츠 · Tailwind v4 · Vitest. 가격은 정수(원). 지연 초기화 패턴(`getDb()`/`env`) 준수.

---

## 병렬화 전략 & 의존성 그래프

```
        ┌─────────────────────────────────────────────┐
        │  Phase 0  FOUNDATION (순차, 단일 PR)          │
        │  - 신규 스키마 7테이블 + orders 컬럼 추가      │
        │  - 단일 마이그레이션 생성/적용                  │
        │  - 가격/할인/배송 헬퍼 확장 (pure, TDD)        │
        │  - 크로스-스트림 컴포넌트 stub + 타입 계약      │
        └─────────────────────────────────────────────┘
                          │ (모든 스트림이 이 계약에 의존)
   ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
   ▼          ▼          ▼          ▼          ▼          ▼          ▼
  [A]        [B]        [C]        [D]        [E]        [F]        [G]
 카탈로그   체크아웃   주문/이행  계정/위시  리뷰       쿠폰       인증/문의
 (PDP/PLP)  /장바구니  셀프서비스  /주소록
   └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                          │ (각 worktree 독립 진행)
        ┌─────────────────────────────────────────────┐
        │  Phase 2  INTEGRATION (순차)                  │
        │  - PDP에 갤러리/수량/리뷰/위시 조립            │
        │  - 체크아웃에 주소선택/쿠폰/약관 조립          │
        │  - 마이페이지 요약 + 위시/쿠폰/문의 링크        │
        │  - stub → 실제 컴포넌트 교체, 전체 테스트       │
        └─────────────────────────────────────────────┘
```

**즉시 병렬 시작 가능(Foundation 직후):** A, C, D, E, F, G 는 자기 소유 파일에서 독립 진행. B는 D(AddressSelector)·F(CouponField)·G(약관) 의 **stub**에 기대어 진행하다 Integration에서 실물 연결.

**스트림 ↔ 핫스팟 결합 해소:** PDP(A 소유)는 `<ReviewSummary>`(E)·`<WishlistButton>`(D)을 import한다. Foundation이 두 컴포넌트의 **stub**(올바른 시그니처, "준비중" 렌더)을 미리 만들어 A가 컴파일·진행 가능. E/D는 같은 경로 파일을 자기 worktree에서 실제 구현으로 채운다. Integration 머지 시 실물이 stub을 대체.

---

## 파일 구조 & 소유권 맵

| 영역 | 파일 | 소유 스트림 |
|---|---|---|
| 신규 스키마 | `src/db/schema/{reviews,wishlists,coupons,user-coupons,addresses,inquiries,order-cancellations}.ts` | Phase 0 |
| 스키마 배럴 | `src/db/schema/index.ts` (append) | Phase 0 |
| orders 컬럼 | `src/db/schema/orders.ts` (couponCode/couponDiscount 추가) | Phase 0 |
| 가격/할인 헬퍼 | `src/lib/checkout/pricing.ts`, `discount.ts` | Phase 0 |
| 리뷰 집계 헬퍼 | `src/lib/reviews/aggregate.ts` | Phase 0(헬퍼)·E(소비) |
| 컴포넌트 stub+계약 | `src/components/{reviews/review-summary,reviews/review-list,wishlist/wishlist-button,checkout/coupon-field,checkout/address-selector}.tsx` | Phase 0(stub)→ 소유 스트림(실물) |
| 카탈로그 | `products/page.tsx`, `category/[slug]/page.tsx`, `products/[slug]/page.tsx`, `components/catalog/*`, `db/queries/products.ts`, `lib/catalog/sort.ts` | A |
| 체크아웃/장바구니 | `checkout/page.tsx`, `components/cart/cart-view.tsx`, `api/orders/route.ts`, `components/checkout/*` | B |
| 주문 셀프서비스 | `account/orders/**`, `order-lookup/page.tsx`, `db/queries/orders.ts`, `lib/orders/cancellation.ts`, `*/actions.ts` | C |
| 계정/위시/주소 | `account/page.tsx`, `account/addresses/**`, `account/wishlist/**`, `db/queries/{addresses,wishlists}.ts`, `lib/account/address.ts` | D |
| 리뷰 | `account/reviews/**`, `db/queries/reviews.ts`, `components/reviews/*`(실물) | E |
| 쿠폰 | `account/coupons/**`, `db/queries/coupons.ts`, `components/checkout/coupon-field.tsx`(실물), `db/seed-coupons` | F |
| 인증/문의 | `login`, `signup`, `auth/reset/**`, `support/inquiry/**`, `account/inquiries/**`, `components/auth/*`, `db/queries/inquiries.ts` | G |

**충돌 지점과 해소:**
- `schema/index.ts` 배럴, `orders.ts` 컬럼 → **Phase 0에서만** 수정(이후 동결).
- `pricing.ts` → Phase 0에서 확장 후 동결. B/F는 읽기만.
- PDP/체크아웃/마이페이지 페이지 본문 → **Phase 2에서만** 조립(스트림은 컴포넌트만 생산).
- `api/orders/route.ts` → B가 소유. 쿠폰 금액 계산은 Phase 0 `discount.ts` 헬퍼로 위임해 F와 분리.

---

## Phase 0 — FOUNDATION (순차)

소유: 단일 작업자/세션. 완료 후 커밋·머지해야 스트림들이 시작한다.

### Task 0.1: 리뷰 테이블

**Files:**
- Create: `src/db/schema/reviews.ts`
- Modify: `src/db/schema/index.ts`
- Test: `src/db/schema/schema.test.ts` (기존 파일에 추가)

- [ ] **Step 1: Write the failing test**

`src/db/schema/schema.test.ts` 에 추가:

```ts
import { reviews } from "./reviews";

it("reviews 테이블은 평점/본문/구매검증 컬럼을 가진다", () => {
  const cols = Object.keys(reviews);
  expect(cols).toEqual(
    expect.arrayContaining(["id", "productId", "userId", "orderId", "rating", "title", "body", "images", "createdAt"]),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/db/schema/schema.test.ts`
Expected: FAIL — `Cannot find module './reviews'`

- [ ] **Step 3: Write minimal implementation**

`src/db/schema/reviews.ts`:

```ts
import { pgTable, uuid, varchar, integer, text, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { products } from "./products";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  orderId: uuid("order_id").notNull(),
  rating: integer("rating").notNull(),
  title: varchar("title", { length: 120 }),
  body: text("body").notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  // 주문 1건당 상품별 리뷰 1개(구매검증 리뷰)
  uniquePerPurchase: unique().on(t.orderId, t.productId),
}));
```

`src/db/schema/index.ts` 끝에 추가: `export * from "./reviews";`

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/db/schema/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/db/schema/reviews.ts src/db/schema/index.ts src/db/schema/schema.test.ts
git commit -m "feat(schema): add reviews table"
```

### Task 0.2: 위시리스트 테이블

**Files:** Create `src/db/schema/wishlists.ts`; Modify `index.ts`; Test in `schema.test.ts`

- [ ] **Step 1: 실패 테스트** — `wishlists` 컬럼 `["id","userId","productId","createdAt"]` 포함 단언.
- [ ] **Step 2: 실패 확인** (`Cannot find module './wishlists'`).
- [ ] **Step 3: 구현**

```ts
import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { products } from "./products";

export const wishlists = pgTable("wishlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniquePerUser: unique().on(t.userId, t.productId) }));
```
배럴에 `export * from "./wishlists";`

- [ ] **Step 4: PASS 확인**
- [ ] **Step 5: Commit** `feat(schema): add wishlists table`

### Task 0.3: 쿠폰 + 발급내역 테이블

**Files:** Create `src/db/schema/coupons.ts`, `src/db/schema/user-coupons.ts`; Modify `index.ts`; Test in `schema.test.ts`

- [ ] **Step 1: 실패 테스트** — `coupons` 가 `["id","code","name","discountType","discountValue","minSubtotal","maxDiscount","startsAt","endsAt","isActive"]`, `userCoupons` 가 `["id","couponId","userId","usedAt","orderId"]` 포함.
- [ ] **Step 2: 실패 확인**
- [ ] **Step 3: 구현**

`src/db/schema/coupons.ts`:
```ts
import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  discountType: varchar("discount_type", { length: 10 }).notNull(), // 'fixed' | 'percent'
  discountValue: integer("discount_value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  maxDiscount: integer("max_discount"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

`src/db/schema/user-coupons.ts`:
```ts
import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { coupons } from "./coupons";

export const userCoupons = pgTable("user_coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  couponId: uuid("coupon_id").notNull().references(() => coupons.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  orderId: uuid("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniqueClaim: unique().on(t.couponId, t.userId) }));
```
배럴에 두 줄 추가.

- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(schema): add coupons and user_coupons tables`

### Task 0.4: 주소록 테이블

**Files:** Create `src/db/schema/addresses.ts`; Modify `index.ts`; Test in `schema.test.ts`

- [ ] **Step 1–2:** 실패 테스트(`addresses` 가 `["id","userId","label","recipient","phone","zipcode","address1","address2","isDefault"]` 포함) → 실패 확인.
- [ ] **Step 3: 구현**
```ts
import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  label: varchar("label", { length: 40 }),
  recipient: varchar("recipient", { length: 80 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  zipcode: varchar("zipcode", { length: 12 }).notNull(),
  address1: text("address1").notNull(),
  address2: text("address2"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(schema): add addresses table`

### Task 0.5: 1:1 문의 테이블

**Files:** Create `src/db/schema/inquiries.ts`; Modify `index.ts`; Test in `schema.test.ts`

- [ ] **Step 1–2:** 실패 테스트(`["id","userId","email","category","subject","body","status","answer","createdAt"]`) → 실패.
- [ ] **Step 3: 구현**
```ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),                 // 비회원 문의 허용 → nullable
  email: varchar("email", { length: 200 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  subject: varchar("subject", { length: 160 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 12 }).notNull().default("open"), // 'open' | 'answered'
  answer: text("answer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(schema): add inquiries table`

### Task 0.6: 취소/교환/반품 요청 테이블

**Files:** Create `src/db/schema/order-cancellations.ts`; Modify `index.ts`; Test in `schema.test.ts`

- [ ] **Step 1–2:** 실패 테스트(`["id","orderId","userId","type","reason","status","createdAt"]`) → 실패.
- [ ] **Step 3: 구현**
```ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const orderCancellations = pgTable("order_cancellations", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  type: varchar("type", { length: 10 }).notNull(),   // 'cancel' | 'exchange' | 'return'
  reason: text("reason").notNull(),
  status: varchar("status", { length: 12 }).notNull().default("requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(schema): add order_cancellations table`

### Task 0.7: orders 에 쿠폰 컬럼 추가

**Files:** Modify `src/db/schema/orders.ts`; Test in `schema.test.ts`

- [ ] **Step 1:** 실패 테스트 — `orders` 컬럼에 `couponCode`, `couponDiscount` 포함 단언.
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3:** `orders.ts` 의 `trackingNumber` 아래에 추가:
```ts
  couponCode: varchar("coupon_code", { length: 40 }),
  couponDiscount: integer("coupon_discount").notNull().default(0),
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(schema): add coupon columns to orders`

### Task 0.8: 단일 마이그레이션 생성·적용

**Files:** Create `drizzle/0006_*.sql` (생성됨)

- [ ] **Step 1:** `npm run db:generate` 실행 — 7개 신규 테이블 + orders 2컬럼이 한 마이그레이션에 모여야 함.
- [ ] **Step 2:** 생성된 `drizzle/0006_*.sql` 을 열어 7 `CREATE TABLE` + `ALTER TABLE orders ADD COLUMN` 2건 확인(수동 편집 금지).
- [ ] **Step 3:** `npm run db:migrate` 로 적용.
- [ ] **Step 4:** `npx vitest run src/db/schema/schema.test.ts` PASS 확인.
- [ ] **Step 5: Commit** `chore(db): migration for p0/p1 tables`

### Task 0.9: 할인 헬퍼 (pure, TDD)

**Files:** Create `src/lib/checkout/discount.ts`; Test `src/lib/checkout/discount.test.ts`

- [ ] **Step 1: 실패 테스트**
```ts
import { describe, it, expect } from "vitest";
import { couponDiscount, type CouponRule } from "./discount";

const fixed: CouponRule = { discountType: "fixed", discountValue: 3000, minSubtotal: 0, maxDiscount: null };
const pct: CouponRule = { discountType: "percent", discountValue: 10, minSubtotal: 30000, maxDiscount: 5000 };

describe("couponDiscount", () => {
  it("정액 할인은 고정 금액", () => expect(couponDiscount(20000, fixed)).toBe(3000));
  it("최소주문 미달이면 0", () => expect(couponDiscount(20000, pct)).toBe(0));
  it("정률 할인 + 상한 적용", () => expect(couponDiscount(80000, pct)).toBe(5000)); // 8000 → 5000 cap
  it("정률 할인 상한 이하", () => expect(couponDiscount(40000, pct)).toBe(4000));
  it("할인은 소계를 넘지 않음", () => expect(couponDiscount(2000, fixed)).toBe(2000));
});
```
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3: 구현**
```ts
export type CouponRule = {
  discountType: "fixed" | "percent";
  discountValue: number;
  minSubtotal: number;
  maxDiscount: number | null;
};

export function couponDiscount(subtotal: number, c: CouponRule): number {
  if (subtotal < c.minSubtotal) return 0;
  const raw = c.discountType === "percent"
    ? Math.floor((subtotal * c.discountValue) / 100)
    : c.discountValue;
  const capped = c.maxDiscount != null ? Math.min(raw, c.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(pricing): coupon discount helper`

### Task 0.10: 배송비/총액 확장 + 무료배송 진행률 (pure, TDD)

**Files:** Modify `src/lib/checkout/pricing.ts`; Test `src/lib/checkout/pricing.test.ts` (기존에 추가)

**설계 결정:** 무료배송 기준·배송비는 **할인 적용 후 소계**(실제 상품 결제액) 기준으로 계산한다.

- [ ] **Step 1: 실패 테스트** (기존 파일에 추가)
```ts
import { freeShippingProgress, orderTotal } from "./pricing";

describe("orderTotal with discount", () => {
  it("할인 없을 때 기존과 동일", () => expect(orderTotal(20000)).toBe(23000));
  it("할인 후 5만원 미만이면 배송비 부과", () => expect(orderTotal(52000, 5000)).toBe(47000 + 3000));
  it("할인 후에도 5만원 이상이면 무료배송", () => expect(orderTotal(60000, 5000)).toBe(55000));
});

describe("freeShippingProgress", () => {
  it("빈 장바구니", () => expect(freeShippingProgress(0)).toEqual({ qualified: false, remaining: 50000 }));
  it("임박", () => expect(freeShippingProgress(45000)).toEqual({ qualified: false, remaining: 5000 }));
  it("달성", () => expect(freeShippingProgress(50000)).toEqual({ qualified: true, remaining: 0 }));
});
```
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3: 구현** — `pricing.ts` 의 `orderTotal` 교체 + `freeShippingProgress` 추가:
```ts
export function orderTotal(subtotal: number, discount = 0): number {
  const discounted = Math.max(0, subtotal - discount);
  return discounted + shippingFee(discounted);
}

export function freeShippingProgress(subtotal: number): { qualified: boolean; remaining: number } {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return { qualified: true, remaining: 0 };
  return { qualified: false, remaining: FREE_SHIPPING_THRESHOLD - Math.max(0, subtotal) };
}
```
- [ ] **Step 4: PASS** (기존 `orderTotal(subtotal)` 호출부는 default 인자로 호환) · **Step 5: Commit** `feat(pricing): discount-aware total and free-shipping progress`

### Task 0.11: 리뷰 집계 헬퍼 (pure, TDD)

**Files:** Create `src/lib/reviews/aggregate.ts`; Test `src/lib/reviews/aggregate.test.ts`

- [ ] **Step 1: 실패 테스트**
```ts
import { aggregateRatings } from "./aggregate";
it("빈 배열은 0/0", () => expect(aggregateRatings([])).toEqual({ count: 0, average: 0 }));
it("평균은 소수 1자리 반올림", () => expect(aggregateRatings([5, 4, 4])).toEqual({ count: 3, average: 4.3 }));
```
- [ ] **Step 2:** 실패 확인.
- [ ] **Step 3: 구현**
```ts
export function aggregateRatings(ratings: number[]): { count: number; average: number } {
  if (ratings.length === 0) return { count: 0, average: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { count: ratings.length, average: Math.round((sum / ratings.length) * 10) / 10 };
}
```
- [ ] **Step 4: PASS** · **Step 5: Commit** `feat(reviews): rating aggregate helper`

### Task 0.12: 크로스-스트림 컴포넌트 stub + 계약

각 스트림이 컴파일·진행할 수 있도록 **올바른 props 시그니처의 "준비중" stub** 을 생성한다. 실물은 소유 스트림이 같은 경로에서 교체한다.

**Files (모두 Create):**
- `src/components/wishlist/wishlist-button.tsx` (D가 실물화)
- `src/components/reviews/review-summary.tsx`, `review-list.tsx` (E가 실물화)
- `src/components/checkout/coupon-field.tsx` (F가 실물화)
- `src/components/checkout/address-selector.tsx` (D가 실물화)

- [ ] **Step 1: stub 작성** (테스트 불필요 — 계약 고정용)
```tsx
// wishlist-button.tsx
"use client";
export function WishlistButton({ productId, initialActive = false }: { productId: string; initialActive?: boolean }) {
  return <button type="button" data-product={productId} aria-pressed={initialActive} className="text-stone-300" disabled>♡</button>;
}
```
```tsx
// review-summary.tsx
export function ReviewSummary({ productId }: { productId: string }) {
  return <div data-product={productId} className="text-sm text-stone-400">리뷰 준비중</div>;
}
// review-list.tsx
export function ReviewList({ productId }: { productId: string }) {
  return <div data-product={productId} className="text-sm text-stone-400">리뷰 준비중</div>;
}
```
```tsx
// coupon-field.tsx
"use client";
export function CouponField({ subtotal, onApply }: { subtotal: number; onApply: (discount: number, code: string) => void }) {
  void subtotal; void onApply;
  return <div className="text-sm text-stone-400">쿠폰 적용 준비중</div>;
}
```
```tsx
// address-selector.tsx
"use client";
import type { CheckoutAddress } from "@/lib/account/address-types";
export function AddressSelector({ onSelect }: { onSelect: (a: CheckoutAddress) => void }) {
  void onSelect;
  return <div className="text-sm text-stone-400">배송지 불러오기 준비중</div>;
}
```
- [ ] **Step 2: 공유 타입 생성** `src/lib/account/address-types.ts`:
```ts
export type CheckoutAddress = {
  recipient: string; phone: string; zipcode: string; address1: string; address2: string | null;
};
```
- [ ] **Step 3: 타입체크** Run: `npx tsc --noEmit` Expected: 에러 없음.
- [ ] **Step 4: Commit** `feat(ui): cross-stream component stubs and contracts`

> **Phase 0 종료 게이트:** `npm test` 와 `npx tsc --noEmit` 모두 통과해야 한다. 이 시점의 커밋을 각 스트림 worktree의 분기점으로 삼는다.

---

## Phase 1 — 병렬 워크스트림

각 스트림은 `superpowers:using-git-worktrees` 로 격리된 worktree에서 진행한다. 스트림 내부는 TDD(테스트 우선)·단일 커밋 단위를 지킨다. 아래는 각 스트림의 **범위·소유 파일·계약·태스크**. (UI/CRUD 단위 태스크는 subagent-driven-development가 test→impl→commit 5스텝으로 전개)

### 워크스트림 A — 카탈로그 & PDP 전환요소
**범위:** P0-1 PDP 이미지 갤러리 · P1 PDP 수량 선택 · P1 PLP 정렬 · P1 PLP 속성 필터
**소유 파일:** `app/products/page.tsx`, `app/category/[slug]/page.tsx`, `app/products/[slug]/page.tsx`(갤러리·수량 영역만), `components/catalog/*`, `db/queries/products.ts`, `lib/catalog/sort.ts`(신규), `components/cart/add-to-cart-button.tsx`(수량)
**소비 계약:** `<ReviewSummary productId>`, `<WishlistButton productId>` (stub) 을 PDP에 자리만 배치 — 실물 연결은 Phase 2.

- [ ] **A1. 정렬 헬퍼(pure, TDD)** — `lib/catalog/sort.ts`: `SORT_OPTIONS = ["newest","price_asc","price_desc","name"]`, `sortProductSummaries(items, key)` 순수 정렬. 테스트: 각 키별 정렬 결과 단언.
- [ ] **A2. 가격범위 필터 헬퍼(pure, TDD)** — `filterByPrice(items, min, max)`. 테스트: 경계 포함/제외.
- [ ] **A3. PLP 쿼리 확장** — `db/queries/products.ts` 에 `listPublishedProducts` 가 `{ sort?, minPrice?, maxPrice?, categorySlug? }` 옵션을 받도록 확장(기존 무인자 호출 호환). DB `orderBy`는 정렬키 매핑, 가격은 `gte/lte`. 헬퍼 재사용.
- [ ] **A4. PLP UI** — `products/page.tsx`·`category/[slug]/page.tsx` 에 정렬 드롭다운(쿼리스트링 `?sort=`) + 가격대 필터(프리셋 칩 `~1만/1~3만/3만~`) + 결과 수 표시 + 빈 결과 처리. searchParams 기반 Server Component.
- [ ] **A5. 상품 이미지 갤러리 컴포넌트** — `components/catalog/product-gallery.tsx`(client): `images: string[]` 받아 메인+썸네일, 빈 배열이면 brand zone placeholder 유지. `next/image` 사용(`node_modules/next/dist/docs/` 이미지 가이드 확인). 테스트(RTL): 이미지 N개 렌더, 썸네일 클릭 시 메인 교체.
- [ ] **A6. PDP 갤러리 적용** — `products/[slug]/page.tsx` 의 placeholder 박스를 `<ProductGallery images={product.images} fallbackLabel={product.name} isNutrogin={product.isNutrogin} />` 로 교체.
- [ ] **A7. 수량 선택** — `add-to-cart-button.tsx` 에 수량 stepper(min 1, 재고 상한) 추가, `add({...item, quantity})`. 테스트: 수량 증가 후 담기 시 quantity 반영.
- [ ] **A8. PDP 리뷰/위시 자리 배치** — PDP에 `<WishlistButton productId={product.id} />`(가격 옆), `<ReviewSummary productId={product.id} />`(제목 아래), `<ReviewList productId={product.id} />`(하단) stub 임포트·배치. (실물은 Phase 2 머지로 자동 대체)

### 워크스트림 B — 체크아웃 & 장바구니 완성도
**범위:** P0-2 주문상품 목록 · P0-3 우편번호/주소 검색 · P1 약관 동의 분리 · P1 무료배송 임박 안내
**소유 파일:** `app/checkout/page.tsx`, `components/cart/cart-view.tsx`, `app/api/orders/route.ts`, `components/checkout/postcode-search.tsx`(신규), `components/checkout/terms-agreement.tsx`(신규)
**소비 계약:** `<AddressSelector>`(D stub), `<CouponField>`(F stub) 자리 배치 — 실물 Phase 2.

- [ ] **B1. 우편번호 검색 컴포넌트** — `components/checkout/postcode-search.tsx`(client): Daum 우편번호 서비스(`//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`) 동적 로드, 선택 시 `{ zipcode, address1 }` 콜백. 스크립트 1회 로드 가드. 테스트(RTL): 버튼 렌더 + 콜백 시그니처(로더는 mock).
- [ ] **B2. 체크아웃 폼 재구성** — `checkout/page.tsx`: 주소를 `우편번호+기본주소(읽기전용)+상세주소` 3필드로 분리, `shippingZipcode` 수집. `<PostcodeSearch onComplete=...>` 연결. `<AddressSelector onSelect>`(stub) 배치.
- [ ] **B3. 주문상품 목록 패널** — 체크아웃에 `useCart().items` 로 품목명·옵션·수량·금액 리스트 + 소계/배송비/(할인 자리)/총액 요약. `freeShippingProgress` 로 "N원 더 담으면 무료배송" 안내.
- [ ] **B4. 약관 동의 분리** — `components/checkout/terms-agreement.tsx`: [전체동의] + 개별(필수: 구매조건/개인정보 제3자 제공, 선택: 마케팅) 체크박스, 필수 미동의 시 결제 버튼 비활성. 순수 검증 `allRequiredAgreed(state)` TDD. 결제 진입 가드에 연결.
- [ ] **B5. 장바구니 무료배송 안내** — `cart-view.tsx` 요약 패널에 `freeShippingProgress` 안내 + 진행 바.
- [ ] **B6. 주문 API 할인 수용** — `api/orders/route.ts`: body에 `couponCode?` 수용 시 서버에서 쿠폰 조회→`couponDiscount()` 재계산(클라 금액 불신), `orderTotal(subtotal, discount)` 로 총액, orders에 `couponCode/couponDiscount` 저장. 쿠폰 없으면 기존 경로. (F의 검증 로직은 Phase 2에서 합류, 여기선 헬퍼만 사용)

### 워크스트림 C — 주문 셀프서비스 & 이행
**범위:** P0-4 재구매 버튼 · P1 취소/교환/반품 요청 · P1 주문 상태별 필터 · P1 비회원 주문조회
**소유 파일:** `app/account/page.tsx`(상태필터 영역), `app/account/orders/[orderNumber]/page.tsx`, `app/account/orders/[orderNumber]/actions.ts`(신규), `app/order-lookup/page.tsx`(신규), `db/queries/orders.ts`, `lib/orders/cancellation.ts`(신규), `lib/cart/reorder.ts`(신규)

- [ ] **C1. 청약철회 가능 타입(pure, TDD)** — `lib/orders/cancellation.ts`: `availableRequestTypes(status)` → paid/preparing→`["cancel"]`, shipped/delivered→`["exchange","return"]`, 그 외 `[]`. 테스트 각 분기.
- [ ] **C2. 재구매 변환(pure, TDD)** — `lib/cart/reorder.ts`: `orderItemsToCartItems(items)` → `CartItem[]`(productSlug 포함 위해 쿼리에서 slug 조인 필요 → C4에서 detail 쿼리에 slug 추가). 테스트: 매핑·수량 보존.
- [ ] **C3. 취소요청 서버액션** — `actions.ts`: `requestCancellation(orderId, type, reason)` → `requireUser`, 소유·상태 검증(`availableRequestTypes`), `orderCancellations` insert. 테스트는 헬퍼 단위(C1)로 커버, 액션은 통합.
- [ ] **C4. 주문상세 UI** — 상태별 가능한 요청 버튼 + 사유 폼 + 요청 내역 표시. 택배사 추적 링크(`courier`별 URL 매핑 `lib/orders/courier.ts`, 모르면 텍스트). "재주문" 버튼 → `reorder` 로 장바구니 채우고 `/cart` 이동(client island).
- [ ] **C5. 마이페이지 상태 필터** — `account/page.tsx` 주문 리스트에 상태 탭(`?status=`) + `listOrdersByUser` 에 상태 필터 옵션.
- [ ] **C6. 비회원 주문조회** — `app/order-lookup/page.tsx`: 주문번호+이메일 폼 → `getGuestOrder(orderNumber, email)`(정확 일치, 불일치 시 동일 일반 에러로 열거 방지). 결과는 주문상세 요약 재사용. `support` FAQ 링크 연결.

### 워크스트림 D — 계정·위시리스트·주소록
**범위:** P1 배송지 관리(주소록) + 마이페이지 요약 카드 · P1 위시리스트
**소유 파일:** `app/account/page.tsx`(요약 카드 영역 — C와 분리: D는 상단 요약 카드, C는 주문 리스트), `app/account/addresses/**`, `app/account/wishlist/**`, `db/queries/addresses.ts`, `db/queries/wishlists.ts`, `lib/account/address.ts`, `components/wishlist/wishlist-button.tsx`(실물), `components/checkout/address-selector.tsx`(실물)

> **A/C/D의 `account/page.tsx` 공유:** D는 **상단 요약 카드 컴포넌트** `components/account/account-summary.tsx` 만 생산. 페이지 본문 조립은 Phase 2.

- [ ] **D1. 기본배송지 토글(pure, TDD)** — `lib/account/address.ts`: `applyDefault(addresses, id)` → 지정 1개만 isDefault. 테스트.
- [ ] **D2. 주소 쿼리·액션** — `db/queries/addresses.ts` CRUD + 기본배송지 단일성 보장(트랜잭션). 액션: add/edit/delete/setDefault.
- [ ] **D3. 주소록 UI** — `account/addresses/page.tsx` 목록·추가·수정·삭제·기본설정. `<PostcodeSearch>`(B 소유) 재사용 — B와 동일 컴포넌트 import(경로 공유, 읽기전용).
- [ ] **D4. AddressSelector 실물** — `components/checkout/address-selector.tsx`: 로그인 사용자의 저장 주소를 불러와 선택 → `onSelect(CheckoutAddress)`. stub 시그니처 유지.
- [ ] **D5. 위시리스트 쿼리·액션** — `db/queries/wishlists.ts`: toggle(add/remove), list. 액션 `toggleWishlist(productId)` + `requireUser`.
- [ ] **D6. WishlistButton 실물** — `components/wishlist/wishlist-button.tsx`: 클릭 시 toggle 액션, 낙관적 업데이트, aria-pressed. 비로그인 시 `/login`. stub 시그니처 유지.
- [ ] **D7. 위시리스트 페이지** — `account/wishlist/page.tsx`: 찜 상품 그리드(ProductGrid 재사용) + 빈 상태.
- [ ] **D8. 마이페이지 요약 카드** — `components/account/account-summary.tsx`: 최근 주문상태/찜 개수/(쿠폰 자리). Phase 2에서 `account/page.tsx` 상단에 배치.

### 워크스트림 E — 리뷰 시스템
**범위:** P1 리뷰(작성·조회·평점, PDP 평점·목록)
**소유 파일:** `db/queries/reviews.ts`, `app/account/reviews/**`, `components/reviews/review-summary.tsx`·`review-list.tsx`·`review-form.tsx`(실물), `components/reviews/star-rating.tsx`
**소비:** `lib/reviews/aggregate.ts`(Phase 0)

- [ ] **E1. 별점 컴포넌트(TDD)** — `components/reviews/star-rating.tsx`: 표시/입력 모드. RTL 테스트.
- [ ] **E2. 리뷰 쿼리** — `db/queries/reviews.ts`: `listByProduct(productId)`, `ratingSummary(productId)`(aggregate 사용), `createReview`, `listWritableOrderItems(userId)`(구매확정·미작성 주문상품), `listMyReviews(userId)`.
- [ ] **E3. 작성 자격 검증(pure, TDD)** — `lib/reviews/eligibility.ts`: `canReview(order, existingReviewKeys)` — 상태 `delivered` && 미작성. 테스트.
- [ ] **E4. ReviewSummary 실물** — 평균·개수·별점 요약. stub 시그니처 유지.
- [ ] **E5. ReviewList 실물** — 정렬(최신/평점), 페이지네이션, 포토 썸네일.
- [ ] **E6. 리뷰 작성** — `account/reviews/page.tsx`(작성가능 목록 + 내 리뷰) + `review-form.tsx`(별점·제목·본문·이미지 URL) + 액션 `submitReview`(자격 재검증, unique 충돌 멱등).

### 워크스트림 F — 쿠폰 시스템
**범위:** P1 쿠폰(코드 등록·체크아웃 적용·잔액)
**소유 파일:** `db/queries/coupons.ts`, `app/account/coupons/**`, `components/checkout/coupon-field.tsx`(실물), `src/db/seed-coupons.ts`(데모 쿠폰), `lib/coupons/validate.ts`
**소비:** `lib/checkout/discount.ts`(Phase 0)

- [ ] **F1. 쿠폰 유효성(pure, TDD)** — `lib/coupons/validate.ts`: `validateCoupon(coupon, now, subtotal)` → 활성/기간/최소주문 검사 결과(`{ ok, reason? }`). 테스트: 만료·비활성·최소미달·정상. (now는 인자 주입 — Date.now 직접 호출 금지)
- [ ] **F2. 쿠폰 쿼리·등록** — `db/queries/coupons.ts`: `findByCode`, `claimCoupon(userId, code)`(unique 가드), `listUserCoupons(userId)`(미사용/사용), `markUsed(userCouponId, orderId)`.
- [ ] **F3. CouponField 실물** — `coupon-field.tsx`: 보유 쿠폰 선택 or 코드 입력 → 검증 → `validateCoupon`+`couponDiscount` 로 할인액 계산 → `onApply(discount, code)`. stub 시그니처 유지.
- [ ] **F4. 쿠폰함 페이지** — `account/coupons/page.tsx`: 코드 등록 폼 + 보유 목록(상태·할인·조건·만료).
- [ ] **F5. 데모 쿠폰 시드** — `db/seed-coupons.ts`(또는 `seed.ts` 확장): `WELCOME3000`(정액), `NUTRO10`(정률 10%/최소3만/상한5천).
- [ ] **F6. 주문 적용 합류 준비** — F는 `couponDiscount`/`validateCoupon` 만 노출. 주문 저장 시 `markUsed` 호출은 Phase 2에서 B의 `api/orders` 성공 경로에 연결.

### 워크스트림 G — 인증 & 문의
**범위:** P1 비밀번호 재설정 · P1 약관/마케팅 동의(가입) · P1 1:1 문의
**소유 파일:** `app/login/page.tsx`, `app/signup/page.tsx`, `app/auth/reset/**`(신규), `components/auth/auth-form.tsx`, `app/support/inquiry/**`(신규), `app/account/inquiries/**`(신규), `db/queries/inquiries.ts`

- [ ] **G1. 비밀번호 재설정 요청** — `auth/reset/page.tsx`: 이메일 입력 → `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth/reset/confirm })`. 로그인 화면에 "비밀번호 찾기" 링크.
- [ ] **G2. 비밀번호 재설정 확정** — `auth/reset/confirm/page.tsx`: 새 비밀번호 → `supabase.auth.updateUser({ password })`.
- [ ] **G3. 가입 약관·마케팅 동의** — `auth-form.tsx`(signup 모드): [이용약관·개인정보(필수)] [마케팅 수신(선택)] 체크박스. 필수 미동의 시 가입 비활성. 마케팅 동의는 `signUp(options.data.marketing_consent)` 로 user_metadata 저장. 순수 검증 `signupAgreed(state)` TDD.
- [ ] **G4. 문의 쿼리** — `db/queries/inquiries.ts`: `createInquiry`, `listByUser`, `getForUser`.
- [ ] **G5. 1:1 문의 작성** — `support/inquiry/page.tsx`: 카테고리·제목·본문(+비회원 이메일). 로그인 시 userId/email 자동. 액션 `submitInquiry`.
- [ ] **G6. 내 문의 내역** — `account/inquiries/page.tsx`: 상태(접수/답변완료)·답변 표시.

---

## Phase 2 — INTEGRATION (순차)

모든 worktree를 머지한 뒤(충돌 거의 없음 — 소유 분리), 핫스팟 페이지를 조립하고 stub을 실물로 검증한다.

- [ ] **I1. 머지·stub 대체 확인** — 7 worktree 머지. `components/{wishlist,reviews,checkout}/*` 가 실물(D/E/F)로 채워졌는지 확인. `npx tsc --noEmit` 통과.
- [ ] **I2. PDP 조립** — `products/[slug]/page.tsx` 가 `<ProductGallery>`(A)·수량(A)·`<WishlistButton>`(D)·`<ReviewSummary>`/`<ReviewList>`(E) 를 실제 렌더. RTL 스모크 테스트.
- [ ] **I3. 체크아웃 조립** — `checkout/page.tsx` 에 `<AddressSelector>`(D)·`<CouponField>`(F)·`<TermsAgreement>`(B) 실연결. 쿠폰 `onApply` → 주문 요약 할인 반영 → `api/orders` 에 `couponCode` 전송 → 성공 시 `markUsed`(F) 호출 연결.
- [ ] **I4. 마이페이지 조립** — `account/page.tsx` 상단 `<AccountSummary>`(D) + 상태필터 주문 리스트(C) + 위시/쿠폰/문의/주소록 네비 카드.
- [ ] **I5. 헤더·내비** — `site-header.tsx` 에 위시리스트 진입(♡) 추가. 마이페이지 내비에 신규 섹션 링크.
- [ ] **I6. 전체 회귀** — `npm test` 전체 통과, `npm run lint`, `npm run build` 성공. 결제 happy-path 수동 점검(토글 ON).
- [ ] **I7. 시드 갱신** — `db:seed` 에 리뷰/쿠폰/주소 데모 데이터 포함, 재시드 확인.

---

## Self-Review (spec 커버리지)

| 스펙 백로그 항목 | 구현 태스크 |
|---|---|
| P0-1 PDP 이미지 갤러리 | A5, A6, I2 |
| P0-2 체크아웃 주문상품 목록 | B3, I3 |
| P0-3 우편번호/주소 검색 | B1, B2, I3 |
| P0-4 재구매 버튼 | C2, C4 |
| P1 리뷰 시스템 | E1–E6, I2 |
| P1 취소/교환/반품 | C1, C3, C4 |
| P1 쿠폰 시스템 | 0.3, 0.9, F1–F6, B6, I3 |
| P1 PDP 수량 | A7 |
| P1 PLP 정렬 | A1, A3, A4 |
| P1 PLP 속성 필터 | A2, A3, A4 |
| P1 비회원 주문조회 | C6 |
| P1 비밀번호 재설정 | G1, G2 |
| P1 약관/마케팅 동의 | B4, G3 |
| P1 위시리스트 | 0.2, D5–D7, A8, I2, I5 |
| P1 1:1 문의 | 0.5, G4–G6 |
| P1 배송지 관리 + 요약 | 0.4, D1–D4, D8, I4 |
| P1 무료배송 임박 안내 | 0.10, B3, B5 |

전 항목 태스크 매핑 완료. 신규 컬럼/타입(`couponCode`,`couponDiscount`,`CouponRule`,`CheckoutAddress`)은 Phase 0에서 정의되어 후속 스트림과 시그니처 일치.

---

## 병렬 실행 순서 요약

1. **Phase 0** 순차 완료 → 게이트(`npm test` + `tsc`) → 커밋.
2. **Phase 1**: A·C·D·E·F·G 즉시 병렬 시작. B는 stub 기반으로 병렬 시작(D/F/약관 실물 불요).
3. **Phase 2**: 머지 후 I1–I7 순차.

권장: 워크스트림당 1 worktree + subagent. 스트림 간 공유 파일 없음(핫스팟은 컴포넌트 생산만), 따라서 머지 충돌 최소.
