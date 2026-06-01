# WSB 종합몰 — Cart · Checkout · 결제 구현 계획 (Plan 3/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 고객이 장바구니에 담고 → 주문 정보를 입력하고 → 토스페이먼츠로 결제하고 → 주문 완료를 확인하는 핵심 매출 흐름을 구현한다. 회원/비회원 주문 모두 지원한다.

**Architecture:** 장바구니는 **클라이언트 상태(React Context + localStorage)** 로 두되, 가격/합계의 진실원천은 항상 **서버(DB)** 다. 주문 생성 시 서버가 variantId로 DB 가격을 재조회해 금액을 재계산하고(클라이언트 가격 불신뢰), `orders/order_items`를 `pending`으로 만든다. 결제는 토스 결제위젯으로 요청하고, 성공 리다이렉트를 서버에서 **confirm API + 금액 검증** 후 `paid`로 확정한다. 순수 로직(장바구니 연산·배송비·합계)은 Vitest로 TDD, 결제 위젯 리다이렉트 플로우는 수동 검증.

**Tech Stack:** Next.js App Router(Server Actions/Route Handlers) · Drizzle(Supabase) · 토스페이먼츠 SDK · Tailwind 브랜드 토큰 · Vitest

---

## 전제 (Plan 1·2 완료)
- `main`에 Foundation + Storefront 라이브. `src/db/index.ts`(`getDb`,`schema`), `src/db/queries/products.ts`, `src/lib/catalog/product-view.ts`(`ProductSummary` has `basePrice`, `resolveVariantPriceLabel`), `src/lib/format.ts`(`formatKRW`).
- `src/lib/env.ts`: lazy `getEnv()` + `env` proxy(zod). `productVariants`: {id, productId, name, sku, priceDelta, stock, sortOrder}. 금액 정수(원).
- PDP는 `src/app/products/[slug]/page.tsx`. 헤더 `src/components/layout/site-header.tsx`(장바구니 아이콘 링크 `/cart` 존재).

## 새 작업 브랜치
```bash
git checkout main && git checkout -b feat/checkout
```

## 파일 구조 (이 계획서가 만드는 것)
```
src/
├─ db/schema/{orders.ts, order-items.ts, payments.ts}   # 주문/결제 스키마
├─ lib/
│  ├─ cart/cart-logic.ts (+ .test.ts)                   # 순수 장바구니 연산
│  ├─ cart/cart-context.tsx                             # 클라이언트 Context+localStorage
│  ├─ checkout/pricing.ts (+ .test.ts)                  # 배송비·합계(순수)
│  └─ payments/toss.ts                                  # 토스 키/conf​irm 헬퍼
├─ components/
│  ├─ cart/add-to-cart-button.tsx                       # PDP 담기(client)
│  ├─ cart/cart-badge.tsx                               # 헤더 수량 뱃지(client)
│  └─ cart/cart-view.tsx (+ .test.tsx)                  # 장바구니 표 프레젠테이션
├─ app/
│  ├─ cart/page.tsx                                     # 장바구니 페이지
│  ├─ checkout/page.tsx                                 # 주문서(정보 입력 + 위젯)
│  ├─ checkout/success/page.tsx                         # 결제 승인 처리
│  ├─ checkout/fail/page.tsx                            # 결제 실패
│  └─ api/orders/route.ts                               # 주문 생성(서버 금액 재계산)
└─ (layout 수정: CartProvider 장착, 헤더에 CartBadge)
```

---

### Task 1: 주문/결제 스키마 + 마이그레이션

**Files:** Create `src/db/schema/{orders.ts, order-items.ts, payments.ts}`; update `src/db/schema/index.ts`; `db:generate` + `db:migrate`; add a shape test.

- [ ] **Step 1: orders 스키마** — Create `src/db/schema/orders.ts`:
```ts
import { pgTable, uuid, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";

// status: pending(주문생성·결제대기) → paid(결제완료) → cancelled
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 40 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  userId: uuid("user_id"), // 회원 주문 시 (회원 시스템은 Plan 4) — 지금은 비워둠
  customerName: varchar("customer_name", { length: 80 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 40 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }).notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingZipcode: varchar("shipping_zipcode", { length: 12 }),
  itemsSubtotal: integer("items_subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 2: order_items 스키마** — Create `src/db/schema/order-items.ts`:
```ts
import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

