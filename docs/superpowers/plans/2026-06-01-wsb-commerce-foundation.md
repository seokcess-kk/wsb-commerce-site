# WSB 종합몰 — Foundation & Infra 구현 계획 (Plan 1/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vercel에 배포 가능한 Next.js 스켈레톤을 세우고 — Supabase/Drizzle 데이터 계층, 듀얼 브랜드 디자인 토큰, WSB 공통 쉘(헤더/푸터), 테스트 인프라 — 이후 모든 기능 계획서가 올라설 토대를 만든다.

**Architecture:** Next.js App Router(서버 컴포넌트 중심) 단일 앱. 데이터는 Supabase Postgres에 두고 Drizzle ORM으로 타입 안전하게 접근, 인증/스토리지는 Supabase 제공 기능 사용. 디자인은 CSS 변수 기반 듀얼 브랜드 토큰(WSB 쉘 / NUTROGIN 존)으로 컴포넌트가 컨텍스트별 테마를 갖게 한다. 순수 로직·컴포넌트는 Vitest로 TDD, 스키마는 형상 테스트로 회귀를 막는다.

**Tech Stack:** Next.js (App Router, TypeScript) · Tailwind CSS v4 · shadcn/ui · lucide-react · Drizzle ORM · Supabase(Postgres·Auth·Storage) · Zod · Vitest + Testing Library · Vercel

---

## 디자인 품질 기준 (모든 UI 태스크에 강제)

> 사용자 요구: **"바이브코딩스럽지 않은" 프로덕션급 디자인.** 흔한 AI 생성물 신호를 금지한다.

- **금지:** 이모지 아이콘, 보라/블루 기본 그라데이션, 무성의한 기본 shadcn 색, 의미 없는 중앙정렬 카드 나열, 과한 둥근 모서리·그림자 남발.
- **필수:** lucide-react SVG 아이콘 · 브랜드 토큰 색(WSB 그린·카본·랩화이트 / NUTROGIN 코발트·네온)만 사용 · 의도적 타이포 위계(Pretendard 본문 + JetBrains Mono 데이터/뱃지) · 8/16/32px 그리드 정렬 · 절제된 모션 · 접근성(명도대비·키보드·aria).
- UI 작업 시 `frontend-design` 스킬 원칙을 따른다. 컴포넌트는 컨텍스트(WSB 쉘 vs NUTROGIN 존)에 맞는 테마를 갖는다.

## 파일 구조 (이 계획서가 만드는 것)

```
wsb-commerce-site/
├─ package.json, tsconfig.json, next.config.ts
├─ vitest.config.ts, vitest.setup.ts          # 테스트 인프라
├─ drizzle.config.ts                           # 마이그레이션 설정
├─ .env.local, .env.example                    # 환경변수
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                            # 루트 레이아웃(쉘 장착)
│  │  ├─ page.tsx                              # 홈 플레이스홀더
│  │  └─ api/health/route.ts                   # 헬스체크
│  ├─ components/layout/
│  │  ├─ site-header.tsx                       # WSB 헤더(효능 내비)
│  │  └─ site-footer.tsx                       # WSB 푸터(규제 고지)
│  ├─ db/
│  │  ├─ index.ts                              # Drizzle 클라이언트
│  │  └─ schema/
│  │     ├─ index.ts                           # 스키마 배럴
│  │     ├─ categories.ts                      # 효능 카테고리
│  │     ├─ products.ts                        # 상품
│  │     └─ product-variants.ts                # 옵션/재고
│  ├─ lib/
│  │  ├─ env.ts                                # 환경변수 검증(zod)
│  │  ├─ format.ts                             # 통화 등 포매터(순수)
│  │  ├─ design-tokens.ts                      # 브랜드 색 상수(JS용)
│  │  └─ supabase/{client.ts,server.ts}        # Supabase 클라이언트
│  └─ styles/
│     └─ globals.css                           # Tailwind + 듀얼브랜드 CSS 변수
```

**책임 분리 원칙:** 함께 바뀌는 것은 함께 둔다(스키마는 도메인별 파일). 순수 로직(`lib/`)과 데이터(`db/`)와 UI(`components/`)를 분리해 각 파일이 한 가지 책임만 갖게 한다.

---

## 사전 조건

- Node 20+ (확인됨: v24.12.0), npm 11
- Supabase 프로젝트 1개(개발용). 대시보드에서 `Project URL`, `anon key`, `Connection string(Direct)` 확보
- 작업은 git 브랜치에서 진행. 저장소가 없으면 Task 0에서 초기화

