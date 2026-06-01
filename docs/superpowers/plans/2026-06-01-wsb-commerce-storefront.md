# WSB 종합몰 — Storefront Catalog 구현 계획 (Plan 2/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 고객이 상품을 탐색·이해할 수 있는 카탈로그 전면 — 상품 목록, 효능별 필터/카테고리 페이지, 상품 상세(PDP, 건기식 규제 표시 포함) — 을 구현하고, 실제 시드 데이터로 동작을 검증한다.

**Architecture:** Server Components가 리포지토리(`src/db/queries`)로 Supabase에서 데이터를 읽어 **순수 프레젠테이션 컴포넌트**에 뷰모델로 전달한다. DB 행 → 뷰모델 변환은 순수 함수(`src/lib/catalog`)로 분리해 TDD하고, 컴포넌트는 픽스처로 TDD한다(테스트는 DB 비의존). 리포지토리는 얇게 유지하고 시드된 dev DB로 1회 통합 확인한다. NUTROGIN 상품/존은 코발트·네온 테마로 전환(듀얼 브랜드).

**Tech Stack:** Next.js App Router(Server Components) · Drizzle(Supabase Postgres) · Tailwind v4 브랜드 토큰 · shadcn/ui · Vitest + Testing Library

---

## 전제 (Plan 1 완료 상태)
- `feat/foundation` 머지된 `main`에 스캐폴드·스키마·토큰·쉘·`/api/health` 존재. 배포 라이브.
- `src/db/index.ts`: `getDb()` + lazy `db` proxy. `src/db/schema/{categories,products,product-variants}.ts`.
- `src/lib/format.ts` `formatKRW`. 브랜드 유틸: `bg-wsb-*`, `text-ng-cobalt`, `bg-ng-neon`, `font-mono` 등.
- `.env.local`에 Supabase 값 존재. `npm run db:migrate`는 `.env.local` 자동 로드.
- 금액은 정수(원). `env`/`db`는 lazy 접근만(스프레드/`in` 금지).

## 새 작업 브랜치
```bash
git checkout main && git checkout -b feat/storefront
```

## 파일 구조 (이 계획서가 만드는 것)
```
src/
├─ db/
│  ├─ schema/products.ts                 # (수정) 규제 컬럼 추가
│  ├─ seed.ts                            # 시드 스크립트
│  └─ queries/products.ts                # 리포지토리(목록/카테고리/상세)
├─ lib/catalog/
│  ├─ product-view.ts                    # 뷰모델 타입 + 매퍼(순수)
│  └─ product-view.test.ts
├─ components/
│  ├─ catalog/
│  │  ├─ product-card.tsx (+ .test.tsx)
│  │  ├─ product-grid.tsx (+ .test.tsx)
│  │  ├─ category-filter.tsx (+ .test.tsx)
│  │  └─ compliance-notice.tsx (+ .test.tsx)
│  └─ layout/
│     └─ mobile-nav.tsx (+ .test.tsx)    # Plan 1 후속: 실제 모바일 내비
└─ app/
   ├─ products/page.tsx                  # 전체 목록 + 필터
   ├─ products/[slug]/page.tsx           # PDP
   └─ category/[slug]/page.tsx           # 효능별 목록
```

---

### Task 1: `products` 규제 컬럼 확장 (마이그레이션)