// 주문 시점 스냅샷(상품명·단가)을 보관해 이후 상품 변경과 무관하게 보존
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull(),
  variantId: uuid("variant_id").notNull(),
  productName: varchar("product_name", { length: 200 }).notNull(),
  variantName: varchar("variant_name", { length: 160 }).notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 3: payments 스키마** — Create `src/db/schema/payments.ts`:
```ts
import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 40 }).notNull().default("toss"),
  paymentKey: varchar("payment_key", { length: 200 }).notNull(),
  method: varchar("method", { length: 40 }),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // DONE, CANCELED 등 토스 status
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: 배럴 업데이트** — `src/db/schema/index.ts` 에 추가:
```ts
export * from "./orders";
export * from "./order-items";
export * from "./payments";
```

- [ ] **Step 5: 형상 테스트** — `src/db/schema/schema.test.ts` 에 추가:
```ts
import { orders, orderItems, payments } from "./index";
// ... 기존 describe 내 또는 새 describe:
it("주문 스키마가 핵심 컬럼을 갖는다", () => {
  expect(getTableColumns(orders)).toHaveProperty("totalAmount");
  expect(getTableColumns(orders)).toHaveProperty("orderNumber");
  expect(getTableColumns(orderItems)).toHaveProperty("lineTotal");
  expect(getTableColumns(payments)).toHaveProperty("paymentKey");
});
```
Run `npx vitest run src/db/schema/schema.test.ts` → PASS.

- [ ] **Step 6: 마이그레이션** — `npm run db:generate` (새 `0002_*.sql`, 3개 CREATE TABLE) → `npm run db:migrate` (`.env.local` 자동 로드). 라이브 확인은 throwaway 스크립트로 테이블 3개 존재 확인 후 삭제.

- [ ] **Step 7: 커밋** — `git add -A && git commit -m "feat: add orders, order_items, payments schema"`

---

### Task 2: 순수 장바구니 + 가격 로직 (TDD)

**Files:** Create `src/lib/cart/cart-logic.ts` (+ `.test.ts`), `src/lib/checkout/pricing.ts` (+ `.test.ts`).

- [ ] **Step 1: 장바구니 로직 실패 테스트** — Create `src/lib/cart/cart-logic.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { addItem, setQuantity, removeItem, cartCount, cartSubtotal, type CartItem } from "./cart-logic";

const a: CartItem = { variantId: "v1", productSlug: "nutrogin-focus", name: "FOCUS / 1박스", unitPrice: 39000, quantity: 1, thumbnail: null };
const b: CartItem = { variantId: "v2", productSlug: "wsb-vita-day", name: "비타데이 / 1박스", unitPrice: 22000, quantity: 2, thumbnail: null };

