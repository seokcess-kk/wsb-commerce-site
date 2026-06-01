# WSB 종합몰 — 운영자 어드민 구현 계획 (Plan 5/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 운영자가 상품을 등록·수정하고, 주문을 처리(상태변경·송장)하고, 메인 배너를 관리하고, 판매 통계를 한눈에 보는 어드민을 만든다. 어드민은 허용된 이메일 계정만 접근한다.

**Architecture:** `/admin/*` 는 서버 측 `requireAdmin()`(로그인 사용자 이메일이 `ADMIN_EMAILS`에 포함) 게이트로 보호. 데이터 변경은 Server Actions(서버에서 검증), 조회는 서버 컴포넌트 + 전용 어드민 쿼리. 순수 로직(주문 상태 전이·통계 집계 변환)은 Vitest TDD, 화면/쿼리는 빌드+시드 DB로 검증. 디자인은 WSB 쉘 톤(그린/카본/모노)로 데이터 친화적 어드민 UI.

**Tech Stack:** Next.js App Router(Server Actions·Server Components) · Drizzle(Supabase) · Tailwind 브랜드 토큰 · Vitest

## 범위 / 비범위
- **포함:** 어드민 게이트·레이아웃, 대시보드(매출추이·주문상태·상품별 판매·신규/재구매), 상품 목록/등록/수정(옵션·재고·규제필드·노출·이미지URL), 주문 목록/상세/상태변경·송장, 배너 CRUD + 홈 노출.
- **비범위(후속):** 이미지 Supabase Storage 업로드(현재 URL 입력), 회원/리뷰/문의 관리, 권한 세분화(마스터/매니저), CSV 내보내기, 재고 자동차감.
- **외부 설정:** `ADMIN_EMAILS`(쉼표구분)를 `.env.local` + Vercel 환경변수에 등록. 어드민 로그인 = 해당 이메일로 회원가입/로그인.

## 전제 (Plan 1~4 완료, main 라이브)
- `src/lib/auth/current-user.ts`(`getCurrentUser`), `src/lib/env.ts`(lazy `env`/`getEnv`), `src/db/index.ts`(`getDb`,`schema`: products, productVariants, categories, orders, orderItems, payments). `orders.status`(pending/paid/cancelled), `formatKRW`. `and,eq,desc,sql,inArray` from drizzle-orm.

## 새 작업 브랜치
```bash
git checkout main && git checkout -b feat/admin
```

## 파일 구조
```
src/lib/admin/
  require-admin.ts                  # 어드민 게이트(server)
  order-status.ts (+ .test.ts)      # 상태 전이·라벨(순수)
  analytics-helpers.ts (+ .test.ts) # 재구매/버킷 변환(순수)
src/db/
  schema/banners.ts                 # 배너 스키마
  queries/admin-analytics.ts        # 대시보드 집계 쿼리
  queries/admin-products.ts         # 상품 어드민 쿼리/뮤테이션
  queries/admin-orders.ts           # 주문 어드민 쿼리/뮤테이션
  queries/banners.ts                # 배너 쿼리/뮤테이션
src/app/admin/
  layout.tsx                        # 게이트 + 사이드바
  page.tsx                          # 대시보드
  products/page.tsx                 # 상품 목록
  products/new/page.tsx             # 상품 등록
  products/[id]/page.tsx            # 상품 수정
  products/actions.ts               # 상품 server actions
  orders/page.tsx                   # 주문 목록
  orders/[orderNumber]/page.tsx     # 주문 상세(상태/송장)
  orders/actions.ts                 # 주문 server actions
  banners/page.tsx                  # 배너 관리
  banners/actions.ts                # 배너 server actions
src/components/admin/*              # 어드민 UI 컴포넌트(필요 시)
src/app/page.tsx                    # 홈: 배너 히어로 렌더(수정)
```

---

### Task 1: 어드민 게이트 + 레이아웃

