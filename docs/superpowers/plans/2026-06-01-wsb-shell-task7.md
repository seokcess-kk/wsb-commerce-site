# WSB Common Shell (Task 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create production-grade SiteHeader + SiteFooter components with TDD, wire them into the Next.js root layout with brand fonts (Pretendard body + JetBrains Mono), and replace the default home page with a placeholder.

**Architecture:** Two layout components (`SiteHeader`, `SiteFooter`) live in `src/components/layout/`. Tests are written first (TDD red-green cycle). The root `layout.tsx` replaces Geist font imports with JetBrains_Mono via `next/font/google` and injects Pretendard via a CDN `<link>`. `page.tsx` is replaced with a minimal brand placeholder.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4 brand tokens, lucide-react SVG icons, Vitest + @testing-library/react (jsdom), TypeScript.

---

### Task 1: Failing Header Test

**Files:**
- Create: `src/components/layout/site-header.test.tsx`

- [ ] **Step 1: Create the layout directory and failing test**

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

- [ ] **Step 2: Run test — confirm FAIL (module not found)**

Run: `npm test src/components/layout/site-header.test.tsx`
Expected: FAIL — "Cannot find module './site-header'"

---

### Task 2: Header Implementation (Green)

**Files:**
- Create: `src/components/layout/site-header.tsx`

- [ ] **Step 3: Implement SiteHeader**

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

- [ ] **Step 4: Run header test — confirm PASS**

Run: `npm test src/components/layout/site-header.test.tsx`
Expected: PASS (1 test)

---

### Task 3: Failing Footer Test

**Files:**
- Create: `src/components/layout/site-footer.test.tsx`

- [ ] **Step 5: Create failing footer test**

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

- [ ] **Step 6: Run test — confirm FAIL (module not found)**

Run: `npm test src/components/layout/site-footer.test.tsx`
Expected: FAIL — "Cannot find module './site-footer'"

---

### Task 4: Footer Implementation (Green)

**Files:**
- Create: `src/components/layout/site-footer.tsx`

- [ ] **Step 7: Implement SiteFooter**

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

- [ ] **Step 8: Run footer tests — confirm PASS**

Run: `npm test src/components/layout/site-footer.test.tsx`
Expected: PASS (2 tests)

---

### Task 5: Wire Shell into Root Layout

**Files:**
- Modify: `src/app/layout.tsx` (full replacement)

- [ ] **Step 9: Replace layout.tsx (remove Geist, add JetBrains_Mono + shell)**

Replace `src/app/layout.tsx` entirely:

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

---

### Task 6: Home Placeholder

**Files:**
- Modify: `src/app/page.tsx` (full replacement)

- [ ] **Step 10: Replace page.tsx with brand placeholder**

Replace `src/app/page.tsx` entirely:

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

---

### Task 7: Full Test Suite + Build + Commit

- [ ] **Step 11: Run full test suite**

Run: `npm test`
Expected: All tests PASS (header + footer + pre-existing tests)

- [ ] **Step 12: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors. No leftover Geist references.

- [ ] **Step 13: Commit**

```bash
git add src/components/layout/site-header.tsx src/components/layout/site-header.test.tsx src/components/layout/site-footer.tsx src/components/layout/site-footer.test.tsx src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add WSB site shell (header/footer) with compliance notice"
```