건기식 PDP 표시에 필요한 컬럼을 추가한다(Plan 1 후속 #2).

**Files:** Modify `src/db/schema/products.ts`; Create migration via `db:generate`; apply via `db:migrate`. Update `src/db/schema/schema.test.ts`.

- [ ] **Step 1: 스키마에 컬럼 추가** — `src/db/schema/products.ts` 의 `products` 객체에 아래 컬럼 추가(기존 컬럼 유지, `noticeText` 아래에 삽입):

```ts
  reportNo: varchar("report_no", { length: 80 }),          // 품목보고번호
  functionality: text("functionality"),                     // 기능성 내용(심의 문구)
  intakeNotice: text("intake_notice"),                      // 섭취 시 주의사항
  ingredients: text("ingredients"),                         // 원료명 및 함량
```

- [ ] **Step 2: 형상 테스트 확장** — `src/db/schema/schema.test.ts` 의 products 테스트 `it` 에 단언 추가:

```ts
    expect(cols).toHaveProperty("reportNo");
    expect(cols).toHaveProperty("functionality");
    expect(cols).toHaveProperty("intakeNotice");
    expect(cols).toHaveProperty("ingredients");
```

- [ ] **Step 3: 테스트 실행** — Run `npx vitest run src/db/schema/schema.test.ts`. Expected: PASS.

- [ ] **Step 4: 마이그레이션 생성** — Run `npm run db:generate`. Expected: 새 `drizzle/0001_*.sql` 에 `ALTER TABLE "products" ADD COLUMN ...` 4건.

- [ ] **Step 5: 마이그레이션 적용** — Run `npm run db:migrate`. Expected: `migrations applied successfully!` (.env.local 자동 로드).

- [ ] **Step 6: 커밋**
```bash
git add -A && git commit -m "feat: extend products with health-functional-food regulatory columns"
```

---

### Task 2: 시드 데이터 스크립트

목록/PDP를 실제로 검증하려면 데이터가 필요하다. 멱등 시드를 만든다.

**Files:** Create `src/db/seed.ts`; add `db:seed` script to `package.json`.

- [ ] **Step 1: 시드 스크립트 작성** — Create `src/db/seed.ts`:

```ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb, schema } from "./index";

const CATEGORIES = [
  { slug: "brain-focus", name: "두뇌·집중", sortOrder: 1 },
  { slug: "immune", name: "면역", sortOrder: 2 },
  { slug: "sleep", name: "수면", sortOrder: 3 },
  { slug: "vitality", name: "활력", sortOrder: 4 },
];

const NOTICE = "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";

async function main() {
  const db = getDb();

  // 카테고리 (멱등: slug 충돌 무시)
  await db.insert(schema.categories).values(CATEGORIES).onConflictDoNothing({ target: schema.categories.slug });

  const cats = await db.select().from(schema.categories);
  const idOf = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  const products = [
    {
      slug: "nutrogin-focus", name: "NUTROGIN FOCUS 브레인케어 스틱", brand: "NUTROGIN",
      categoryId: idOf("brain-focus"), basePrice: 39000,
      summary: "데이터로 키운 진세노사이드 브레인케어, 하루 한 스틱.",
      reviewPhraseNo: "제2026-FOCUS-001", noticeText: NOTICE,
      reportNo: "제2026-0000000001호", functionality: "인지능력 개선에 도움을 줄 수 있음(개별인정형 예시)",
      intakeNotice: "임산부·수유부·어린이는 섭취에 주의. 이상사례 발생 시 섭취 중단.",
      ingredients: "홍삼농축액 70%(진세노사이드 Rg1+Rb1+Rg3), 비타민 B군",
      images: ["/products/nutrogin-focus.png"], isPublished: true,
    },
    {
      slug: "nutrogin-clear", name: "NUTROGIN CLEAR 스틱", brand: "NUTROGIN",
      categoryId: idOf("brain-focus"), basePrice: 39000,
      summary: "맑은 하루를 위한 브레인케어.", reviewPhraseNo: "제2026-CLEAR-001", noticeText: NOTICE,
      reportNo: "제2026-0000000002호", functionality: "피로 개선에 도움을 줄 수 있음",
      intakeNotice: "정해진 섭취량을 지키십시오.", ingredients: "홍삼농축액, 아연",
      images: ["/products/nutrogin-clear.png"], isPublished: true,
    },
    {
      slug: "nutrogin-rest", name: "NUTROGIN REST 스틱", brand: "NUTROGIN",
      categoryId: idOf("sleep"), basePrice: 39000,
      summary: "깊은 휴식을 위한 나이트 케어.", reviewPhraseNo: "제2026-REST-001", noticeText: NOTICE,
      reportNo: "제2026-0000000003호", functionality: "수면의 질 개선에 도움을 줄 수 있음",
      intakeNotice: "취침 전 섭취. 운전 전 섭취 주의.", ingredients: "테아닌, 락티움",
      images: ["/products/nutrogin-rest.png"], isPublished: true,
    },
    {
      slug: "wsb-immune-balance", name: "WSB 이뮨 밸런스", brand: "WSB",
      categoryId: idOf("immune"), basePrice: 28000,
      summary: "일상 면역 케어.", reviewPhraseNo: "제2026-IMM-001", noticeText: NOTICE,
      reportNo: "제2026-0000000010호", functionality: "면역력 증진에 도움을 줄 수 있음",
      intakeNotice: "알레르기 체질은 원료 확인.", ingredients: "아연, 비타민C, 홍삼",
      images: ["/products/wsb-immune.png"], isPublished: true,
    },
    {
      slug: "wsb-vita-day", name: "WSB 비타 데이", brand: "WSB",
      categoryId: idOf("vitality"), basePrice: 22000,
      summary: "하루 활력 멀티비타민.", reviewPhraseNo: "제2026-VITA-001", noticeText: NOTICE,
      reportNo: "제2026-0000000011호", functionality: "피로 개선에 도움을 줄 수 있음",
      intakeNotice: "1일 1회 1포.", ingredients: "비타민 B·C·D, 미네랄",
      images: ["/products/wsb-vita.png"], isPublished: true,
    },
  ];

  await db.insert(schema.products).values(products).onConflictDoNothing({ target: schema.products.slug });

  const inserted = await db.select().from(schema.products);
  const variantRows = inserted.flatMap((p) => [
    { productId: p.id, name: "1박스 (10스틱)", sku: `${p.slug}-1`, priceDelta: 0, stock: 100, sortOrder: 1 },
    { productId: p.id, name: "3박스 세트", sku: `${p.slug}-3`, priceDelta: Math.round(p.basePrice * 2.7) - p.basePrice, stock: 50, sortOrder: 2 },
  ]);
  // 멱등: sku unique 가 없으므로, variant가 이미 있으면 건너뛰기 위해 존재 여부 확인
  const existingVariants = await db.select().from(schema.productVariants);
  if (existingVariants.length === 0) {
    await db.insert(schema.productVariants).values(variantRows);
  }

  console.log(`seed 완료: categories=${cats.length}, products=${inserted.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: package.json 스크립트 추가** — `"db:seed": "node --experimental-strip-types src/db/seed.ts"` 를 scripts에 추가.
  (Node 24는 `--experimental-strip-types`로 TS 직접 실행 가능. 만약 import 경로 `@/` 가 node에서 해석 안 되면, seed.ts 내부 import는 상대경로 `./index`를 쓰므로 문제 없음. 실행 실패 시 `npx tsx src/db/seed.ts` 로 대체하고 `tsx`를 devDep로 설치.)

- [ ] **Step 3: 시드 실행** — Run `npm run db:seed`. Expected: `seed 완료: categories=4, products=5`. 재실행해도 멱등(중복 삽입 없음)인지 한 번 더 실행해 확인.

- [ ] **Step 4: 커밋**
```bash
git add -A && git commit -m "feat: add idempotent catalog seed (categories, NUTROGIN + WSB products, variants)"
```

---

### Task 3: 상품 뷰모델 타입 + 매퍼 (순수, TDD)

**Files:** Create `src/lib/catalog/product-view.ts`, `src/lib/catalog/product-view.test.ts`.

- [ ] **Step 1: 실패 테스트 작성** — Create `src/lib/catalog/product-view.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { toProductSummary, displayPriceLabel, isNutroginBrand } from "./product-view";

const row = {
  id: "p1", slug: "nutrogin-focus", name: "NUTROGIN FOCUS", brand: "NUTROGIN",
  basePrice: 39000, summary: "요약", images: ["/a.png"], isPublished: true,
  categorySlug: "brain-focus", categoryName: "두뇌·집중",
};

describe("toProductSummary", () => {
  it("DB 행을 요약 뷰모델로 변환한다", () => {
    const vm = toProductSummary(row);
    expect(vm.slug).toBe("nutrogin-focus");
    expect(vm.priceLabel).toBe("₩39,000");
    expect(vm.thumbnail).toBe("/a.png");
    expect(vm.isNutrogin).toBe(true);
  });
  it("이미지가 없으면 thumbnail은 null", () => {
    expect(toProductSummary({ ...row, images: [] }).thumbnail).toBeNull();
  });
});

describe("displayPriceLabel", () => {
  it("기본가를 원화로 표기한다", () => {
    expect(displayPriceLabel(28000)).toBe("₩28,000");
  });
});

describe("isNutroginBrand", () => {
  it("브랜드 대소문자 무관하게 NUTROGIN을 인식한다", () => {
    expect(isNutroginBrand("nutrogin")).toBe(true);
    expect(isNutroginBrand("WSB")).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인** — Run `npx vitest run src/lib/catalog/product-view.test.ts`. Expected: FAIL (모듈 없음).

- [ ] **Step 3: 구현** — Create `src/lib/catalog/product-view.ts`:

```ts
import { formatKRW } from "@/lib/format";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  basePrice: number;
  summary: string | null;
  images: string[];
  isPublished: boolean;
  categorySlug: string | null;
  categoryName: string | null;
};

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  isNutrogin: boolean;
  priceLabel: string;
  thumbnail: string | null;
  summary: string | null;
  categorySlug: string | null;
  categoryName: string | null;
};