**Files:** Modify `src/lib/env.ts`, `.env.example`, `.env.local`; Create `src/lib/admin/require-admin.ts`, `src/app/admin/layout.tsx`.

- [ ] **Step 1: env에 ADMIN_EMAILS(선택) 추가** — `src/lib/env.ts` envSchema에 `ADMIN_EMAILS: z.string().optional(),`. `.env.example`에 `ADMIN_EMAILS=admin@example.com` 추가, `.env.local`에도 동일 키 추가(실제 관리자 이메일은 운영자가 채움; 미설정 시 어드민 접근 전부 차단).

- [ ] **Step 2: 어드민 이메일 판별(순수, TDD)** — Create `src/lib/admin/is-admin-email.ts` + test:
```ts
// is-admin-email.ts
export function isAdminEmail(email: string | null | undefined, adminEmailsCsv: string | undefined): boolean {
  if (!email || !adminEmailsCsv) return false;
  const allow = adminEmailsCsv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
```
```ts
// is-admin-email.test.ts
import { describe, it, expect } from "vitest";
import { isAdminEmail } from "./is-admin-email";
describe("isAdminEmail", () => {
  it("허용목록에 있으면 true(대소문자/공백 무관)", () => {
    expect(isAdminEmail("Admin@WSB.com", " admin@wsb.com , b@b.com")).toBe(true);
  });
  it("없으면 false", () => {
    expect(isAdminEmail("x@y.com", "admin@wsb.com")).toBe(false);
    expect(isAdminEmail(null, "admin@wsb.com")).toBe(false);
    expect(isAdminEmail("a@a.com", undefined)).toBe(false);
  });
});
```
Run red→green.

- [ ] **Step 3: requireAdmin(server)** — Create `src/lib/admin/require-admin.ts`:
```ts
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getEnv } from "@/lib/env";
import { isAdminEmail } from "./is-admin-email";

export async function requireAdmin(): Promise<{ id: string; email: string | null }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email, getEnv().ADMIN_EMAILS)) redirect("/");
  return user;
}
```

- [ ] **Step 4: 어드민 레이아웃** — Create `src/app/admin/layout.tsx`:
```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품관리" },
  { href: "/admin/orders", label: "주문관리" },
  { href: "/admin/banners", label: "배너관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-6 py-8">
      <aside className="w-44 shrink-0">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-stone-400">WSB Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 font-semibold text-wsb-carbon hover:bg-wsb-green/5 hover:text-wsb-green">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: tsc + 빌드 + 테스트** — `npx tsc --noEmit`, `npm run build`(`/admin` 라우트), 전체 `npx vitest run`(+is-admin-email 테스트). 커밋: `git add -A && git commit -m "feat: admin gate (ADMIN_EMAILS) and admin layout"`

---

### Task 2: 주문 상태 확장 + 송장 컬럼 + 상태 헬퍼

**Files:** Modify `src/db/schema/orders.ts`; migration; Create `src/lib/admin/order-status.ts` (+ test).

- [ ] **Step 1: 송장 컬럼 추가** — `src/db/schema/orders.ts` orders에 추가:
```ts
  courier: varchar("courier", { length: 40 }),
  trackingNumber: varchar("tracking_number", { length: 60 }),
```
`db:generate`(0004_*) → `db:migrate`.

- [ ] **Step 2: 상태 헬퍼(순수, TDD)** — Create `src/lib/admin/order-status.ts`:
```ts
export const ORDER_STATUSES = ["pending", "paid", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "결제 대기", paid: "결제 완료", preparing: "배송 준비",
  shipped: "발송 완료", delivered: "배송 완료", cancelled: "취소",
};