describe("cart-logic", () => {
  it("새 항목을 추가한다", () => {
    expect(addItem([], a)).toHaveLength(1);
  });
  it("같은 variant를 추가하면 수량이 합쳐진다", () => {
    const r = addItem([a], { ...a, quantity: 2 });
    expect(r).toHaveLength(1);
    expect(r[0].quantity).toBe(3);
  });
  it("수량을 변경한다(최소 1)", () => {
    expect(setQuantity([a], "v1", 5)[0].quantity).toBe(5);
    expect(setQuantity([a], "v1", 0)[0].quantity).toBe(1);
  });
  it("항목을 제거한다", () => {
    expect(removeItem([a, b], "v1")).toHaveLength(1);
  });
  it("총 수량과 소계를 계산한다", () => {
    expect(cartCount([a, b])).toBe(3);
    expect(cartSubtotal([a, b])).toBe(39000 + 22000 * 2);
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현** — Create `src/lib/cart/cart-logic.ts`:
```ts
export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  thumbnail: string | null;
};

export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  const existing = cart.find((c) => c.variantId === item.variantId);
  if (existing) {
    return cart.map((c) => (c.variantId === item.variantId ? { ...c, quantity: c.quantity + item.quantity } : c));
  }
  return [...cart, item];
}

export function setQuantity(cart: CartItem[], variantId: string, quantity: number): CartItem[] {
  const q = Math.max(1, Math.floor(quantity));
  return cart.map((c) => (c.variantId === variantId ? { ...c, quantity: q } : c));
}

export function removeItem(cart: CartItem[], variantId: string): CartItem[] {
  return cart.filter((c) => c.variantId !== variantId);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.quantity, 0);
}

export function cartSubtotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
}
```

- [ ] **Step 3: 통과 확인** — `npx vitest run src/lib/cart/cart-logic.test.ts` → PASS (5 passed).

- [ ] **Step 4: 배송비/합계 실패 테스트** — Create `src/lib/checkout/pricing.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { shippingFee, orderTotal, FREE_SHIPPING_THRESHOLD, BASE_SHIPPING_FEE } from "./pricing";

describe("pricing", () => {
  it("5만원 미만은 기본 배송비", () => {
    expect(shippingFee(49000)).toBe(BASE_SHIPPING_FEE);
  });
  it("5만원 이상은 무료배송", () => {
    expect(shippingFee(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFee(80000)).toBe(0);
  });
  it("소계 0이면 배송비도 0", () => {
    expect(shippingFee(0)).toBe(0);
  });
  it("주문 총액 = 소계 + 배송비", () => {
    expect(orderTotal(49000)).toBe(49000 + BASE_SHIPPING_FEE);
    expect(orderTotal(50000)).toBe(50000);
  });
});
```

- [ ] **Step 5: 실패 확인 → 구현** — Create `src/lib/checkout/pricing.ts`:
```ts
export const BASE_SHIPPING_FEE = 3000;
export const FREE_SHIPPING_THRESHOLD = 50000;

export function shippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING_FEE;
}

export function orderTotal(subtotal: number): number {
  return subtotal + shippingFee(subtotal);
}
```

- [ ] **Step 6: 통과 + 전체** — `npx vitest run src/lib/cart src/lib/checkout` → PASS. 그리고 `npx vitest run` 회귀 없음.

- [ ] **Step 7: 커밋** — `git add -A && git commit -m "feat: add pure cart and pricing logic"`

---

### Task 3: 장바구니 Context + PDP 담기 버튼 + 헤더 뱃지

**Files:** Create `src/lib/cart/cart-context.tsx`, `src/components/cart/add-to-cart-button.tsx`, `src/components/cart/cart-badge.tsx`; Modify `src/app/layout.tsx`, `src/app/products/[slug]/page.tsx`, `src/components/layout/site-header.tsx`.

- [ ] **Step 1: Cart Context** — Create `src/lib/cart/cart-context.tsx`:
```tsx
"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { addItem, setQuantity, removeItem, cartCount, cartSubtotal, type CartItem } from "./cart-logic";

const STORAGE_KEY = "wsb-cart-v1";

type CartContextValue = {
  items: CartItem[];
  add: (item: CartItem) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value: CartContextValue = {
    items,
    add: (item) => setItems((c) => addItem(c, item)),
    setQty: (id, qty) => setItems((c) => setQuantity(c, id, qty)),
    remove: (id) => setItems((c) => removeItem(c, id)),
    clear: () => setItems([]),
    count: cartCount(items),
    subtotal: cartSubtotal(items),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

- [ ] **Step 2: layout에 CartProvider 장착** — `src/app/layout.tsx`의 `<body>` 내부를 `<CartProvider>`로 감싼다(헤더/메인/푸터 전체를 감싸 헤더 뱃지도 컨텍스트 접근 가능하게). import 추가: `import { CartProvider } from "@/lib/cart/cart-context";`. 구조:
```tsx
<body className="...">
  <CartProvider>
    <SiteHeader />
    <main className="flex-1">{children}</main>
    <SiteFooter />
  </CartProvider>
</body>
```

- [ ] **Step 3: CartBadge** — Create `src/components/cart/cart-badge.tsx`:
```tsx
"use client";
import { useCart } from "@/lib/cart/cart-context";

export function CartBadge() {
  const { count } = useCart();
  if (count === 0) return null;
  return (
    <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-ng-cobalt px-1 font-mono text-[10px] font-bold text-white" aria-label={`장바구니 ${count}개`}>
      {count}
    </span>
  );
}
```
헤더(`site-header.tsx`)의 장바구니 링크(`/cart`)에 `<CartBadge />`를 아이콘 옆에 렌더. (site-header는 서버 컴포넌트지만 CartBadge가 client이므로 임포트해 자식으로 두면 됨.)

- [ ] **Step 4: AddToCartButton** — Create `src/components/cart/add-to-cart-button.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/lib/cart/cart-logic";

export function AddToCartButton({ options }: { options: Array<CartItem & { stock: number }> }) {
  const { add } = useCart();
  const router = useRouter();
  const [selected, setSelected] = useState(options[0]?.variantId ?? "");
  const opt = options.find((o) => o.variantId === selected);
  const soldOut = !opt || opt.stock <= 0;
  return (
    <div className="mt-4 space-y-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
        aria-label="옵션 선택"
      >
        {options.map((o) => (
          <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0}>
            {o.name}{o.stock <= 0 ? " (품절)" : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={soldOut}
        onClick={() => { if (opt) { const { stock, ...item } = opt; add(item); router.push("/cart"); } }}
        className="w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2"
      >
        {soldOut ? "품절" : "장바구니 담기"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: PDP에 버튼 연결** — `src/app/products/[slug]/page.tsx` 의 옵션 `<ul>` 아래(또는 대체)에 `AddToCartButton`을 렌더. variant → 옵션 매핑:
```tsx
<AddToCartButton
  options={product.variants.map((v) => ({
    variantId: v.id,
    productSlug: product.slug,
    name: `${product.name} / ${v.name}`,
    unitPrice: product.basePrice + v.priceDelta,
    quantity: 1,
    thumbnail: product.thumbnail,
    stock: v.stock,
  }))}
/>
```
import 추가: `import { AddToCartButton } from "@/components/cart/add-to-cart-button";`. 기존 옵션 가격 표 `<ul>`은 유지(정보 표시)하거나 버튼의 select로 대체 — 표는 유지하고 버튼을 그 아래 추가.

- [ ] **Step 6: 빌드 + 테스트** — `npm run build` (성공), `npx vitest run` (회귀 없음). PDP·헤더가 client 경계와 함께 정상 빌드되는지 확인.

- [ ] **Step 7: 커밋** — `git add -A && git commit -m "feat: cart context, add-to-cart on PDP, header cart badge"`

---

### Task 4: 장바구니 페이지 + CartView (TDD)

**Files:** Create `src/components/cart/cart-view.tsx` (+ `.test.tsx`), `src/app/cart/page.tsx`.

- [ ] **Step 1: CartView 실패 테스트** — Create `src/components/cart/cart-view.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartView } from "./cart-view";
import type { CartItem } from "@/lib/cart/cart-logic";

const items: CartItem[] = [
  { variantId: "v1", productSlug: "nutrogin-focus", name: "FOCUS / 1박스", unitPrice: 39000, quantity: 1, thumbnail: null },
];
const noop = () => {};

describe("CartView", () => {
  it("항목과 소계·배송비·총액을 표시한다", () => {
    render(<CartView items={items} subtotal={39000} onSetQty={noop} onRemove={noop} />);
    expect(screen.getByText("FOCUS / 1박스")).toBeInTheDocument();
    expect(screen.getByText("₩39,000")).toBeInTheDocument();      // 소계
    expect(screen.getByText("₩3,000")).toBeInTheDocument();        // 배송비(5만 미만)
    expect(screen.getByText("₩42,000")).toBeInTheDocument();       // 총액
  });
  it("빈 장바구니 문구를 표시한다", () => {
    render(<CartView items={[]} subtotal={0} onSetQty={noop} onRemove={noop} />);
    expect(screen.getByText(/장바구니가 비어/)).toBeInTheDocument();
  });
  it("제거 버튼이 콜백을 호출한다", async () => {
    const onRemove = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    render(<CartView items={items} subtotal={39000} onSetQty={noop} onRemove={onRemove} />);
    await userEvent.click(screen.getByRole("button", { name: "FOCUS / 1박스 삭제" }));
    expect(onRemove).toHaveBeenCalledWith("v1");
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현** — Create `src/components/cart/cart-view.tsx`:
```tsx
import Link from "next/link";
import type { CartItem } from "@/lib/cart/cart-logic";
import { formatKRW } from "@/lib/format";
import { shippingFee, orderTotal } from "@/lib/checkout/pricing";

export function CartView({
  items, subtotal, onSetQty, onRemove,
}: {
  items: CartItem[];
  subtotal: number;
  onSetQty: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-500">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="mt-3 inline-block font-semibold text-wsb-green">상품 보러가기 →</Link>
      </div>
    );
  }
  const ship = shippingFee(subtotal);
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-stone-200">
        {items.map((it) => (
          <li key={it.variantId} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-wsb-carbon">{it.name}</p>
              <p className="font-mono text-xs text-stone-500">{formatKRW(it.unitPrice)}</p>
            </div>
            <input
              type="number" min={1} value={it.quantity}
              onChange={(e) => onSetQty(it.variantId, Number(e.target.value))}
              className="w-16 rounded border border-stone-300 px-2 py-1 text-sm"
              aria-label={`${it.name} 수량`}
            />
            <p className="w-24 text-right font-mono text-sm font-bold">{formatKRW(it.unitPrice * it.quantity)}</p>
            <button type="button" onClick={() => onRemove(it.variantId)} aria-label={`${it.name} 삭제`}
              className="text-stone-400 hover:text-rose-500">✕</button>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-lg border border-stone-200 p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-stone-500">소계</dt><dd className="font-mono">{formatKRW(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-stone-500">배송비</dt><dd className="font-mono">{formatKRW(ship)}</dd></div>
          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-extrabold"><dt>총액</dt><dd className="font-mono">{formatKRW(orderTotal(subtotal))}</dd></div>
        </dl>
        <Link href="/checkout" className="mt-4 block rounded-md bg-wsb-green py-3 text-center text-sm font-bold text-white">주문하기</Link>
      </aside>
    </div>
  );
}
```
(주의: 삭제 버튼의 `✕`는 텍스트 기호이며 이모지가 아님 — 허용. `aria-label`로 접근성 확보.)

- [ ] **Step 3: 통과 확인** — `npx vitest run src/components/cart/cart-view.test.tsx` → PASS (3 passed).

- [ ] **Step 4: 장바구니 페이지(client)** — Create `src/app/cart/page.tsx`:
```tsx
"use client";
import { useCart } from "@/lib/cart/cart-context";
import { CartView } from "@/components/cart/cart-view";

export default function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">장바구니</h1>
      <CartView items={items} subtotal={subtotal} onSetQty={setQty} onRemove={remove} />
    </section>
  );
}
```

- [ ] **Step 5: 빌드 + 전체 테스트** — `npm run build`, `npx vitest run` 통과.

- [ ] **Step 6: 커밋** — `git add -A && git commit -m "feat: cart page and CartView component"`

---

### Task 5: 토스 키 환경변수 + 결제 헬퍼

**Files:** Modify `src/lib/env.ts`, `.env.example`, `.env.local`; Create `src/lib/payments/toss.ts`.

- [ ] **Step 1: env 스키마에 토스 키 추가(선택값)** — `src/lib/env.ts` 의 `envSchema` 에 추가(기존 카탈로그/DB가 토스 키 없이도 동작하도록 **optional**):
```ts
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
```

- [ ] **Step 2: .env.example / .env.local** — `.env.example` 에 두 키의 플레이스홀더 추가:
```
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxx
```
`.env.local` 에는 **토스페이먼츠 개발자센터의 테스트 키**(test_ck_* / test_sk_*)를 넣는다. (운영 키는 오픈 직전 교체.) 키가 없으면 결제 단계만 비활성/오류 — 카탈로그·장바구니는 정상.

- [ ] **Step 3: 토스 헬퍼** — Create `src/lib/payments/toss.ts`:
```ts
import { getEnv } from "@/lib/env";

export function getTossClientKey(): string {
  const key = getEnv().NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다.");
  return key;
}

export function getTossSecretKey(): string {
  const key = getEnv().TOSS_SECRET_KEY;
  if (!key) throw new Error("TOSS_SECRET_KEY 가 설정되지 않았습니다.");
  return key;
}

// 토스 결제 승인. 성공 시 토스 결제 객체를 반환, 실패 시 throw.
export async function confirmTossPayment(input: { paymentKey: string; orderId: string; amount: number }) {
  const secret = getTossSecretKey();
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`토스 결제 승인 실패: ${data.code ?? res.status} ${data.message ?? ""}`);
  }
  return data as { paymentKey: string; orderId: string; status: string; totalAmount: number; method?: string; approvedAt?: string };
}
```

- [ ] **Step 4: tsc + 커밋** — `npx tsc --noEmit` 통과. `git add -A && git commit -m "feat: add toss payment keys env and confirm helper"`

---

### Task 6: 주문 생성 API (서버 금액 재계산)

클라이언트가 보낸 가격을 신뢰하지 않고, variantId로 DB에서 재계산한다.

**Files:** Create `src/app/api/orders/route.ts`. (선택) `src/lib/checkout/order-number.ts`.

- [ ] **Step 1: 주문번호 생성기(순수, TDD)** — Create `src/lib/checkout/order-number.ts` + test:
```ts
// src/lib/checkout/order-number.ts
export function buildOrderNumber(now: Date, rand: string): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `WSB-${y}${m}${d}-${rand.toUpperCase()}`;
}
```
```ts
// src/lib/checkout/order-number.test.ts
import { describe, it, expect } from "vitest";
import { buildOrderNumber } from "./order-number";
describe("buildOrderNumber", () => {
  it("WSB-YYYYMMDD-RAND 형식", () => {
    expect(buildOrderNumber(new Date("2026-06-30T00:00:00Z"), "ab12")).toMatch(/^WSB-20260630-AB12$/);
  });
});
```
Run → PASS.

- [ ] **Step 2: 주문 생성 라우트** — Create `src/app/api/orders/route.ts`:
```ts
import { NextResponse } from "next/server";
import { inArray, eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { shippingFee } from "@/lib/checkout/pricing";
import { buildOrderNumber } from "@/lib/checkout/order-number";

type IncomingItem = { variantId: string; quantity: number };
type Body = {
  items: IncomingItem[];
  customer: { name: string; phone: string; email: string; address: string; zipcode?: string };
};

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  if (!body.items?.length) return NextResponse.json({ error: "장바구니가 비어 있습니다." }, { status: 400 });
  const { name, phone, email, address } = body.customer ?? {};
  if (!name || !phone || !email || !address) {
    return NextResponse.json({ error: "주문자 정보를 모두 입력해주세요." }, { status: 400 });
  }

  const db = getDb();
  const variantIds = body.items.map((i) => i.variantId);
  // 서버에서 가격 재조회 (클라이언트 가격 불신뢰)
  const variants = await db.select().from(schema.productVariants).where(inArray(schema.productVariants.id, variantIds));
  const productIds = [...new Set(variants.map((v) => v.productId))];
  const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));
  const productOf = (id: string) => products.find((p) => p.id === id)!;

  let subtotal = 0;
  const itemRows = body.items.map((i) => {
    const v = variants.find((x) => x.id === i.variantId);
    if (!v) throw new Error(`존재하지 않는 옵션: ${i.variantId}`);
    const p = productOf(v.productId);
    const qty = Math.max(1, Math.floor(i.quantity));
    const unitPrice = p.basePrice + v.priceDelta;
    const lineTotal = unitPrice * qty;
    subtotal += lineTotal;
    return { productId: p.id, variantId: v.id, productName: p.name, variantName: v.name, unitPrice, quantity: qty, lineTotal };
  });

  const ship = shippingFee(subtotal);
  const totalAmount = subtotal + ship;
  const orderNumber = buildOrderNumber(new Date(), Math.random().toString(36).slice(2, 6));

  const [order] = await db.insert(schema.orders).values({
    orderNumber, status: "pending",
    customerName: name, customerPhone: phone, customerEmail: email,
    shippingAddress: address, shippingZipcode: body.customer.zipcode ?? null,
    itemsSubtotal: subtotal, shippingFee: ship, totalAmount,
  }).returning();

  await db.insert(schema.orderItems).values(itemRows.map((r) => ({ ...r, orderId: order.id })));

  return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber, amount: totalAmount });
}
```

- [ ] **Step 3: tsc + 빌드** — `npx tsc --noEmit`, `npm run build` 통과(라우트 `/api/orders` 표시).

- [ ] **Step 4: 통합 확인(시드 DB)** — throwaway 스크립트로 실제 variantId 2개를 골라 POST 시뮬레이션(리포지토리로 variant id 조회 → fetch 로컬 라우트는 서버 필요하므로, 대신 라우트의 핵심 계산을 직접 호출하거나 `npm run dev` 후 curl). 간단히: `npm run dev` 백그라운드 → `curl -s localhost:3000/api/orders -H "content-type: application/json" -d '{"items":[{"variantId":"<real>","quantity":2}],"customer":{"name":"홍길동","phone":"010","email":"a@b.c","address":"서울"}}'` → `{orderId, orderNumber, amount}` 확인 후 서버 종료. (실제 variantId는 시드 DB에서 조회.) 생성된 주문은 테스트 데이터이므로 남아도 무방하나, 가능하면 삭제.

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat: order creation API with server-side price recomputation"`

---

### Task 7: 주문서(체크아웃) 페이지 + 토스 위젯

**Files:** Create `src/app/checkout/page.tsx`. Install `@tosspayments/tosspayments-sdk`.

- [ ] **Step 1: SDK 설치** — `npm install @tosspayments/tosspayments-sdk`

- [ ] **Step 2: 체크아웃 페이지(client)** — Create `src/app/checkout/page.tsx`:
  - `useCart()`로 items/subtotal 취득. 비면 `/cart`로 안내.
  - 주문자 정보 폼(이름·연락처·이메일·주소; 비회원 기본, 회원 로그인은 Plan 4) + 개인정보 수집 동의 체크.
  - "결제하기" 클릭 시: (1) `POST /api/orders`로 주문 생성 → `{orderId, orderNumber, amount}` 수신, (2) 토스 SDK `loadTossPayments(clientKey)` → `tossPayments.payment({ customerKey })` 또는 결제창 `requestPayment` 호출. successUrl=`/checkout/success`, failUrl=`/checkout/fail`, orderId=`orderNumber`(토스의 orderId로 사용; 영문/숫자 6~64자 — `WSB-...` 적합), amount, orderName=대표 상품명.
  - 구현 예(요지 — 설치된 SDK 버전 API에 맞춰 조정; 아래는 표준 결제창 방식):
```tsx
"use client";
import { useState } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useCart } from "@/lib/cart/cart-context";
import { orderTotal } from "@/lib/checkout/pricing";
import { formatKRW } from "@/lib/format";
import { getTossClientKey } from "@/lib/payments/toss";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", agree: false });
  const [loading, setLoading] = useState(false);
  const total = orderTotal(subtotal);

  async function pay() {
    if (!form.agree) return alert("개인정보 수집·이용에 동의해주세요.");
    if (!form.name || !form.phone || !form.email || !form.address) return alert("주문자 정보를 모두 입력해주세요.");
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), customer: form }),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "주문 생성 실패");

      const toss = await loadTossPayments(getTossClientKey());
      const payment = toss.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: order.amount },
        orderId: order.orderNumber,
        orderName: items[0]?.name ?? "WSB 주문",
        customerEmail: form.email,
        customerName: form.name,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      });
    } catch (e) {
      alert((e as Error).message);
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-16 text-center text-stone-500">장바구니가 비어 있습니다.</section>;
  }
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">주문서</h1>
      <div className="space-y-3">
        {(["name","phone","email","address"] as const).map((f) => (
          <input key={f} placeholder={{name:"이름",phone:"연락처",email:"이메일",address:"주소"}[f]}
            value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green" />
        ))}
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
          개인정보 수집·이용에 동의합니다.
        </label>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-lg font-extrabold">결제 금액 {formatKRW(total)}</span>
        <button type="button" onClick={pay} disabled={loading}
          className="rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white disabled:opacity-40">
          {loading ? "처리 중…" : "결제하기"}
        </button>
      </div>
    </section>
  );
}
```
  - **주의:** 설치된 `@tosspayments/tosspayments-sdk` 버전의 정확한 API(`payment()`/`widgets()`/`requestPayment` 시그니처)를 확인하고 그에 맞춘다. 위는 결제창(payment) 방식 기준. 빌드/타입이 맞지 않으면 SDK README에 맞춰 최소 수정하고 concern으로 보고.

- [ ] **Step 3: 빌드** — `npm run build` 통과. (SDK는 client에서만 로드되므로 SSR 이슈 없도록 `"use client"` 확인.)

- [ ] **Step 4: 커밋** — `git add -A && git commit -m "feat: checkout page with toss payment request"`

---

### Task 8: 결제 승인(success/fail) + 주문 완료

**Files:** Create `src/app/checkout/success/page.tsx`, `src/app/checkout/fail/page.tsx`.

- [ ] **Step 1: success 라우트(서버, 결제 승인)** — Create `src/app/checkout/success/page.tsx`:
```tsx
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { confirmTossPayment } from "@/lib/payments/toss";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;
  if (!paymentKey || !orderId || !amount) {
    return <Result ok={false} message="잘못된 접근입니다." />;
  }
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderId)).limit(1);
  if (!order) return <Result ok={false} message="주문을 찾을 수 없습니다." />;

  // 금액 위변조 검증: 토스가 전달한 amount === 서버 주문 금액
  if (Number(amount) !== order.totalAmount) {
    return <Result ok={false} message="결제 금액이 일치하지 않습니다." />;
  }
  if (order.status === "paid") {
    return <Result ok orderNumber={order.orderNumber} amount={order.totalAmount} />;
  }

  try {
    const result = await confirmTossPayment({ paymentKey, orderId, amount: order.totalAmount });
    await db.insert(schema.payments).values({
      orderId: order.id, provider: "toss", paymentKey: result.paymentKey,
      method: result.method ?? null, amount: result.totalAmount, status: result.status,
      approvedAt: result.approvedAt ? new Date(result.approvedAt) : null,
    });
    await db.update(schema.orders).set({ status: "paid" }).where(eq(schema.orders.id, order.id));
  } catch (e) {
    return <Result ok={false} message={(e as Error).message} />;
  }
  return <Result ok orderNumber={order.orderNumber} amount={order.totalAmount} />;
}

function Result({ ok, orderNumber, amount, message }: { ok: boolean; orderNumber?: string; amount?: number; message?: string }) {
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">{ok ? "주문이 완료되었습니다" : "결제에 실패했습니다"}</h1>
      {ok ? (
        <div className="mt-4 space-y-1 text-sm text-stone-600">
          <p>주문번호 <span className="font-mono">{orderNumber}</span></p>
          <p>결제금액 <span className="font-mono">{amount != null ? formatKRW(amount) : ""}</span></p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-rose-600">{message}</p>
      )}
      <Link href="/products" className="mt-6 inline-block rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white">쇼핑 계속하기</Link>
    </section>
  );
}
```
  - **주의:** success 페이지에서 장바구니 비우기는 클라이언트 상태이므로 서버 컴포넌트에서 직접 못 한다. 작은 client 컴포넌트(`ClearCartOnMount`)를 두어 마운트 시 `useCart().clear()` 호출하도록 success 페이지 하단에 포함(주문이 ok일 때만). 구현:
```tsx
// src/components/cart/clear-cart-on-mount.tsx
"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/cart/cart-context";
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => { clear(); }, [clear]);
  return null;
}
```
  ok 분기의 `Result`에 `<ClearCartOnMount />`를 포함.

- [ ] **Step 2: fail 페이지** — Create `src/app/checkout/fail/page.tsx`:
```tsx
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FailPage({ searchParams }: { searchParams: Promise<{ message?: string; code?: string }> }) {
  const { message, code } = await searchParams;
  return (
    <section className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">결제가 취소되었습니다</h1>
      <p className="mt-4 text-sm text-stone-600">{message ?? "결제가 완료되지 않았습니다."}{code ? ` (${code})` : ""}</p>
      <Link href="/cart" className="mt-6 inline-block rounded-md bg-wsb-green px-6 py-3 text-sm font-bold text-white">장바구니로 돌아가기</Link>
    </section>
  );
}
```

- [ ] **Step 3: 빌드 + 전체 테스트** — `npm run build`(라우트 `/checkout/success`,`/checkout/fail` 표시), `npx vitest run` 회귀 없음, `npx tsc --noEmit` 클린.

- [ ] **Step 4: 커밋** — `git add -A && git commit -m "feat: toss payment confirm (success) and fail pages with amount verification"`

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지(§2 v1, §7 결제·배송):**
- 장바구니 → Task 2/3/4 ✅ / 단건 결제(토스) → Task 5/7/8 ✅ / 회원·비회원 → 비회원 폼 구현, 회원 연동은 Plan 4(스키마에 nullable userId 준비) ✅
- 배송비 5만원↑ 무료 → `pricing.ts` ✅ / 주문 데이터(orders/order_items/payments) → Task 1 ✅
- 서버 금액 재계산·금액 위변조 검증(보안) → Task 6/8 ✅
- Plan 2 후속(add-to-cart seam, 재고 게이팅) → Task 3 ✅

**2. 플레이스홀더 스캔:** 모든 코드 스텝에 실제 코드. 토스 SDK 시그니처는 "설치 버전에 맞춰 조정"을 명시(외부 SDK 버전 의존). 통합 확인 throwaway 스크립트는 삭제 명시.

**3. 타입 일관성:** `CartItem`(Task2)을 context/버튼/뷰가 동일 사용. `/api/orders` 응답 `{orderId, orderNumber, amount}`을 체크아웃이 사용, success가 `orderNumber`(토스 orderId)·`totalAmount`로 검증. `confirmTossPayment` 반환 필드(paymentKey/status/totalAmount/method/approvedAt)를 payments insert가 사용. `shippingFee`/`orderTotal`(Task2)을 cart-view·checkout·api가 공유(단일 출처).

**리스크/주의:**
- 토스 결제 위젯·리다이렉트는 자동 테스트 불가 → **수동 검증**(테스트 키로 결제창 → success 승인 → 주문 paid). 배포 환경(Vercel)에 `NEXT_PUBLIC_TOSS_CLIENT_KEY`·`TOSS_SECRET_KEY` 등록 필요.
- 토스 SDK 패키지/버전 API가 본문 예시와 다를 수 있음 → 설치 후 README 기준으로 최소 조정하고 concern 보고.
- success 페이지는 `force-dynamic` + 멱등(이미 paid면 재승인 안 함).
- 재고 차감은 본 계획 범위 밖(품절 표시·담기 차단까지) — 실제 재고 감소/동시성은 후속(운영·어드민 Plan 5)에서 트랜잭션으로.