export function isNutroginBrand(brand: string): boolean {
  return brand.trim().toUpperCase() === "NUTROGIN";
}

export function displayPriceLabel(amount: number): string {
  return formatKRW(amount);
}

export function toProductSummary(row: ProductRow): ProductSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    isNutrogin: isNutroginBrand(row.brand),
    priceLabel: displayPriceLabel(row.basePrice),
    thumbnail: row.images[0] ?? null,
    summary: row.summary,
    categorySlug: row.categorySlug,
    categoryName: row.categoryName,
  };
}
```

- [ ] **Step 4: 통과 확인** — Run `npx vitest run src/lib/catalog/product-view.test.ts`. Expected: PASS (5 passed).

- [ ] **Step 5: 커밋**
```bash
git add -A && git commit -m "feat: add product view-model types and pure mappers"
```

---

### Task 4: 상품 리포지토리 (Drizzle 쿼리)

얇은 데이터 접근 계층. 단위 테스트는 매퍼/컴포넌트가 담당하고, 여기서는 시드된 dev DB로 1회 통합 확인한다.

**Files:** Create `src/db/queries/products.ts`.

- [ ] **Step 1: 리포지토리 구현** — Create `src/db/queries/products.ts`:

```ts
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";
import { toProductSummary, type ProductRow, type ProductSummary } from "@/lib/catalog/product-view";