// 어드민이 옮길 수 있는 다음 상태
export function nextStatuses(current: string): OrderStatus[] {
  switch (current) {
    case "paid": return ["preparing", "cancelled"];
    case "preparing": return ["shipped", "cancelled"];
    case "shipped": return ["delivered"];
    default: return [];
  }
}
export function isValidTransition(from: string, to: string): boolean {
  return (nextStatuses(from) as string[]).includes(to);
}
```
Test `order-status.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { nextStatuses, isValidTransition, STATUS_LABEL } from "./order-status";
describe("order-status", () => {
  it("paid → preparing/cancelled", () => { expect(nextStatuses("paid")).toEqual(["preparing", "cancelled"]); });
  it("shipped → delivered", () => { expect(nextStatuses("shipped")).toEqual(["delivered"]); });
  it("pending/delivered는 전이 없음", () => { expect(nextStatuses("pending")).toEqual([]); expect(nextStatuses("delivered")).toEqual([]); });
  it("유효 전이 검사", () => { expect(isValidTransition("paid","preparing")).toBe(true); expect(isValidTransition("paid","delivered")).toBe(false); });
  it("라벨 존재", () => { expect(STATUS_LABEL.delivered).toBe("배송 완료"); });
});
```
Run red→green.

- [ ] **Step 3: 커밋** — `npx vitest run` 통과, `npm run build`. `git add -A && git commit -m "feat: order shipping columns and status transition helpers"`

---

### Task 3: 대시보드 통계 (집계 쿼리 + 순수 변환 TDD + 페이지)

**Files:** Create `src/lib/admin/analytics-helpers.ts` (+ test), `src/db/queries/admin-analytics.ts`, `src/app/admin/page.tsx`.

- [ ] **Step 1: 순수 변환 TDD** — Create `src/lib/admin/analytics-helpers.ts`:
```ts
// 사용자별 주문 건수 목록 → 신규/재구매 집계
export function summarizeCustomers(rows: { userId: string; orderCount: number }[]) {
  const total = rows.length;
  const repeat = rows.filter((r) => r.orderCount >= 2).length;
  return { total, repeat, newCustomers: total - repeat, repeatRate: total ? Math.round((repeat / total) * 100) : 0 };
}
```
Test `analytics-helpers.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { summarizeCustomers } from "./analytics-helpers";
describe("summarizeCustomers", () => {
  it("재구매/신규/재구매율을 계산", () => {
    const r = summarizeCustomers([{ userId: "a", orderCount: 3 }, { userId: "b", orderCount: 1 }, { userId: "c", orderCount: 2 }]);
    expect(r).toEqual({ total: 3, repeat: 2, newCustomers: 1, repeatRate: 67 });
  });
  it("빈 목록", () => { expect(summarizeCustomers([])).toEqual({ total: 0, repeat: 0, newCustomers: 0, repeatRate: 0 }); });
});
```
Run red→green.

- [ ] **Step 2: 집계 쿼리** — Create `src/db/queries/admin-analytics.ts` (paid 주문 기준):
```ts
import { sql, eq, desc, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

const PAID_LIKE = ["paid", "preparing", "shipped", "delivered"];

export async function getStatusCounts(): Promise<Record<string, number>> {
  const db = getDb();
  const rows = await db.select({ status: schema.orders.status, c: sql<number>`count(*)::int` })
    .from(schema.orders).groupBy(schema.orders.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.c]));
}