---

### Task 0: 저장소 초기화

**Files:**
- Create: `.gitignore` (create-next-app이 생성하지만, 스캐폴드 전 git을 먼저 잡는다)

- [ ] **Step 1: git 저장소 초기화**

```bash
git init
git commit --allow-empty -m "chore: init repository"
```

- [ ] **Step 2: 작업 브랜치 생성**

```bash
git checkout -b feat/foundation
```

Expected: `Switched to a new branch 'feat/foundation'`

---

### Task 1: Next.js 앱 스캐폴드

**Files:**
- Create: 프로젝트 루트 전반 (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/*`, `src/styles/globals.css` 등)

- [ ] **Step 1: create-next-app 실행 (현재 폴더에 생성)**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: `src/app/` 과 `package.json` 생성, `Success! Created ...` 출력. 기존 `docs/`, `reference/`, `.superpowers/`, `.claude/` 는 보존됨.

- [ ] **Step 2: globals.css 위치 정리**

create-next-app은 `src/app/globals.css`를 만든다. 본 계획은 `src/styles/globals.css`를 사용하므로 이동한다.

```bash
mkdir -p src/styles
git mv src/app/globals.css src/styles/globals.css 2>/dev/null || mv src/app/globals.css src/styles/globals.css
```

`src/app/layout.tsx`의 import 경로를 수정:

```tsx
// 변경 전: import "./globals.css";
import "@/styles/globals.css";
```

- [ ] **Step 3: 개발 서버 기동 확인**

Run: `npm run dev` (기동 후 Ctrl+C)
Expected: `Local: http://localhost:3000` 출력, 에러 없음

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`, 라우트 목록에 `/` 표시

- [ ] **Step 5: shadcn/ui · lucide 초기화**

```bash
npx shadcn@latest init -d
npm install lucide-react
```

Expected: `components.json` 생성, `src/lib/utils.ts`(cn 헬퍼) 생성, `lucide-react` 설치. 이후 필요한 프리미티브는 계획서별로 `npx shadcn@latest add button input ...` 로 추가한다(기본 스타일을 그대로 쓰지 말고 브랜드 토큰으로 덮어쓴다 — 디자인 품질 기준 참조).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "chore: scaffold next.js app with tailwind, shadcn, lucide"
```

---

### Task 2: 테스트 인프라 (Vitest) + 첫 순수 함수 TDD

상품가·합계 표시에 쓸 통화 포매터를 첫 TDD 대상으로 삼아 테스트 파이프라인을 검증한다.

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `package.json` (test 스크립트)

- [ ] **Step 1: 테스트 의존성 설치**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths
```

- [ ] **Step 2: Vitest 설정 작성**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: package.json 에 test 스크립트 추가**

`package.json` 의 `"scripts"` 에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 실패하는 테스트 작성**

Create `src/lib/format.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatKRW } from "./format";

describe("formatKRW", () => {
  it("정수 금액을 원화 표기로 변환한다", () => {
    expect(formatKRW(39000)).toBe("₩39,000");
  });

  it("0원을 처리한다", () => {
    expect(formatKRW(0)).toBe("₩0");
  });
});
```

- [ ] **Step 5: 테스트 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module './format'` (또는 export 없음)

- [ ] **Step 6: 최소 구현**

Create `src/lib/format.ts`:

```ts
const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export function formatKRW(amount: number): string {
  return krwFormatter.format(amount);
}
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npm test`
Expected: PASS (2 passed)

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "test: add vitest infra and formatKRW with tests"
```

---

### Task 3: 환경변수 검증 모듈 (Zod)

부팅 시 누락된 환경변수를 즉시 잡는다.

**Files:**
- Create: `src/lib/env.ts`, `src/lib/env.test.ts`
- Create: `.env.example`
- Modify: `.env.local` (로컬 실제값 — 커밋 금지)

- [ ] **Step 1: zod 설치**

```bash
npm install zod
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `src/lib/env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgresql://user:pass@host:5432/postgres",
};

describe("parseEnv", () => {
  it("유효한 환경변수를 통과시킨다", () => {
    expect(parseEnv(valid).DATABASE_URL).toBe(valid.DATABASE_URL);
  });

  it("URL이 아니면 예외를 던진다", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow();
  });

  it("필수값 누락 시 예외를 던진다", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "" })).toThrow();
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test src/lib/env.test.ts`
Expected: FAIL — `parseEnv` 미정의

- [ ] **Step 4: 최소 구현**

Create `src/lib/env.ts`:

```ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

export const env: Env = parseEnv(process.env);
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test src/lib/env.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 6: .env 파일 작성**

Create `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

`.env.local` 에는 실제 Supabase 값을 넣는다(이 파일은 `.gitignore`에 이미 포함됨 — 확인만).

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add zod-validated env module"
```

---

### Task 4: Drizzle + 핵심 스키마 (카테고리·상품·옵션)

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/index.ts`
- Create: `src/db/schema/{categories.ts,products.ts,product-variants.ts,index.ts}`
- Create: `src/db/schema/schema.test.ts`

- [ ] **Step 1: Drizzle 설치**

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

- [ ] **Step 2: 카테고리 스키마 작성**

Create `src/db/schema/categories.ts`:

```ts
import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

// 효능 기반 대분류 (두뇌·집중 / 면역 / 수면 / 활력 …)
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 3: 상품 스키마 작성**

Create `src/db/schema/products.ts`:

```ts
import { pgTable, uuid, varchar, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { categories } from "./categories";

// 건기식 규제: 심의필 문구·고지를 상품 데이터에 보관
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  brand: varchar("brand", { length: 80 }).notNull().default("WSB"), // 'NUTROGIN' | 'WSB' 등
  categoryId: uuid("category_id").references(() => categories.id),
  basePrice: integer("base_price").notNull(), // 원 단위 정수
  summary: text("summary"),
  description: text("description"),
  reviewPhraseNo: varchar("review_phrase_no", { length: 80 }), // 표시·광고 심의필 번호
  noticeText: text("notice_text"), // "질병 예방·치료 아님" 등 고지
  images: jsonb("images").$type<string[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: 옵션/재고 스키마 작성**

Create `src/db/schema/product-variants.ts`:

```ts
import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { products } from "./products";

// 단일/단일옵션/조합옵션을 variant 1행 단위로 표현 (재고는 variant에 귀속)
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull().default("기본"), // 예: "1박스", "3박스 세트"
  sku: varchar("sku", { length: 80 }),
  priceDelta: integer("price_delta").notNull().default(0), // basePrice 대비 가감(원)
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 5: 스키마 배럴 작성**

Create `src/db/schema/index.ts`:

```ts
export * from "./categories";
export * from "./products";
export * from "./product-variants";
```

- [ ] **Step 6: 실패하는 스키마 형상 테스트 작성**

Create `src/db/schema/schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getTableColumns } from "drizzle-orm";
import { categories, products, productVariants } from "./index";

describe("schema 형상", () => {
  it("products 는 규제 고지 컬럼을 갖는다", () => {
    const cols = getTableColumns(products);
    expect(cols).toHaveProperty("reviewPhraseNo");
    expect(cols).toHaveProperty("noticeText");
    expect(cols).toHaveProperty("basePrice");
  });

  it("categories 는 slug 를 갖는다", () => {
    expect(getTableColumns(categories)).toHaveProperty("slug");
  });

  it("productVariants 는 stock 을 갖는다", () => {
    expect(getTableColumns(productVariants)).toHaveProperty("stock");
  });
});
```

- [ ] **Step 7: 테스트 실패→통과 확인**

Run: `npm test src/db/schema/schema.test.ts`
Expected: 처음엔 import 경로/정의 문제로 조정 후 PASS (3 passed). (스키마 파일이 모두 있으면 바로 PASS)

- [ ] **Step 8: Drizzle 클라이언트 작성**

Create `src/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const client = postgres(env.DATABASE_URL, { prepare: false });
export const db = drizzle(client, { schema });
export { schema };
```

- [ ] **Step 9: drizzle.config 작성**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

`package.json` scripts 에 추가:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

- [ ] **Step 10: 마이그레이션 생성**

Run: `npm run db:generate`
Expected: `drizzle/0000_*.sql` 생성, 3개 테이블 CREATE 문 포함

- [ ] **Step 11: 마이그레이션 적용(개발 Supabase DB)**

`.env.local` 에 실제 `DATABASE_URL` 설정 후:
Run: `npm run db:migrate`
Expected: 에러 없이 완료. Supabase 대시보드 Table editor 에 `categories/products/product_variants` 노출

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat: add drizzle schema for categories, products, variants"
```

---

### Task 5: Supabase 클라이언트 (브라우저/서버)

인증·스토리지에서 쓸 Supabase 클라이언트를 준비한다(사용은 이후 계획서).

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`

- [ ] **Step 1: 패키지 설치**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: 브라우저 클라이언트 작성**

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

- [ ] **Step 3: 서버 클라이언트 작성**

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component에서 호출 시 무시 (미들웨어가 세션 갱신 담당 — 인증 계획서에서 처리)
        }
      },
    },
  });
}
```

- [ ] **Step 4: 타입체크 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add supabase browser/server clients"
```

---

### Task 6: 듀얼 브랜드 디자인 토큰

승인된 §9 전략: 쉘은 WSB(그린/카본/랩화이트), NUTROGIN 존은 코발트/네온.

**Files:**
- Modify: `src/styles/globals.css`
- Create: `src/lib/design-tokens.ts`, `src/lib/design-tokens.test.ts`

- [ ] **Step 1: CSS 변수 + Tailwind 테마 작성**

`src/styles/globals.css` 의 `@import "tailwindcss";` 아래에 추가:

```css
:root {
  /* WSB 쉘 */
  --wsb-green: #0F5132;
  --wsb-carbon: #1A1F1B;
  --wsb-lab: #FAFBF9;
  /* NUTROGIN 존 */
  --ng-cobalt: #0047FF;
  --ng-neon: #E8FF00;
  --ng-charcoal: #111111;
  --ng-offwhite: #FAFAFA;
}