const { products, categories, productVariants } = schema;

function joinRowToProductRow(r: {
  product: typeof products.$inferSelect;
  category: typeof categories.$inferSelect | null;
}): ProductRow {
  return {
    id: r.product.id,
    slug: r.product.slug,
    name: r.product.name,
    brand: r.product.brand,
    basePrice: r.product.basePrice,
    summary: r.product.summary,
    images: r.product.images,
    isPublished: r.product.isPublished,
    categorySlug: r.category?.slug ?? null,
    categoryName: r.category?.name ?? null,
  };
}

export async function listPublishedProducts(): Promise<ProductSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isPublished, true))
    .orderBy(desc(products.createdAt));
  return rows.map(joinRowToProductRow).map(toProductSummary);
}

export async function listProductsByCategory(categorySlug: string): Promise<ProductSummary[]> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(categories.slug, categorySlug));
  return rows
    .map(joinRowToProductRow)
    .filter((r) => r.isPublished)
    .map(toProductSummary);
}

export type ProductVariant = typeof productVariants.$inferSelect;
export type ProductDetail = ProductSummary & {
  description: string | null;
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
  ingredients: string | null;
  images: string[];
  variants: ProductVariant[];
};

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const db = getDb();
  const rows = await db
    .select({ product: products, category: categories })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const p = rows[0].product;
  if (!p.isPublished) return null;
  const summary = toProductSummary(joinRowToProductRow(rows[0]));
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, p.id))
    .orderBy(productVariants.sortOrder);
  return {
    ...summary,
    description: p.description,
    reviewPhraseNo: p.reviewPhraseNo,
    noticeText: p.noticeText,
    reportNo: p.reportNo,
    functionality: p.functionality,
    intakeNotice: p.intakeNotice,
    ingredients: p.ingredients,
    images: p.images,
    variants,
  };
}
```

- [ ] **Step 2: tsc 확인** — Run `npx tsc --noEmit`. Expected: no errors. (drizzle `$inferSelect` 타입이 Task 1의 새 컬럼을 포함하는지 확인.)

- [ ] **Step 3: 통합 확인(시드 DB)** — 임시 검증 스크립트로 실제 쿼리 동작을 1회 확인(커밋하지 않음):

Create `_check-repo.mjs` at repo root:
```js
import { config } from "dotenv";
config({ path: ".env.local" });
const { listPublishedProducts, getProductBySlug } = await import("./src/db/queries/products.ts");
const list = await listPublishedProducts();
console.log("published 개수:", list.length, "| 첫 상품:", list[0]?.slug, list[0]?.priceLabel, "nutrogin:", list[0]?.isNutrogin);
const detail = await getProductBySlug("nutrogin-focus");
console.log("PDP:", detail?.name, "| variants:", detail?.variants.length, "| 품목보고번호:", detail?.reportNo);
process.exit(0);
```
Run: `node --experimental-strip-types _check-repo.mjs` (또는 `npx tsx _check-repo.mjs`).
Expected: `published 개수: 5`, PDP 이름·variants 2·품목보고번호 출력.
Then delete: `rm -f _check-repo.mjs` (절대 커밋하지 말 것).

- [ ] **Step 4: 커밋**
```bash
git add -A && git commit -m "feat: add product repository (list, by-category, by-slug)"
```

---

### Task 5: ProductCard · ProductGrid 컴포넌트 (TDD)

**Files:** Create `src/components/catalog/product-card.tsx` (+ `.test.tsx`), `product-grid.tsx` (+ `.test.tsx`).

- [ ] **Step 1: ProductCard 실패 테스트** — Create `src/components/catalog/product-card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "./product-card";
import type { ProductSummary } from "@/lib/catalog/product-view";