export async function getDailyRevenue(days = 14): Promise<{ day: string; total: number }[]> {
  const db = getDb();
  const rows = await db.select({
    day: sql<string>`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`,
    total: sql<number>`coalesce(sum(${schema.orders.totalAmount}),0)::int`,
  }).from(schema.orders)
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(sql`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(desc(sql`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`))
    .limit(days);
  return rows.reverse();
}

export async function getTopProducts(limit = 5): Promise<{ name: string; qty: number; revenue: number }[]> {
  const db = getDb();
  return db.select({
    name: schema.orderItems.productName,
    qty: sql<number>`sum(${schema.orderItems.quantity})::int`,
    revenue: sql<number>`sum(${schema.orderItems.lineTotal})::int`,
  }).from(schema.orderItems)
    .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(schema.orderItems.productName)
    .orderBy(desc(sql`sum(${schema.orderItems.quantity})`))
    .limit(limit);
}

export async function getCustomerOrderCounts(): Promise<{ userId: string; orderCount: number }[]> {
  const db = getDb();
  const rows = await db.select({
    userId: schema.orders.userId,
    orderCount: sql<number>`count(*)::int`,
  }).from(schema.orders)
    .where(inArray(schema.orders.status, PAID_LIKE))
    .groupBy(schema.orders.userId);
  return rows.filter((r): r is { userId: string; orderCount: number } => r.userId !== null);
}
```

- [ ] **Step 3: 대시보드 페이지** — Create `src/app/admin/page.tsx`:
```tsx
import { getStatusCounts, getDailyRevenue, getTopProducts, getCustomerOrderCounts } from "@/db/queries/admin-analytics";
import { summarizeCustomers } from "@/lib/admin/analytics-helpers";
import { STATUS_LABEL } from "@/lib/admin/order-status";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [statusCounts, daily, top, custRows] = await Promise.all([
    getStatusCounts(), getDailyRevenue(14), getTopProducts(5), getCustomerOrderCounts(),
  ]);
  const cust = summarizeCustomers(custRows);
  const revenueTotal = daily.reduce((s, d) => s + d.total, 0);
  const maxDay = Math.max(1, ...daily.map((d) => d.total));
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-wsb-carbon">대시보드</h1>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="최근 14일 매출" value={formatKRW(revenueTotal)} />
        <Kpi label="결제완료 주문" value={`${statusCounts.paid ?? 0}건`} />
        <Kpi label="회원(구매)" value={`${cust.total}명`} />
        <Kpi label="재구매율" value={`${cust.repeatRate}%`} />
      </div>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card title="매출 추이 (최근 14일)">
          <ul className="space-y-1">
            {daily.map((d) => (
              <li key={d.day} className="flex items-center gap-2 text-xs">
                <span className="w-20 font-mono text-stone-500">{d.day.slice(5)}</span>
                <span className="h-2 rounded bg-wsb-green" style={{ width: `${Math.round((d.total / maxDay) * 100)}%` }} />
                <span className="font-mono text-stone-600">{formatKRW(d.total)}</span>
              </li>
            ))}
            {daily.length === 0 && <li className="text-sm text-stone-400">데이터 없음</li>}
          </ul>
        </Card>
        <Card title="주문 상태 현황">
          <ul className="space-y-1 text-sm">
            {Object.entries(STATUS_LABEL).map(([k, label]) => (
              <li key={k} className="flex justify-between"><span className="text-stone-500">{label}</span><span className="font-mono font-bold">{statusCounts[k] ?? 0}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="상품별 판매 TOP">
          <ol className="space-y-1 text-sm">
            {top.map((t, i) => (
              <li key={t.name} className="flex justify-between"><span className="truncate">{i + 1}. {t.name}</span><span className="font-mono">{t.qty}개 · {formatKRW(t.revenue)}</span></li>
            ))}
            {top.length === 0 && <li className="text-stone-400">데이터 없음</li>}
          </ol>
        </Card>
        <Card title="회원">
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span className="text-stone-500">구매 회원 수</span><span className="font-mono font-bold">{cust.total}</span></li>
            <li className="flex justify-between"><span className="text-stone-500">재구매 회원</span><span className="font-mono font-bold">{cust.repeat}</span></li>
            <li className="flex justify-between"><span className="text-stone-500">신규(1회)</span><span className="font-mono font-bold">{cust.newCustomers}</span></li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-stone-200 p-4"><p className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{label}</p><p className="mt-1 text-xl font-extrabold text-wsb-carbon">{value}</p></div>;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-stone-200 p-5"><h2 className="mb-3 text-sm font-bold text-wsb-carbon">{title}</h2>{children}</div>;
}
```

- [ ] **Step 4: tsc + 빌드 + 통합 확인** — `npx tsc --noEmit`, `npm run build`. (시드 + 이전 테스트 주문이 있으므로 대시보드가 0이 아닐 수 있음; 0이어도 정상.) 커밋: `git add -A && git commit -m "feat: admin dashboard with sales analytics"`

---

### Task 4: 상품 목록 (어드민)

**Files:** Create `src/db/queries/admin-products.ts`, `src/app/admin/products/page.tsx`.

- [ ] **Step 1: 어드민 상품 쿼리** — Create `src/db/queries/admin-products.ts`:
```ts
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listAllProductsAdmin() {
  const db = getDb();
  return db.select({
    id: schema.products.id, name: schema.products.name, brand: schema.products.brand,
    basePrice: schema.products.basePrice, isPublished: schema.products.isPublished, slug: schema.products.slug,
  }).from(schema.products).orderBy(desc(schema.products.createdAt));
}
```

- [ ] **Step 2: 목록 페이지** — Create `src/app/admin/products/page.tsx`:
```tsx
import Link from "next/link";
import { listAllProductsAdmin } from "@/db/queries/admin-products";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAllProductsAdmin();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-wsb-carbon">상품관리</h1>
        <Link href="/admin/products/new" className="rounded-md bg-wsb-green px-4 py-2 text-sm font-bold text-white">+ 상품 등록</Link>
      </div>
      <table className="mt-5 w-full text-sm">
        <thead><tr className="border-b border-stone-200 text-left text-stone-500"><th className="py-2">상품명</th><th>브랜드</th><th>가격</th><th>노출</th><th></th></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-stone-100">
              <td className="py-2 font-semibold text-wsb-carbon">{p.name}</td>
              <td className="font-mono text-xs">{p.brand}</td>
              <td className="font-mono">{formatKRW(p.basePrice)}</td>
              <td>{p.isPublished ? <span className="text-wsb-green">노출</span> : <span className="text-stone-400">숨김</span>}</td>
              <td className="text-right"><Link href={`/admin/products/${p.id}`} className="text-wsb-green hover:underline">수정</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && <p className="py-10 text-center text-sm text-stone-400">등록된 상품이 없습니다.</p>}
    </div>
  );
}
```

- [ ] **Step 3: tsc + 빌드 + 커밋** — `git add -A && git commit -m "feat: admin product list"`

---

### Task 5: 상품 등록/수정 + server action

**Files:** Create `src/app/admin/products/actions.ts`, `src/components/admin/product-form.tsx`, `src/app/admin/products/new/page.tsx`, `src/app/admin/products/[id]/page.tsx`. Extend `src/db/queries/admin-products.ts`.

- [ ] **Step 1: 카테고리·상품상세 조회 추가** — `admin-products.ts`에 `listCategoriesAdmin()`(id,name 반환)과 `getProductForEdit(id)`(상품 + variants 반환) 추가.
```ts
export async function listCategoriesAdmin() {
  return getDb().select({ id: schema.categories.id, name: schema.categories.name }).from(schema.categories).orderBy(schema.categories.sortOrder);
}
export async function getProductForEdit(id: string) {
  const db = getDb();
  const [p] = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
  if (!p) return null;
  const variants = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, id)).orderBy(schema.productVariants.sortOrder);
  return { product: p, variants };
}
```

- [ ] **Step 2: server action** — Create `src/app/admin/products/actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";

type VariantInput = { name: string; priceDelta: number; stock: number };
export type ProductInput = {
  id?: string; slug: string; name: string; brand: string; categoryId: string | null;
  basePrice: number; summary: string | null; description: string | null;
  reviewPhraseNo: string | null; noticeText: string | null; reportNo: string | null;
  functionality: string | null; intakeNotice: string | null; ingredients: string | null;
  images: string[]; isPublished: boolean; variants: VariantInput[];
};

export async function saveProduct(input: ProductInput) {
  await requireAdmin();
  const db = getDb();
  const { id, variants, ...fields } = input;
  let productId = id;
  if (id) {
    await db.update(schema.products).set({ ...fields, updatedAt: new Date() }).where(eq(schema.products.id, id));
  } else {
    const [created] = await db.insert(schema.products).values(fields).returning();
    productId = created.id;
  }
  // variants 교체(단순화): 기존 삭제 후 재삽입
  await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, productId!));
  if (variants.length) {
    await db.insert(schema.productVariants).values(variants.map((v, i) => ({
      productId: productId!, name: v.name, priceDelta: v.priceDelta, stock: v.stock, sortOrder: i,
    })));
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}
```
주의: variants를 삭제·재삽입하면 기존 variantId가 바뀐다. v1에선 수용(주문은 order_items에 스냅샷 보관하므로 과거 주문 영향 없음; 장바구니의 옛 variantId는 주문 시 400 처리됨). 이 trade-off를 코드 주석으로 명시.

- [ ] **Step 3: ProductForm(client)** — Create `src/components/admin/product-form.tsx`:
  - props: `categories: {id,name}[]`, `initial?: ProductInput`.
  - 필드: name, slug, brand(select: WSB/NUTROGIN/직접입력), categoryId(select), basePrice(number), summary, description(textarea), 규제필드(reviewPhraseNo/reportNo/functionality/intakeNotice/ingredients/noticeText), images(줄바꿈 구분 textarea → string[]), isPublished(checkbox).
  - variants 편집: 행 목록(name, priceDelta, stock) + 행 추가/삭제 버튼(useState).
  - 제출: 클라이언트에서 값 모아 `saveProduct(input)` server action 호출(폼 action 또는 onClick). 숫자 필드 Number 변환, images는 `value.split("\n").map(trim).filter(Boolean)`.
  - 브랜드 토큰·접근성·포커스링 적용, 이모지 금지.
  (전체 폼 JSX는 길어도 모든 필드를 실제로 렌더. 누락 없이 구현.)

- [ ] **Step 4: 등록/수정 페이지** — `src/app/admin/products/new/page.tsx`: `listCategoriesAdmin()` → `<ProductForm categories={...} />`. `src/app/admin/products/[id]/page.tsx`: `getProductForEdit(id)`(없으면 notFound) → DB행을 `ProductInput`로 매핑해 `initial`로 전달.

- [ ] **Step 5: tsc + 빌드 + 통합 확인** — 빌드 후, 어드민 로그인 상태에서 `/admin/products/new`로 상품 1개 등록 → 목록·`/products`(force-dynamic) 반영 확인은 수동(어드민 계정 필요). 최소한 tsc/build 통과. 커밋: `git add -A && git commit -m "feat: admin product create/edit with variants"`

---

### Task 6: 주문 관리 (목록·상세·상태/송장)

**Files:** Create `src/db/queries/admin-orders.ts`, `src/app/admin/orders/page.tsx`, `src/app/admin/orders/[orderNumber]/page.tsx`, `src/app/admin/orders/actions.ts`.

- [ ] **Step 1: 어드민 주문 쿼리** — Create `src/db/queries/admin-orders.ts`:
```ts
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export async function listAllOrders() {
  return getDb().select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(200);
}
export async function getOrderAdmin(orderNumber: string) {
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}
```

- [ ] **Step 2: 주문 server action** — Create `src/app/admin/orders/actions.ts`:
```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { requireAdmin } from "@/lib/admin/require-admin";
import { isValidTransition } from "@/lib/admin/order-status";

export async function updateOrderStatus(orderNumber: string, to: string) {
  await requireAdmin();
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber)).limit(1);
  if (!order) throw new Error("주문을 찾을 수 없습니다.");
  if (!isValidTransition(order.status, to)) throw new Error(`허용되지 않는 상태 변경: ${order.status} → ${to}`);
  await db.update(schema.orders).set({ status: to }).where(eq(schema.orders.id, order.id));
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
}

export async function updateShipping(orderNumber: string, courier: string, trackingNumber: string) {
  await requireAdmin();
  const db = getDb();
  await db.update(schema.orders).set({ courier, trackingNumber }).where(eq(schema.orders.orderNumber, orderNumber));
  revalidatePath(`/admin/orders/${orderNumber}`);
}
```

- [ ] **Step 3: 주문 목록 페이지** — `src/app/admin/orders/page.tsx`: `listAllOrders()` 표(주문번호 링크, 상태 라벨, 금액, 주문자, 생성일). `STATUS_LABEL` 사용.

- [ ] **Step 4: 주문 상세 페이지** — `src/app/admin/orders/[orderNumber]/page.tsx`: `getOrderAdmin`(없으면 notFound). 주문 항목·금액·배송지 표시. 상태 변경: `nextStatuses(order.status)` 버튼들(각 버튼은 server action `updateOrderStatus`를 form action으로 호출). 송장 입력 폼(courier, trackingNumber → `updateShipping`). 클라이언트 상호작용 없이 `<form action={...}>` 서버액션 방식 사용.
```tsx
// 상태 변경 버튼 예
{nextStatuses(order.status).map((s) => (
  <form key={s} action={async () => { "use server"; await updateOrderStatus(order.orderNumber, s); }}>
    <button className="rounded-md border border-wsb-green px-3 py-1.5 text-sm font-semibold text-wsb-green">{STATUS_LABEL[s]}로 변경</button>
  </form>
))}
```
(또는 actions.ts의 함수를 bind해서 form action으로 전달. 인라인 server action 또는 `updateOrderStatus.bind(null, order.orderNumber, s)` 사용. 구현 시 Next 16 권장 패턴으로.)

- [ ] **Step 5: tsc + 빌드 + 커밋** — `git add -A && git commit -m "feat: admin order management (status transitions, shipping)"`

---

### Task 7: 배너 스키마 + 어드민 배너 관리

**Files:** Create `src/db/schema/banners.ts`(+배럴), migration; Create `src/db/queries/banners.ts`, `src/app/admin/banners/page.tsx`, `src/app/admin/banners/actions.ts`. Update schema shape test.

- [ ] **Step 1: 배너 스키마** — Create `src/db/schema/banners.ts`:
```ts
import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 160 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  linkUrl: varchar("link_url", { length: 500 }),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
배럴(`index.ts`)에 `export * from "./banners";`. 형상 테스트에 banners.title/isActive 단언 추가. `db:generate`(0005_*) → `db:migrate`.

- [ ] **Step 2: 배너 쿼리/액션** — Create `src/db/queries/banners.ts`:
```ts
import { eq, asc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
export async function listActiveBanners() {
  return getDb().select().from(schema.banners).where(eq(schema.banners.isActive, true)).orderBy(asc(schema.banners.sortOrder));
}
export async function listAllBanners() {
  return getDb().select().from(schema.banners).orderBy(asc(schema.banners.sortOrder));
}
```
Create `src/app/admin/banners/actions.ts` (`"use server"`, requireAdmin): `createBanner(input)`, `updateBanner(id, input)`, `toggleBanner(id, isActive)`, `deleteBanner(id)` — 각 작업 후 `revalidatePath("/admin/banners")`와 `revalidatePath("/")`.

- [ ] **Step 3: 배너 관리 페이지** — `src/app/admin/banners/page.tsx`: `listAllBanners()` 목록(제목·이미지URL·링크·노출 토글·순서·삭제) + 신규 배너 추가 폼. server action 폼 방식. 노출 토글/삭제는 form action.

- [ ] **Step 4: tsc + 빌드 + 테스트 + 커밋** — `npx vitest run`(형상 테스트), 빌드. `git add -A && git commit -m "feat: banners schema and admin banner management"`

---

### Task 8: 홈 히어로 — 배너 노출

**Files:** Modify `src/app/page.tsx`.

- [ ] **Step 1: 홈에서 활성 배너 렌더** — `src/app/page.tsx`를 서버 컴포넌트로(이미 그러함) `listActiveBanners()` 호출. 배너가 있으면 첫 배너를 히어로로(이미지/제목/링크), 없으면 기존 NUTROGIN 플레이스홀더 유지(폴백). `export const dynamic = "force-dynamic"` 추가(배너는 DB 기반). NUTROGIN 코발트/네온 톤 유지. 추가로 베스트 상품 몇 개를 `listPublishedProducts()`로 노출(ProductGrid 재사용, 상위 4개).
```tsx
import { listActiveBanners } from "@/db/queries/banners";
import { listPublishedProducts } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [banners, products] = await Promise.all([listActiveBanners(), listPublishedProducts()]);
  const hero = banners[0];
  return (
    <div>
      {hero ? (
        <a href={hero.linkUrl ?? "#"} className="block bg-ng-cobalt px-6 py-16 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-widest text-ng-neon">WSB</p>
            <h1 className="mt-2 text-3xl font-extrabold">{hero.title}</h1>
          </div>
        </a>
      ) : (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-ng-cobalt">New Launch · NUTROGIN</p>
          <h1 className="mt-2 text-3xl font-extrabold">Sharper mind, brighter day.</h1>
        </section>
      )}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-5 text-xl font-extrabold text-wsb-carbon">베스트 상품</h2>
        <ProductGrid products={products.slice(0, 8)} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: tsc + 빌드 + 전체 테스트 + 커밋** — `npm run build`(홈 `/`가 동적 ƒ로 전환됨 확인), `npx vitest run`, `npx tsc --noEmit`. `git add -A && git commit -m "feat: render active banners and best products on home"`

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지(어드민, §통계):** 상품 등록/수정(옵션·규제·노출) → T4/T5 ✅ / 주문 처리(상태·송장) → T2/T6 ✅ / 대시보드 4지표(매출추이·주문상태·상품별·신규/재구매) → T3 ✅ / 메인 배너 관리 + 홈 노출 → T7/T8 ✅ / 어드민 접근 제어 → T1 ✅.

**2. 플레이스홀더 스캔:** 핵심 코드는 실제 코드. ProductForm 전체 JSX는 "모든 필드 누락 없이 구현"으로 지시(길이상 본문은 필드 목록 명시) — 구현자가 완전 구현. 이미지 업로드는 URL 입력으로 명시 축소.

**3. 타입 일관성:** `requireAdmin`(T1)을 모든 어드민 페이지/액션이 사용. `ORDER_STATUSES/STATUS_LABEL/nextStatuses/isValidTransition`(T2)를 대시보드·주문상세·주문액션이 공유. `summarizeCustomers`(T3) 입력 형태 = `getCustomerOrderCounts` 출력. `ProductInput`(T5 action)을 ProductForm·수정페이지가 공유. `listActiveBanners`(T7)를 홈(T8)이 사용.

**리스크/주의:**
- variants 삭제·재삽입으로 variantId 변경 → 과거 주문은 order_items 스냅샷이라 무관, 장바구니의 옛 id는 주문 시 400. 주석 명시.
- 어드민 인증/DB/서버액션은 jsdom 단위테스트 부적합 → 순수 헬퍼(is-admin-email/order-status/analytics-helpers)만 TDD, 나머지는 빌드+수동(어드민 로그인) 검증.
- `ADMIN_EMAILS` 미설정 시 모든 어드민 접근 차단(`isAdminEmail`이 false) — 안전 기본값. 운영자는 본인 이메일로 회원가입 후 ADMIN_EMAILS 등록.
- 홈이 `force-dynamic`으로 전환(배너·상품 DB 조회) — SEO/성능은 후속에서 캐시 전략 검토.
- 서버 액션의 금액/입력 검증은 기본 수준; 상세 검증은 후속 하드닝.