@theme inline {
  --color-wsb-green: var(--wsb-green);
  --color-wsb-carbon: var(--wsb-carbon);
  --color-wsb-lab: var(--wsb-lab);
  --color-ng-cobalt: var(--ng-cobalt);
  --color-ng-neon: var(--ng-neon);
  --color-ng-charcoal: var(--ng-charcoal);
  --color-ng-offwhite: var(--ng-offwhite);

  /* 브랜드 폰트: 본문 Pretendard, 데이터/뱃지 JetBrains Mono(레이아웃에서 --font-jetbrains 주입) */
  --font-sans: "Pretendard Variable", Pretendard, ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace;
}
```

이제 `bg-wsb-green`, `text-ng-cobalt`, `bg-ng-neon` 등의 유틸리티가 생긴다.

- [ ] **Step 2: 실패하는 토큰 상수 테스트 작성**

JS(차트·인라인 스타일)에서 쓸 색 상수의 단일 출처. Create `src/lib/design-tokens.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { brandColors } from "./design-tokens";

describe("brandColors", () => {
  it("WSB·NUTROGIN 핵심 색을 노출한다", () => {
    expect(brandColors.wsb.green).toBe("#0F5132");
    expect(brandColors.nutrogin.cobalt).toBe("#0047FF");
    expect(brandColors.nutrogin.neon).toBe("#E8FF00");
  });
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test src/lib/design-tokens.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 4: 토큰 상수 구현**

Create `src/lib/design-tokens.ts`:

```ts
// CSS 변수(globals.css)와 값이 일치해야 한다 — 단일 출처 역할
export const brandColors = {
  wsb: { green: "#0F5132", carbon: "#1A1F1B", lab: "#FAFBF9" },
  nutrogin: { cobalt: "#0047FF", neon: "#E8FF00", charcoal: "#111111", offwhite: "#FAFAFA" },
} as const;
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test src/lib/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add dual-brand design tokens (css vars + js constants)"
```

---

### Task 7: WSB 공통 쉘 (헤더/푸터)

**Files:**
- Create: `src/components/layout/site-header.tsx`, `site-footer.tsx`
- Create: `src/components/layout/site-header.test.tsx`, `site-footer.test.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`

- [ ] **Step 1: 효능 내비 상수 + 실패하는 헤더 테스트 작성**

Create `src/components/layout/site-header.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("WSB 로고와 효능 내비를 렌더한다", () => {
    render(<SiteHeader />);
    expect(screen.getByText("WSB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "두뇌·집중" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "면역" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/components/layout/site-header.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 헤더 구현**

Create `src/components/layout/site-header.tsx`:

```tsx
import Link from "next/link";
import { Search, User, ShoppingBag } from "lucide-react";

const NAV = [
  { slug: "brain-focus", label: "두뇌·집중" },
  { slug: "immune", label: "면역" },
  { slug: "sleep", label: "수면" },
  { slug: "vitality", label: "활력" },
];

const UTILS = [
  { href: "/search", label: "검색", Icon: Search },
  { href: "/account", label: "내 계정", Icon: User },
  { href: "/cart", label: "장바구니", Icon: ShoppingBag },
];

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-stone-200 bg-wsb-lab px-6 py-3.5">
      <Link href="/" className="leading-none text-lg font-extrabold tracking-tight text-wsb-green">
        WSB
        <span className="mt-0.5 block font-mono text-[9px] font-medium tracking-wide text-stone-500">
          WOORI SMART BIO
        </span>
      </Link>
      <nav className="flex gap-5 text-sm font-semibold text-wsb-carbon">
        {NAV.map((n) => (
          <Link key={n.slug} href={`/category/${n.slug}`} className="transition-colors hover:text-wsb-green">
            {n.label}
          </Link>
        ))}
        <Link href="/brand" className="transition-colors hover:text-wsb-green">브랜드</Link>
        <Link href="/support" className="transition-colors hover:text-wsb-green">고객지원</Link>
      </nav>
      <div className="flex gap-4 text-wsb-carbon">
        {UTILS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} aria-label={label} className="transition-colors hover:text-wsb-green">
            <Icon size={20} strokeWidth={1.75} aria-hidden />
          </Link>
        ))}
      </div>
    </header>
  );
}
```

> 폰트: 브랜드 폰트는 본문 **Pretendard** + 데이터/뱃지 **JetBrains Mono**. 이 연결은 같은 Task의 루트 레이아웃 스텝(Step 9)에서 처리한다 — `next/font/google`의 `JetBrains_Mono`를 `--font-mono`로, Pretendard는 `next/font/local` 또는 CDN으로 본문 기본 폰트에 연결하고 create-next-app 기본 Geist를 교체한다.

- [ ] **Step 4: 헤더 테스트 통과 확인**

Run: `npm test src/components/layout/site-header.test.tsx`
Expected: PASS

- [ ] **Step 5: 실패하는 푸터 테스트 작성**

Create `src/components/layout/site-footer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("건강기능식품 규제 고지 문구를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/질병의 예방·치료를 위한 것이 아닙니다/)).toBeInTheDocument();
  });

  it("사업자 정보를 포함한다", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/우리스마트바이오/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: 푸터 테스트 실패 확인**

Run: `npm test src/components/layout/site-footer.test.tsx`
Expected: FAIL — 모듈 없음

- [ ] **Step 7: 푸터 구현**

Create `src/components/layout/site-footer.tsx`:

```tsx
export function SiteFooter() {
  return (
    <footer className="bg-wsb-carbon px-6 py-5 text-[11px] leading-7 text-stone-400">
      <p>
        <strong className="text-wsb-lab">(주)우리스마트바이오</strong> · 대표 ○○○ · 사업자등록번호 000-00-00000 ·
        통신판매업 0000-서울-0000
      </p>
      <p>
        <a href="/policy/privacy">개인정보처리방침</a> · <a href="/policy/terms">이용약관</a> ·{" "}
        <strong className="text-wsb-lab">본 제품은 질병의 예방·치료를 위한 것이 아닙니다.</strong> · 건강기능식품 표시·광고 심의필
      </p>
    </footer>
  );
}
```

- [ ] **Step 8: 푸터 테스트 통과 확인**

Run: `npm test src/components/layout/site-footer.test.tsx`
Expected: PASS

- [ ] **Step 9: 루트 레이아웃에 쉘 장착**

Replace `src/app/layout.tsx` 내용:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "WSB 스토어",
  description: "Engineered by Data, Grown by Design.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={jetbrainsMono.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white font-sans text-ng-charcoal antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
```

> create-next-app이 기본 생성한 Geist 폰트 import는 제거한다(위 코드가 대체). `font-sans`/`font-mono`는 Task 6의 `@theme` 토큰으로 연결된다.

- [ ] **Step 10: 홈 플레이스홀더 교체**

Replace `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-ng-cobalt">New Launch · NUTROGIN</p>
      <h1 className="mt-2 text-3xl font-extrabold">Sharper mind, brighter day.</h1>
      <p className="mt-3 text-stone-600">상품 카탈로그는 다음 계획서에서 구현됩니다.</p>
    </section>
  );
}
```

- [ ] **Step 11: 전체 테스트 + 빌드 확인**

Run: `npm test && npm run build`
Expected: 모든 테스트 PASS, 빌드 성공

- [ ] **Step 12: 커밋**

```bash
git add -A
git commit -m "feat: add WSB site shell (header/footer) with compliance notice"
```

---

### Task 8: 헬스체크 API + 배포 설정

**Files:**
- Create: `src/app/api/health/route.ts`, `src/app/api/health/route.test.ts`

- [ ] **Step 1: 실패하는 라우트 테스트 작성**

Create `src/app/api/health/route.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("status ok 를 반환한다", async () => {
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test src/app/api/health/route.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 3: 라우트 구현**

Create `src/app/api/health/route.ts`:

```ts
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test src/app/api/health/route.test.ts`
Expected: PASS

- [ ] **Step 5: Vercel 배포 (수동, 최초 1회)**

```bash
npm i -g vercel        # 미설치 시
vercel link            # 프로젝트 연결
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DATABASE_URL
vercel --prod          # 또는 미리보기: vercel
```

Expected: 배포 URL 발급, `https://<url>/api/health` 가 `{"status":"ok"}` 반환

- [ ] **Step 6: 커밋 & 브랜치 마무리**

```bash
git add -A
git commit -m "feat: add health endpoint and deploy config"
```

이후 `superpowers:finishing-a-development-branch` 로 병합 옵션을 결정한다.

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지 (Plan 1 범위 = Foundation):**
- 기술 아키텍처(§6) Next.js+Supabase+Drizzle+Tailwind/shadcn → Task 1,4,5,6 ✅
- 듀얼 브랜드 디자인 시스템(§9) → Task 6,7 ✅
- 규제 고지 표준 배치(§8) 푸터/상품 스키마 → Task 4(products.noticeText), Task 7(푸터 문구) ✅
- 데이터 모델 스케치(§5) 중 Product/Variant/Category → Task 4 ✅ (Order/Payment/User/Review 등은 해당 기능 계획서에서 생성 — 의도된 분할)
- IA 헤더 효능 내비(§4) → Task 7 ✅
- (기능 범위 카탈로그·결제·회원·어드민은 Plan 2~5 — 본 계획서 범위 밖, 로드맵에 명시)

**2. 플레이스홀더 스캔:** 모든 코드 스텝에 실제 코드 포함. 사업자번호·심의번호의 `○○○`/`000`은 클라이언트 실제값 입력 대기(플레이스홀더 텍스트가 아니라 데이터 항목) — 의도적.

**3. 타입 일관성:** `parseEnv`/`env`(Task3) → `db/index.ts`(Task4)·supabase 클라이언트(Task5)에서 동일 사용. `brandColors`(Task6) 형태와 테스트 일치. `formatKRW`(Task2) 시그니처 일관. `products.basePrice`/`productVariants.priceDelta` 정수(원) 규약 일관.

**버전 주의:** create-next-app 최신은 Tailwind v4(`@import "tailwindcss"` + `@theme`)를 생성. 만약 환경이 Tailwind v3로 생성되면 Task6의 `@theme` 대신 `tailwind.config.ts` 의 `theme.extend.colors` 에 동일 색을 등록한다.

---

## 실행 결과 & 다음 플랜으로 넘길 후속 과제 (2026-06-01 완료)

**완료:** 10개 커밋(`7bce854`→`4264312`), 19개 테스트 통과, `npm run build`/`tsc --noEmit` 클린. 실제 스택: Next.js 16.2.6 · Tailwind v4 · shadcn(base-nova) · drizzle-orm 0.45 · zod 4 · @supabase/ssr 0.10 · Vitest 4.

**자격증명 대기로 보류된 런타임 스텝(코드/설정은 완료):**
- Task 4-11 `npm run db:migrate` — 실제 `DATABASE_URL`(Supabase) 필요. 마이그레이션 SQL(`drizzle/0000_*.sql`)은 생성·커밋됨.
- Task 8-5 `vercel` 배포 + 환경변수 등록 — Vercel 인증 + Supabase 값 필요.

**Plan 2(Storefront) 시작 시 처리할 후속:**
1. 모바일 내비 실제 구현 — 현재 `메뉴 열기` 버튼은 동작 없는 stub. 드로어 + 상태 + 테스트 추가.
2. `products` 규제 컬럼 확장 — 품목보고번호·기능성 내용·섭취 시 주의사항·원료/함량 등(신규 Drizzle 마이그레이션).
3. (선택) Pretendard를 CDN `<link>` 대신 `next/font/local`로 셀프호스팅(렌더 블로킹 제거).
4. `.gitignore`에 `!.env.example` 예외 추가(현재 force-add 상태라 견고성↑).

**비고:** `env`·`db`는 lazy 접근만 사용(스프레드/`in` 검사 금지). 금액은 정수(원) 규약.