const base: ProductSummary = {
  id: "1", slug: "nutrogin-focus", name: "NUTROGIN FOCUS", brand: "NUTROGIN",
  isNutrogin: true, priceLabel: "₩39,000", thumbnail: "/a.png", summary: "요약",
  categorySlug: "brain-focus", categoryName: "두뇌·집중",
};

describe("ProductCard", () => {
  it("상품명·가격·상세 링크를 렌더한다", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("NUTROGIN FOCUS")).toBeInTheDocument();
    expect(screen.getByText("₩39,000")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/nutrogin-focus");
  });
  it("NUTROGIN 상품은 브랜드 뱃지를 보여준다", () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText("NUTROGIN")).toBeInTheDocument();
  });
  it("WSB 상품은 NUTROGIN 뱃지를 보여주지 않는다", () => {
    render(<ProductCard product={{ ...base, brand: "WSB", isNutrogin: false, name: "WSB 이뮨" }} />);
    expect(screen.queryByText("NUTROGIN")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인** — Run `npx vitest run src/components/catalog/product-card.test.tsx`. Expected: FAIL.

- [ ] **Step 3: ProductCard 구현** — Create `src/components/catalog/product-card.tsx`:

```tsx
import Link from "next/link";
import type { ProductSummary } from "@/lib/catalog/product-view";

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-lg border border-stone-200 transition-colors hover:border-wsb-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green"
    >
      <div
        className={`flex h-40 items-center justify-center ${
          product.isNutrogin ? "bg-ng-cobalt/10 text-ng-cobalt" : "bg-stone-100 text-stone-400"
        }`}
      >
        <span className="font-mono text-xs">{product.thumbnail ? product.name : "이미지 준비중"}</span>
      </div>
      <div className="p-3">
        {product.isNutrogin && (
          <span className="font-mono text-[10px] font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h3 className="mt-0.5 text-sm font-semibold text-wsb-carbon">{product.name}</h3>
        <p className="mt-1 text-sm font-extrabold text-wsb-carbon">{product.priceLabel}</p>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: 통과 확인** — Run the header test. Expected: PASS (3 passed).

- [ ] **Step 5: ProductGrid 실패 테스트** — Create `src/components/catalog/product-grid.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "./product-grid";
import type { ProductSummary } from "@/lib/catalog/product-view";

const mk = (slug: string, name: string): ProductSummary => ({
  id: slug, slug, name, brand: "WSB", isNutrogin: false, priceLabel: "₩10,000",
  thumbnail: null, summary: null, categorySlug: null, categoryName: null,
});

describe("ProductGrid", () => {
  it("여러 상품 카드를 렌더한다", () => {
    render(<ProductGrid products={[mk("a", "상품 A"), mk("b", "상품 B")]} />);
    expect(screen.getByText("상품 A")).toBeInTheDocument();
    expect(screen.getByText("상품 B")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
  it("상품이 없으면 빈 상태 문구를 보여준다", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText(/상품이 없습니다/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 실패 확인 → 구현** — Create `src/components/catalog/product-grid.tsx`:

```tsx
import type { ProductSummary } from "@/lib/catalog/product-view";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return <p className="py-16 text-center text-sm text-stone-500">표시할 상품이 없습니다.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: 통과 확인** — Run `npx vitest run src/components/catalog`. Expected: PASS (5 passed).

- [ ] **Step 8: 커밋**
```bash
git add -A && git commit -m "feat: add ProductCard and ProductGrid components"
```

---

### Task 6: CategoryFilter 컴포넌트 (TDD)

**Files:** Create `src/components/catalog/category-filter.tsx` (+ `.test.tsx`).

- [ ] **Step 1: 실패 테스트** — Create `src/components/catalog/category-filter.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryFilter } from "./category-filter";

const cats = [
  { slug: "brain-focus", name: "두뇌·집중" },
  { slug: "immune", name: "면역" },
];

describe("CategoryFilter", () => {
  it("전체 + 카테고리 링크를 렌더한다", () => {
    render(<CategoryFilter categories={cats} activeSlug={null} />);
    expect(screen.getByRole("link", { name: "전체" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toHaveAttribute("href", "/category/brain-focus");
  });
  it("활성 카테고리에 aria-current를 표시한다", () => {
    render(<CategoryFilter categories={cats} activeSlug="immune" />);
    expect(screen.getByRole("link", { name: "면역" })).toHaveAttribute("aria-current", "page");
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현** — Create `src/components/catalog/category-filter.tsx`:

```tsx
import Link from "next/link";

type Cat = { slug: string; name: string };

export function CategoryFilter({ categories, activeSlug }: { categories: Cat[]; activeSlug: string | null }) {
  const base = "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  const on = "bg-wsb-green text-white border-wsb-green";
  const off = "border-wsb-green text-wsb-green hover:bg-wsb-green/5";
  return (
    <nav className="flex flex-wrap gap-2" aria-label="효능별 카테고리">
      <Link href="/products" className={`${base} ${activeSlug === null ? on : off}`}
        aria-current={activeSlug === null ? "page" : undefined}>
        전체
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`/category/${c.slug}`} className={`${base} ${activeSlug === c.slug ? on : off}`}
          aria-current={activeSlug === c.slug ? "page" : undefined}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 3: 통과 확인** — Run `npx vitest run src/components/catalog/category-filter.test.tsx`. Expected: PASS (2 passed).

- [ ] **Step 4: 커밋**
```bash
git add -A && git commit -m "feat: add CategoryFilter component"
```

---

### Task 7: 목록 페이지 + 카테고리 페이지 (Server Components)

**Files:** Create `src/app/products/page.tsx`, `src/app/category/[slug]/page.tsx`. Add a category helper query.

- [ ] **Step 1: 카테고리 목록 쿼리 추가** — `src/db/queries/products.ts` 하단에 추가:

```ts
export async function listCategories(): Promise<{ slug: string; name: string }[]> {
  const db = getDb();
  const rows = await db.select().from(categories).orderBy(categories.sortOrder);
  return rows.map((c) => ({ slug: c.slug, name: c.name }));
}
```

- [ ] **Step 2: 전체 목록 페이지** — Create `src/app/products/page.tsx`:

```tsx
import { listPublishedProducts, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([listPublishedProducts(), listCategories()]);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">전체 상품</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={null} />
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: 카테고리 페이지** — Create `src/app/category/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { listProductsByCategory, listCategories } from "@/db/queries/products";
import { ProductGrid } from "@/components/catalog/product-grid";
import { CategoryFilter } from "@/components/catalog/category-filter";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === slug);
  if (!current) notFound();
  const products = await listProductsByCategory(slug);
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">{current.name}</h1>
      <div className="mt-5">
        <CategoryFilter categories={categories} activeSlug={slug} />
      </div>
      <div className="mt-8">
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 빌드 확인** — Run `npm run build`. Expected: 컴파일 성공, 라우트에 `/products`, `/category/[slug]` 표시. (빌드 시 DB 접근: 이 페이지들은 동적(`ƒ`)으로 렌더되거나, 빌드 중 데이터 패치가 .env.local로 동작해야 함. 빌드가 DATABASE_URL을 요구하면 동적 렌더링으로 두기 위해 각 페이지 상단에 `export const dynamic = "force-dynamic";` 추가.)

- [ ] **Step 5: 커밋**
```bash
git add -A && git commit -m "feat: add products listing and category pages"
```

---

### Task 8: 상품 상세 페이지(PDP) + ComplianceNotice (TDD)

**Files:** Create `src/components/catalog/compliance-notice.tsx` (+ `.test.tsx`), `src/app/products/[slug]/page.tsx`.

- [ ] **Step 1: ComplianceNotice 실패 테스트** — Create `src/components/catalog/compliance-notice.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceNotice } from "./compliance-notice";

describe("ComplianceNotice", () => {
  it("심의필 번호와 질병 고지 문구를 렌더한다", () => {
    render(
      <ComplianceNotice
        reviewPhraseNo="제2026-FOCUS-001"
        noticeText="본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다."
        reportNo="제2026-0000000001호"
        functionality="인지능력 개선에 도움"
        intakeNotice="임산부 주의"
      />,
    );
    expect(screen.getByText(/제2026-FOCUS-001/)).toBeInTheDocument();
    expect(screen.getByText(/질병의 예방 및 치료를 위한 것이 아닙니다/)).toBeInTheDocument();
    expect(screen.getByText(/제2026-0000000001호/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현** — Create `src/components/catalog/compliance-notice.tsx`:

```tsx
export function ComplianceNotice(props: {
  reviewPhraseNo: string | null;
  noticeText: string | null;
  reportNo: string | null;
  functionality: string | null;
  intakeNotice: string | null;
}) {
  const notice = props.noticeText ?? "본 제품은 질병의 예방 및 치료를 위한 것이 아닙니다.";
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
      <p className="font-bold">⚠ 건강기능식품 표시·광고 심의필{props.reviewPhraseNo ? ` (${props.reviewPhraseNo})` : ""}</p>
      <p className="mt-1 font-semibold">{notice}</p>
      {props.functionality && <p className="mt-2">· 기능성: {props.functionality}</p>}
      {props.intakeNotice && <p className="mt-1">· 섭취 시 주의사항: {props.intakeNotice}</p>}
      {props.reportNo && <p className="mt-1 font-mono text-[11px]">품목보고번호: {props.reportNo}</p>}
    </div>
  );
}
```

- [ ] **Step 3: 통과 확인** — Run `npx vitest run src/components/catalog/compliance-notice.test.tsx`. Expected: PASS.

- [ ] **Step 4: PDP 페이지** — Create `src/app/products/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/db/queries/products";
import { ComplianceNotice } from "@/components/catalog/compliance-notice";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const zone = product.isNutrogin ? "bg-ng-cobalt text-white" : "bg-stone-100 text-stone-400";
  return (
    <article className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-2">
      <div className={`flex min-h-80 items-center justify-center rounded-lg ${zone}`}>
        <span className="font-mono text-sm">{product.name}</span>
      </div>
      <div>
        {product.isNutrogin && (
          <span className="font-mono text-xs font-bold tracking-wide text-ng-cobalt">NUTROGIN</span>
        )}
        <h1 className="mt-1 text-2xl font-extrabold text-wsb-carbon">{product.name}</h1>
        {product.summary && <p className="mt-2 text-stone-600">{product.summary}</p>}
        <p className="mt-4 text-2xl font-extrabold text-wsb-carbon">{product.priceLabel}</p>

        <div className="mt-4 rounded-md border border-stone-200 p-3 text-sm">
          <p className="mb-2 font-semibold text-stone-700">옵션</p>
          <ul className="space-y-1 text-stone-600">
            {product.variants.map((v) => (
              <li key={v.id} className="flex justify-between">
                <span>{v.name}{v.stock === 0 ? " (품절)" : ""}</span>
                <span className="font-mono">{v.priceDelta > 0 ? `+₩${v.priceDelta.toLocaleString("ko-KR")}` : "기본가"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-stone-400">장바구니·결제는 다음 계획서(Plan 3)에서 연결됩니다.</p>
        </div>

        {product.ingredients && (
          <p className="mt-4 text-xs text-stone-500">원료/함량: <span className="font-mono text-stone-700">{product.ingredients}</span></p>
        )}

        <div className="mt-5">
          <ComplianceNotice
            reviewPhraseNo={product.reviewPhraseNo}
            noticeText={product.noticeText}
            reportNo={product.reportNo}
            functionality={product.functionality}
            intakeNotice={product.intakeNotice}
          />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: 빌드 확인** — Run `npm run build` (필요 시 PDP에도 `export const dynamic = "force-dynamic";`). Expected: 성공, `/products/[slug]` 라우트 표시.

- [ ] **Step 6: 커밋**
```bash
git add -A && git commit -m "feat: add product detail page (PDP) with compliance notice"
```

---

### Task 9: 실제 모바일 내비 드로어 (Plan 1 후속 #1)

기존 `메뉴 열기` stub 버튼을 실제 드로어로 만든다.

**Files:** Create `src/components/layout/mobile-nav.tsx` (+ `.test.tsx`); Modify `src/components/layout/site-header.tsx`.

- [ ] **Step 1: 실패 테스트** — Create `src/components/layout/mobile-nav.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "./mobile-nav";

const items = [
  { href: "/category/brain-focus", label: "두뇌·집중" },
  { href: "/brand", label: "브랜드" },
];

describe("MobileNav", () => {
  it("처음엔 메뉴가 닫혀 있다", () => {
    render(<MobileNav items={items} />);
    expect(screen.queryByRole("link", { name: "두뇌·집중" })).not.toBeInTheDocument();
  });
  it("버튼을 누르면 메뉴가 열리고 링크가 보인다", async () => {
    render(<MobileNav items={items} />);
    await userEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toHaveAttribute("href", "/category/brain-focus");
  });
});
```

- [ ] **Step 2: 실패 확인 → 구현** — Create `src/components/layout/mobile-nav.tsx`:

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Item = { href: string; label: string };

export function MobileNav({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 rounded-sm";
  return (
    <div className="md:hidden">
      <button type="button" aria-label="메뉴 열기" className={`text-wsb-carbon ${ring}`} onClick={() => setOpen(true)}>
        <Menu size={20} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <nav
            className="absolute right-0 top-0 flex h-full w-64 flex-col gap-1 bg-wsb-lab p-5"
            aria-label="모바일 메뉴"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" aria-label="메뉴 닫기" className={`self-end text-wsb-carbon ${ring}`} onClick={() => setOpen(false)}>
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
            {items.map((it) => (
              <Link key={it.href} href={it.href} className={`py-2 text-sm font-semibold text-wsb-carbon ${ring}`} onClick={() => setOpen(false)}>
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 통과 확인** — Run `npx vitest run src/components/layout/mobile-nav.test.tsx`. Expected: PASS (2 passed).

- [ ] **Step 4: 헤더에 장착** — `src/components/layout/site-header.tsx` 수정:
  - 상단 import 추가: `import { MobileNav } from "./mobile-nav";`
  - 기존의 인라인 `md:hidden` `<button aria-label="메뉴 열기">...</button>` 블록을 제거하고, 그 자리에 `<MobileNav items={[...NAV.map(n => ({ href: \`/category/${n.slug}\`, label: n.label })), { href: "/brand", label: "브랜드" }, { href: "/support", label: "고객지원" }]} />` 를 렌더.
  - `Menu` 가 더 이상 site-header에서 직접 쓰이지 않으면 lucide import에서 제거(`Search, User, ShoppingBag`만 유지).
  - 기존 헤더 테스트(`site-header.test.tsx`)의 "메뉴 열기 버튼" 단언이 깨지지 않는지 확인: MobileNav가 동일 `aria-label="메뉴 열기"` 버튼을 렌더하므로 통과해야 함. jsdom 기본 뷰포트에서 `md:hidden`은 요소를 DOM에서 제거하지 않으므로(CSS만 적용) 버튼은 존재 → 통과.

- [ ] **Step 5: 전체 테스트 + 빌드** — Run `npm test && npm run build`. Expected: 전부 통과, 빌드 성공.

- [ ] **Step 6: 커밋**
```bash
git add -A && git commit -m "feat: real mobile nav drawer; wire into header"
```

---

## Self-Review (작성자 점검 결과)

**1. 스펙/후속 커버리지:**
- 카탈로그·효능 필터·PDP(§4 IA, §2 v1 범위) → Task 5/6/7/8 ✅
- 건기식 규제 PDP 표시(§8) → Task 1(컬럼) + Task 8(ComplianceNotice) ✅
- 듀얼 브랜드 NUTROGIN 존(§9) → ProductCard/PDP 코발트 테마 ✅
- Plan 1 후속 #1 모바일 내비 → Task 9 ✅ / #2 규제 컬럼 → Task 1 ✅
- 데이터 모델(§5) Product/Variant/Category 활용, 시드 → Task 2 ✅
- (장바구니·결제는 Plan 3, 명시적으로 PDP에 안내 문구로 연결)

**2. 플레이스홀더 스캔:** 모든 코드 스텝에 실제 코드 포함. 임시 검증 스크립트(`_check-repo.mjs`)는 삭제 명시.

**3. 타입 일관성:** `ProductSummary`(Task3)를 ProductCard/Grid/repo가 동일 사용. `ProductDetail`(Task4)을 PDP가 사용. `ComplianceNotice` props가 `ProductDetail` 필드와 일치(reviewPhraseNo/noticeText/reportNo/functionality/intakeNotice). `listCategories`(Task7)·`getProductBySlug`(Task4) 시그니처 일관. seed의 `noticeText` 문구와 ComplianceNotice 기본 문구·테스트 일치.

**리스크:** Server Component 페이지의 빌드 시 데이터 패치 — 빌드 환경에 `DATABASE_URL`이 없으면 정적 생성 시도에서 실패할 수 있으므로, DB를 읽는 페이지(`/products`, `/category/[slug]`, `/products/[slug]`)는 `export const dynamic = "force-dynamic"`로 동적 렌더링을 강제(빌드 시 DB 접근 회피). 배포 후 런타임에 Supabase로 패치.
