# 어드민 UI/UX 전면 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어드민(`/admin/*`) 9개 화면에 라이트+다크 토글 테마, 어드민 전용 셸(스토어프론트 크롬 분리), 공용 컴포넌트 시스템을 도입하고 대시보드 표현(특히 막대그래프 정렬)을 개선한다. 기능·쿼리·스키마는 불변.

**Architecture:** 접근법 A — 파운데이션(테마 토큰·셸·공용 컴포넌트)을 먼저 굳히고 화면을 순차 적용. 어드민 테마는 shadcn `.dark`와 분리된 `[data-admin-theme]` CSS 변수 스코프를 사용해 스토어프론트에 무영향. 차트는 의존성 0 서버 렌더 SVG.

**Tech Stack:** Next.js 16 App Router(Server Components/route groups) · Tailwind v4(CSS 변수 직참조) · 쿠키 기반 테마(SSR 무플래시) · Vitest(토큰 동기화) · Playwright(시각 검증).

**스펙:** `docs/superpowers/specs/2026-06-10-admin-ui-overhaul-design.md`

---

## 파일 구조 (생성/수정/이동)

```
신규:
  src/components/admin/shell/admin-shell.tsx        # 사이드바 + 상단바 (server)
  src/components/admin/shell/admin-nav.tsx          # NAV 링크 + 활성 하이라이트 (client)
  src/components/admin/shell/theme-toggle.tsx       # 다크 토글 (client)
  src/components/admin/ui/card.tsx                  # AdminCard
  src/components/admin/ui/kpi.tsx                   # Kpi
  src/components/admin/ui/status-badge.tsx          # StatusBadge
  src/components/admin/ui/data-table.tsx            # DataTable
  src/components/admin/ui/revenue-chart.tsx         # RevenueChart (SVG)
  src/components/admin/ui/donut.tsx                 # Donut
  src/components/admin/ui/status-bars.tsx           # StatusBars
  src/components/admin/ui/controls.tsx              # AdminInput/Select/Textarea/Checkbox/Button
  src/app/(storefront)/layout.tsx                   # 스토어프론트 크롬

수정:
  src/lib/design-tokens.ts                          # adminColors 추가
  src/lib/design-tokens.test.ts                     # adminColors 단언
  src/styles/globals.css                            # [data-admin-theme] 변수
  src/app/layout.tsx                                # 최소화(html/body/폰트)
  src/app/admin/layout.tsx                          # AdminShell 적용
  src/app/admin/page.tsx                            # 대시보드 재구성
  src/app/admin/orders/page.tsx
  src/app/admin/orders/[orderNumber]/page.tsx
  src/app/admin/orders/cancellations/page.tsx
  src/app/admin/coupons/page.tsx
  src/app/admin/inquiries/page.tsx
  src/app/admin/reviews/page.tsx
  src/app/admin/products/page.tsx
  src/app/admin/banners/page.tsx
  src/components/admin/coupon-form.tsx
  src/components/admin/product-form.tsx (있으면)

이동(git mv — URL/`@/*` import 불변):
  src/app/{page.tsx,products,category,cart,checkout,search,brand,support,policy,account,login,signup,auth,order-lookup}
    → src/app/(storefront)/
  (이동 제외: layout.tsx[수정], admin, api, robots.ts, sitemap.ts, favicon.ico)
```

---

## Phase 0 — 파운데이션

### Task 1: 어드민 테마 토큰 (TDD: 동기화 + CSS 변수)

**Files:**
- Modify: `src/lib/design-tokens.ts`
- Modify: `src/lib/design-tokens.test.ts`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: 동기화 테스트 추가(실패)** — `src/lib/design-tokens.test.ts` 끝에 추가:

```ts
import { adminColors } from "./design-tokens";

describe("adminColors", () => {
  it("라이트/다크 핵심 토큰을 노출한다(globals.css와 동기화)", () => {
    expect(adminColors.light.bg).toBe("#F6F7F4");
    expect(adminColors.light.accent).toBe("#177A4B");
    expect(adminColors.dark.bg).toBe("#0B0F0D");
    expect(adminColors.dark.accent).toBe("#3DDC84");
    expect(adminColors.dark.neon).toBe("#E8FF00");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/lib/design-tokens.test.ts`
Expected: FAIL — `adminColors` is not exported.

- [ ] **Step 3: adminColors 추가(통과)** — `src/lib/design-tokens.ts` 끝에 추가:

```ts
// 어드민 전용 테마 토큰 — globals.css [data-admin-theme] 와 값 동기화.
export const adminColors = {
  light: {
    bg: "#F6F7F4", panel: "#FFFFFF", panel2: "#FBFCFA", line: "#E7E9E2", line2: "#EFF1EB",
    ink: "#1A201C", mut: "#6B756E", mut2: "#9AA39C",
    accent: "#177A4B", accent2: "#2FB36B", neon: "#C9D400", pos: "#2FB36B", neg: "#D9803F",
    sidebar: "#0E1A14", sidebarInk: "#9FB3A8",
  },
  dark: {
    bg: "#0B0F0D", panel: "#121A16", panel2: "#0F1512", line: "#1E2A24", line2: "#19231E",
    ink: "#E8EFEA", mut: "#7E908A", mut2: "#566159",
    accent: "#3DDC84", accent2: "#86F7B0", neon: "#E8FF00", pos: "#3DDC84", neg: "#F19B7A",
    sidebar: "#0A0F0C", sidebarInk: "#7E908A",
  },
} as const;
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/lib/design-tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: CSS 변수 추가** — `src/styles/globals.css`의 `.dark { ... }` 블록(약 139행) 바로 다음에 추가. 값은 Step 3과 동일해야 한다:

```css
/* ── 어드민 전용 테마 (shadcn .dark 와 분리된 data-admin-theme 스코프) ── */
[data-admin-theme] {
  --ad-bg: #F6F7F4; --ad-panel: #FFFFFF; --ad-panel-2: #FBFCFA;
  --ad-line: #E7E9E2; --ad-line-2: #EFF1EB;
  --ad-ink: #1A201C; --ad-mut: #6B756E; --ad-mut-2: #9AA39C;
  --ad-accent: #177A4B; --ad-accent-2: #2FB36B; --ad-neon: #C9D400;
  --ad-pos: #2FB36B; --ad-neg: #D9803F;
  --ad-sidebar: #0E1A14; --ad-sidebar-ink: #9FB3A8;
}
[data-admin-theme="dark"] {
  --ad-bg: #0B0F0D; --ad-panel: #121A16; --ad-panel-2: #0F1512;
  --ad-line: #1E2A24; --ad-line-2: #19231E;
  --ad-ink: #E8EFEA; --ad-mut: #7E908A; --ad-mut-2: #566159;
  --ad-accent: #3DDC84; --ad-accent-2: #86F7B0; --ad-neon: #E8FF00;
  --ad-pos: #3DDC84; --ad-neg: #F19B7A;
  --ad-sidebar: #0A0F0C; --ad-sidebar-ink: #7E908A;
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/lib/design-tokens.ts src/lib/design-tokens.test.ts src/styles/globals.css
git commit -m "feat(admin-ui): admin theme tokens (light/dark) + sync test"
```

---

### Task 2: 테마 토글 (client) + 쿠키 헬퍼

**Files:**
- Create: `src/components/admin/shell/theme-toggle.tsx`

- [ ] **Step 1: ThemeToggle 작성** — Create `src/components/admin/shell/theme-toggle.tsx`:

```tsx
"use client";

import { useState } from "react";

// 쿠키 'admin-theme' 갱신 + 어드민 루트의 data-admin-theme 즉시 토글.
// 무플래시는 서버(admin/layout.tsx)가 쿠키로 초기값을 주입해 보장한다.
export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const [theme, setTheme] = useState<"light" | "dark">(initial);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `admin-theme=${next};path=/;max-age=31536000;samesite=lax`;
    const root = document.querySelector("[data-admin-theme]") as HTMLElement | null;
    if (root) root.setAttribute("data-admin-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="테마 전환"
      className="grid size-8 place-items-center rounded-lg border border-[var(--ad-line)] text-[var(--ad-mut)] hover:text-[var(--ad-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)]"
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  );
}
```

- [ ] **Step 2: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add src/components/admin/shell/theme-toggle.tsx
git commit -m "feat(admin-ui): theme toggle (cookie + data-admin-theme)"
```

---

### Task 3: 루트 레이아웃 최소화 + (storefront) 라우트 그룹 이동

> 이 Task는 스토어프론트 크롬을 어드민에서 분리하는 핵심 구조 변경이다. URL·`@/*` import는 불변(라우트 그룹은 경로에 영향 없음).

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/app/(storefront)/layout.tsx`
- Move: 스토어프론트 라우트 폴더/파일 → `src/app/(storefront)/`

- [ ] **Step 1: 스토어프론트 라우트 이동** — Run:

```bash
cd src/app
mkdir -p "(storefront)"
git mv page.tsx "(storefront)/page.tsx"
for d in products category cart checkout search brand support policy account login signup auth order-lookup; do git mv "$d" "(storefront)/$d"; done
cd ../..
```

Expected: `src/app/(storefront)/` 아래로 이동, `src/app/`에는 `layout.tsx`·`admin`·`api`·`robots.ts`·`sitemap.ts`·`favicon.ico`만 남는다.

- [ ] **Step 2: (storefront) 레이아웃 생성** — Create `src/app/(storefront)/layout.tsx` (기존 루트 레이아웃의 크롬 이전):

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
```

- [ ] **Step 3: 루트 레이아웃 최소화** — Replace `src/app/layout.tsx` body 부분(크롬 제거, 폰트/메타/Pretendard 유지):

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import { getSiteUrl } from "@/lib/site";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "WSB 스토어", template: "%s | WSB 스토어" },
  description: "Engineered by Data, Grown by Design. 데이터로 키운 건강기능식품 — NUTROGIN 브레인케어와 WSB 건강기능식품.",
  openGraph: { type: "website", siteName: "WSB 스토어", locale: "ko_KR" },
  robots: { index: true, follow: true },
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
      <body className="min-h-screen bg-white font-sans text-ng-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
```

> 주의: 스토어프론트의 세로 flex 레이아웃(`flex min-h-screen flex-col`)은 (storefront) 레이아웃이 책임지지 않아도 `main flex-1`만으로 충분하지만, 푸터가 하단에 붙도록 (storefront) 레이아웃 최상위를 `<div className="flex min-h-screen flex-col">`로 감싸도 된다. 어드민은 자체 셸이 전체 높이를 관리한다.

- [ ] **Step 4: (storefront) 레이아웃에 flex 래퍼 적용** — `src/app/(storefront)/layout.tsx`를 푸터 하단 고정을 위해 수정:

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/lib/cart/cart-context";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
```

- [ ] **Step 5: tsc + 빌드 + 라우트 회귀 확인**

Run: `npx tsc --noEmit && npm run build`
Expected: 빌드 성공. 라우트 트리에서 `/`·`/products`·`/products/[slug]`·`/cart`·`/checkout`·`/account/*`·`/login` 등 URL이 **변동 없이** 그대로 존재(라우트 그룹은 URL 미반영).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor(layout): split storefront chrome into (storefront) route group"
```

---

### Task 4: AdminShell — 사이드바 + 상단바

**Files:**
- Create: `src/components/admin/shell/admin-nav.tsx`
- Create: `src/components/admin/shell/admin-shell.tsx`
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: AdminNav(client, 활성 하이라이트)** — Create `src/components/admin/shell/admin-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode; badge?: number };
type Group = { title: string; items: Item[] };

export function AdminNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--ad-sidebar-ink)]/60">
            {g.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const on = isActive(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition " +
                    (on
                      ? "bg-white text-[var(--ad-accent)]"
                      : "text-[var(--ad-sidebar-ink)] hover:bg-white/5 hover:text-white")
                  }
                >
                  <span className="size-4 opacity-90">{it.icon}</span>
                  {it.label}
                  {it.badge ? (
                    <span className="ml-auto rounded-md bg-[var(--ad-neon)] px-1.5 py-px font-mono text-[10px] font-bold text-[#2a2d00]">
                      {it.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: AdminShell(server)** — Create `src/components/admin/shell/admin-shell.tsx`:

```tsx
import { AdminNav } from "./admin-nav";
import { ThemeToggle } from "./theme-toggle";

const ICON = {
  dash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  product: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>,
  order: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>,
  refund: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9"/><path d="M3 5v4h4"/></svg>,
  coupon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg>,
  inquiry: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  review: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 7 .5-5 4.5 1.5 7-6.5-4-6.5 4 1.5-7-5-4.5 7-.5z"/></svg>,
  banner: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg>,
};

export function AdminShell({
  theme,
  badges,
  crumb,
  children,
}: {
  theme: "light" | "dark";
  badges: { inquiries: number; cancellations: number };
  crumb: string;
  children: React.ReactNode;
}) {
  const groups = [
    { title: "OVERVIEW", items: [{ href: "/admin", label: "대시보드", icon: ICON.dash }] },
    {
      title: "COMMERCE",
      items: [
        { href: "/admin/products", label: "상품관리", icon: ICON.product },
        { href: "/admin/orders", label: "주문관리", icon: ICON.order },
        { href: "/admin/orders/cancellations", label: "취소/반품", icon: ICON.refund, badge: badges.cancellations || undefined },
        { href: "/admin/coupons", label: "쿠폰관리", icon: ICON.coupon },
      ],
    },
    {
      title: "SUPPORT",
      items: [
        { href: "/admin/inquiries", label: "문의관리", icon: ICON.inquiry, badge: badges.inquiries || undefined },
        { href: "/admin/reviews", label: "리뷰관리", icon: ICON.review },
        { href: "/admin/banners", label: "배너관리", icon: ICON.banner },
      ],
    },
  ];

  return (
    <div data-admin-theme={theme} className="min-h-screen bg-[var(--ad-bg)] text-[var(--ad-ink)]">
      <div className="grid grid-cols-[236px_1fr]">
        <aside className="min-h-screen bg-[var(--ad-sidebar)] px-4 py-5">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--ad-accent)] to-[var(--ad-accent-2)] font-mono text-sm font-extrabold text-white">W</div>
            <div>
              <p className="text-sm font-extrabold leading-none text-white">WSB</p>
              <p className="font-mono text-[9.5px] tracking-[0.3em] text-[var(--ad-sidebar-ink)]">OPS CONSOLE</p>
            </div>
          </div>
          <AdminNav groups={groups} />
        </aside>
        <div className="min-w-0">
          <header className="flex items-center justify-between border-b border-[var(--ad-line)] bg-[var(--ad-panel)] px-7 py-4">
            <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--ad-mut)]">
              WSB / <span className="text-[var(--ad-ink)]">{crumb}</span>
            </p>
            <div className="flex items-center gap-3">
              <ThemeToggle initial={theme} />
              <div className="grid size-8 place-items-center rounded-full bg-[var(--ad-line-2)] font-mono text-xs font-bold text-[var(--ad-accent)]">A</div>
            </div>
          </header>
          <div className="px-7 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: admin/layout.tsx 에 AdminShell 적용** — Replace `src/app/admin/layout.tsx`:

```tsx
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { countOpenInquiries } from "@/db/queries/admin-inquiries";
import { countRequestedCancellations } from "@/db/queries/admin-cancellations";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const cookieStore = await cookies();
  const theme = cookieStore.get("admin-theme")?.value === "dark" ? "dark" : "light";
  const [inquiries, cancellations] = await Promise.all([
    countOpenInquiries(),
    countRequestedCancellations(),
  ]);
  return (
    <AdminShell theme={theme} badges={{ inquiries, cancellations }} crumb="대시보드">
      {children}
    </AdminShell>
  );
}
```

> 참고: `crumb`는 우선 정적("대시보드")로 두고, 각 페이지가 자체 제목(h1)을 가지므로 상단 브레드크럼은 최소 정보만 표시한다. 페이지별 동적 브레드크럼은 비범위.

- [ ] **Step 4: tsc + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공. `/admin/*` 라우트 ƒ로 표시.

- [ ] **Step 5: 시각 검증(로그인 후 캡처)** — 개발 서버 기동 후 Playwright로 `/admin` 캡처. 사이드바(아이콘·그룹·뱃지)·상단바(테마토글)·고객 헤더/푸터 없음 확인. 다크 토글 클릭 후 색 전환 확인.

```bash
# 검증용 임시 스크립트(예시) — 로그인→캡처. 완료 후 .verify-*.png 삭제.
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat(admin-ui): dedicated admin shell (sidebar + topbar + theme toggle)"
```

---

### Task 5: 공용 UI 컴포넌트 — Card / Kpi / StatusBadge

**Files:**
- Create: `src/components/admin/ui/card.tsx`
- Create: `src/components/admin/ui/kpi.tsx`
- Create: `src/components/admin/ui/status-badge.tsx`

- [ ] **Step 1: AdminCard** — Create `src/components/admin/ui/card.tsx`:

```tsx
export function AdminCard({
  title,
  tag,
  children,
  className = "",
}: {
  title?: string;
  tag?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)] p-[18px] " + className}>
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[13px] font-extrabold text-[var(--ad-ink)]">{title}</h2>
          {tag && <span className="ml-auto font-mono text-[10px] text-[var(--ad-mut-2)]">{tag}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Kpi** — Create `src/components/admin/ui/kpi.tsx`:

```tsx
export function Kpi({
  label,
  value,
  delta,
  deltaTone,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "pos" | "neg";
}) {
  return (
    <div className="rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)] p-[18px]">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--ad-mut-2)]">{label}</p>
      <p className="mt-2.5 font-mono text-[28px] font-extrabold leading-none tracking-[-0.02em] text-[var(--ad-ink)]">{value}</p>
      {delta && (
        <p
          className="mt-2 font-mono text-[11px] font-semibold"
          style={{ color: deltaTone === "neg" ? "var(--ad-neg)" : "var(--ad-pos)" }}
        >
          {delta}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: StatusBadge** — Create `src/components/admin/ui/status-badge.tsx`:

```tsx
// 도메인 상태 → 색. order/cancellation/inquiry/visibility 통합.
const MAP: Record<string, { label: string; fg: string; bg: string }> = {
  // order
  pending: { label: "결제 대기", fg: "#6B756E", bg: "#EFF1EB" },
  paid: { label: "결제 완료", fg: "#177A4B", bg: "#E7F6EE" },
  preparing: { label: "배송 준비", fg: "#0E7490", bg: "#E0F2F5" },
  shipped: { label: "발송 완료", fg: "#1D4ED8", bg: "#E5EDFF" },
  delivered: { label: "배송 완료", fg: "#0F5132", bg: "#E3F0E8" },
  cancelled: { label: "취소", fg: "#B45309", bg: "#FBEEDD" },
  // cancellation
  requested: { label: "접수", fg: "#B45309", bg: "#FBEEDD" },
  refunded: { label: "환불완료", fg: "#177A4B", bg: "#E7F6EE" },
  rejected: { label: "반려", fg: "#6B756E", bg: "#EFF1EB" },
  // inquiry
  open: { label: "미답변", fg: "#B45309", bg: "#FBEEDD" },
  answered: { label: "답변완료", fg: "#177A4B", bg: "#E7F6EE" },
  // visibility
  visible: { label: "노출", fg: "#177A4B", bg: "#E7F6EE" },
  hidden: { label: "숨김", fg: "#6B756E", bg: "#EFF1EB" },
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const s = MAP[value] ?? { label: label ?? value, fg: "var(--ad-mut)", bg: "var(--ad-line-2)" };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ color: s.fg, background: s.bg }}
    >
      {label ?? s.label}
    </span>
  );
}
```

> 다크 테마에서 배지 배경/글자는 라이트 값 그대로 두되 대비가 충분하다(밝은 pill). 추후 다크 전용 배지 팔레트가 필요하면 별도 토큰화(비범위).

- [ ] **Step 4: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/components/admin/ui/card.tsx src/components/admin/ui/kpi.tsx src/components/admin/ui/status-badge.tsx
git commit -m "feat(admin-ui): Card, Kpi, StatusBadge components"
```

---

### Task 6: RevenueChart / Donut / StatusBars (SVG)

**Files:**
- Create: `src/components/admin/ui/revenue-chart.tsx`
- Create: `src/components/admin/ui/donut.tsx`
- Create: `src/components/admin/ui/status-bars.tsx`

- [ ] **Step 1: RevenueChart(서버 렌더 SVG, 정렬된 막대차트)** — Create `src/components/admin/ui/revenue-chart.tsx`:

```tsx
// 공유 baseline + y축 눈금 + 그리드 + 정렬된 x라벨의 막대차트. 의존성 0, 서버 렌더.
export function RevenueChart({ data }: { data: { day: string; total: number }[] }) {
  const W = 560, H = 220, P = { l: 40, r: 14, t: 14, b: 26 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const max = Math.max(1, ...data.map((d) => d.total));
  const ymax = Math.max(30000, Math.ceil(max / 30000) * 30000);
  const slot = iw / Math.max(1, data.length);
  const bw = slot * 0.62;
  const y = (v: number) => P.t + ih - (v / ymax) * ih;
  const ticks: number[] = [];
  for (let v = 0; v <= ymax; v += 30000) ticks.push(v);

  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-[var(--ad-mut-2)]">데이터 없음</p>;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="매출 추이">
      <defs>
        <linearGradient id="ad-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ad-accent-2)" />
          <stop offset="1" stopColor="var(--ad-accent)" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <line key={v} x1={P.l} y1={y(v)} x2={W - P.r} y2={y(v)} stroke="var(--ad-line-2)" />
      ))}
      {ticks.map((v) => (
        <text key={"t" + v} x={P.l - 6} y={y(v) + 3} textAnchor="end" fill="var(--ad-mut-2)" fontFamily="monospace" fontSize="9">
          {v / 1000}k
        </text>
      ))}
      {data.map((d, i) => {
        const bx = P.l + i * slot + (slot - bw) / 2;
        const by = y(d.total);
        return (
          <g key={d.day}>
            <rect x={bx} y={by} width={bw} height={P.t + ih - by} rx="3" fill="url(#ad-bar)" />
            <text x={bx + bw / 2} y={H - 10} textAnchor="middle" fill="var(--ad-mut)" fontFamily="monospace" fontSize="8.5">
              {d.day.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Donut** — Create `src/components/admin/ui/donut.tsx`:

```tsx
export function Donut({ percent, label }: { percent: number; label: string }) {
  const r = 46, c = 2 * Math.PI * r;
  const on = Math.max(0, Math.min(100, percent)) / 100 * c;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ad-line-2)" strokeWidth="16" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ad-accent-2)" strokeWidth="16" strokeLinecap="round" strokeDasharray={`${on} ${c - on}`} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" fill="var(--ad-ink)" fontFamily="monospace" fontSize="22" fontWeight="800">{percent}%</text>
      <text x="60" y="74" textAnchor="middle" fill="var(--ad-mut-2)" fontFamily="monospace" fontSize="9">{label}</text>
    </svg>
  );
}
```

- [ ] **Step 3: StatusBars** — Create `src/components/admin/ui/status-bars.tsx`:

```tsx
export function StatusBars({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2.5 border-b border-[var(--ad-line-2)] py-[7px] last:border-0">
          <span className="size-2 rounded-sm" style={{ background: r.color }} />
          <span className="text-[12.5px] text-[var(--ad-ink)]">{r.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded bg-[var(--ad-line-2)]">
            <span className="block h-full rounded" style={{ width: `${(r.value / max) * 100}%`, background: r.color }} />
          </span>
          <span className="w-6 text-right font-mono text-[13px] font-bold text-[var(--ad-ink)]">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: tsc 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add src/components/admin/ui/revenue-chart.tsx src/components/admin/ui/donut.tsx src/components/admin/ui/status-bars.tsx
git commit -m "feat(admin-ui): SVG RevenueChart, Donut, StatusBars"
```

---

### Task 7: DataTable + 폼 컨트롤

**Files:**
- Create: `src/components/admin/ui/data-table.tsx`
- Create: `src/components/admin/ui/controls.tsx`

- [ ] **Step 1: DataTable** — Create `src/components/admin/ui/data-table.tsx`:

```tsx
export function DataTable({
  toolbar,
  head,
  children,
  empty,
  pagination,
}: {
  toolbar?: React.ReactNode;
  head: React.ReactNode;
  children: React.ReactNode;
  empty?: boolean;
  pagination?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--ad-line)] bg-[var(--ad-panel)]">
      {toolbar && <div className="flex flex-wrap items-center gap-2 border-b border-[var(--ad-line)] p-4">{toolbar}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ad-line)] text-left text-[var(--ad-mut)]">{head}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {empty && <p className="py-12 text-center text-sm text-[var(--ad-mut-2)]">데이터가 없습니다.</p>}
      {pagination && <div className="flex justify-center gap-2 border-t border-[var(--ad-line)] p-4">{pagination}</div>}
    </div>
  );
}

// 공통 셀 클래스 — 페이지에서 <td className={TD}> 형태로 사용.
export const TH = "px-4 py-2.5 font-semibold";
export const TD = "px-4 py-3 align-middle";
export const ROW = "border-b border-[var(--ad-line-2)] last:border-0";
```

- [ ] **Step 2: 폼 컨트롤** — Create `src/components/admin/ui/controls.tsx`:

```tsx
const base =
  "rounded-lg border border-[var(--ad-line)] bg-[var(--ad-panel)] px-3 py-2 text-sm text-[var(--ad-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)]";

export function AdminInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${base} ${props.className ?? ""}`} />;
}
export function AdminCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" {...props} className={`size-4 accent-[var(--ad-accent)] ${props.className ?? ""}`} />;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };
export function AdminButton({ variant = "primary", className = "", ...rest }: BtnProps) {
  const v =
    variant === "primary"
      ? "bg-[var(--ad-accent)] text-white hover:opacity-90"
      : variant === "danger"
        ? "border border-[var(--ad-neg)] text-[var(--ad-neg)] hover:bg-[var(--ad-neg)]/5"
        : "border border-[var(--ad-line)] text-[var(--ad-mut)] hover:text-[var(--ad-ink)]";
  return (
    <button
      {...rest}
      className={`rounded-lg px-3.5 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent)] disabled:opacity-50 ${v} ${className}`}
    />
  );
}
```

- [ ] **Step 3: tsc + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.

- [ ] **Step 4: 커밋**

```bash
git add src/components/admin/ui/data-table.tsx src/components/admin/ui/controls.tsx
git commit -m "feat(admin-ui): DataTable + form controls"
```

---

## Phase 1 — 대시보드

### Task 8: 대시보드 재구성 (기존 쿼리 유지)

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: 대시보드 페이지 교체** — Replace `src/app/admin/page.tsx`. 데이터 조회는 **현행 그대로**, 표현만 새 컴포넌트로:

```tsx
import Link from "next/link";
import { getStatusCounts, getDailyRevenue, getTopProducts, getCustomerOrderCounts } from "@/db/queries/admin-analytics";
import { summarizeCustomers } from "@/lib/admin/analytics-helpers";
import { statusLabel, ORDER_STATUSES } from "@/lib/admin/order-status";
import { countOpenInquiries } from "@/db/queries/admin-inquiries";
import { countRequestedCancellations } from "@/db/queries/admin-cancellations";
import { formatKRW } from "@/lib/format";
import { Kpi } from "@/components/admin/ui/kpi";
import { AdminCard } from "@/components/admin/ui/card";
import { RevenueChart } from "@/components/admin/ui/revenue-chart";
import { StatusBars } from "@/components/admin/ui/status-bars";
import { Donut } from "@/components/admin/ui/donut";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending: "#9AA39C", paid: "#2FB36B", preparing: "#2BB3B3",
  shipped: "#3B82F6", delivered: "#0F5132", cancelled: "#D9803F",
};

export default async function AdminDashboard() {
  const [statusCounts, daily, top, custRows, openInq, pendingCancel] = await Promise.all([
    getStatusCounts(), getDailyRevenue(14), getTopProducts(5), getCustomerOrderCounts(),
    countOpenInquiries(), countRequestedCancellations(),
  ]);
  const cust = summarizeCustomers(custRows);
  const revenueTotal = daily.reduce((s, d) => s + d.total, 0);
  const statusRows = ORDER_STATUSES.map((s) => ({ label: statusLabel(s), value: statusCounts[s] ?? 0, color: STATUS_COLOR[s] }));

  return (
    <div>
      <h1 className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--ad-ink)]">운영 대시보드</h1>
      <p className="mb-5 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">핵심 지표와 처리 대기 항목을 한눈에</p>

      {(openInq > 0 || pendingCancel > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-3.5">
          <Pending n={openInq} title="미답변 문의" sub="고객 대기 중 — 답변 필요" href="/admin/inquiries?status=open" />
          <Pending n={pendingCancel} title="취소·반품 요청" sub="승인/반려 처리 대기" href="/admin/orders/cancellations?status=requested" />
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3.5 md:grid-cols-4">
        <Kpi label="14일 매출" value={formatKRW(revenueTotal)} />
        <Kpi label="결제완료 주문" value={`${statusCounts.paid ?? 0}건`} />
        <Kpi label="구매 회원" value={`${cust.total}명`} />
        <Kpi label="재구매율" value={`${cust.repeatRate}%`} />
      </div>

      <div className="grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <AdminCard title="매출 추이" tag="최근 14일 · ₩"><RevenueChart data={daily} /></AdminCard>
        <AdminCard title="주문 상태" tag={`${Object.values(statusCounts).reduce((a, b) => a + b, 0)}건`}>
          <StatusBars rows={statusRows} />
        </AdminCard>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.55fr_1fr]">
        <AdminCard title="상품별 판매 TOP" tag="결제완료 기준">
          <ol>
            {top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3 border-b border-[var(--ad-line-2)] py-[9px] last:border-0">
                <span className="w-5 font-mono text-xs font-bold text-[var(--ad-accent)]">0{i + 1}</span>
                <span className="flex-1 truncate text-[12.5px] text-[var(--ad-ink)]">{t.name}</span>
                <span className="font-mono text-[11px] text-[var(--ad-mut)]">{t.qty}개</span>
                <span className="w-[78px] text-right font-mono text-xs font-semibold text-[var(--ad-ink)]">{formatKRW(t.revenue)}</span>
              </li>
            ))}
            {top.length === 0 && <li className="py-6 text-center text-sm text-[var(--ad-mut-2)]">데이터 없음</li>}
          </ol>
        </AdminCard>
        <AdminCard title="회원 구성" tag={`구매자 ${cust.total}`}>
          <div className="flex items-center gap-[18px] px-1 py-3.5">
            <Donut percent={cust.repeatRate} label="재구매율" />
            <div className="text-[13px] leading-[2.1]">
              <div><span className="text-[var(--ad-accent-2)]">●</span> 재구매 회원 <b className="font-mono">{cust.repeat}</b></div>
              <div><span className="text-[var(--ad-mut-2)]">●</span> 신규(1회) <b className="font-mono">{cust.newCustomers}</b></div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Pending({ n, title, sub, href }: { n: number; title: string; sub: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-2xl border border-[#F0E2B0] bg-[#FFF8E6] px-[18px] py-3.5 transition hover:brightness-[0.98]">
      <span className="font-mono text-[26px] font-extrabold text-[#B7791F]">{n}</span>
      <span className="text-[13px] font-bold text-[var(--ad-ink)]">{title}<small className="mt-0.5 block font-normal text-[var(--ad-mut)]">{sub}</small></span>
      <span className="ml-auto text-lg text-[#B7791F]">→</span>
    </Link>
  );
}
```

> 참고: `getDailyRevenue`는 `{day,total}[]`를 반환(스펙·기존 코드 확인). `RevenueChart`가 동일 형태를 받는다. `summarizeCustomers`/`getStatusCounts`/`getTopProducts`/`statusLabel`/`ORDER_STATUSES`는 기존 export 그대로 사용.

- [ ] **Step 2: tsc + 빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 성공.

- [ ] **Step 3: 시각 검증** — `/admin` 캡처(라이트+다크). 막대차트가 baseline·y축·정렬된 x라벨로 그려지는지 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin-ui): redesign dashboard with aligned SVG chart and cards"
```

---

## Phase 2 — 표 화면군

> 각 표 화면을 `DataTable`+`StatusBadge`+컨트롤로 교체한다. 기능(필터/검색/페이지네이션/액션)은 보존. 각 Task는 독립 커밋.

### Task 9: 주문 목록

**Files:**
- Modify: `src/app/admin/orders/page.tsx`

- [ ] **Step 1: 페이지 교체** — Replace `src/app/admin/orders/page.tsx` (기존 `listAllOrders` params·`buildHref`·`searchParams` 로직 유지, 표현만 교체):

```tsx
import Link from "next/link";
import { listAllOrders } from "@/db/queries/admin-orders";
import { ORDER_STATUSES, statusLabel } from "@/lib/admin/order-status";
import { formatKRW, formatDate } from "@/lib/format";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const TABS = [{ value: "", label: "전체" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))];

function buildHref(p: { status?: string; q?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.q) sp.set("q", p.q);
  if (p.page && p.page > 1) sp.set("page", String(p.page));
  const qs = sp.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = "", q = "", page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const { rows, total, pageSize } = await listAllOrders({ status: status || undefined, q, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toolbar = (
    <>
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => {
          const on = status === t.value;
          return (
            <Link key={t.value || "all"} href={buildHref({ status: t.value, q })}
              className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
              {t.label}
            </Link>
          );
        })}
      </div>
      <form method="get" className="ml-auto flex items-center gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <AdminInput name="q" defaultValue={q} placeholder="주문번호·주문자 검색" className="w-56" />
        <AdminButton>검색</AdminButton>
      </form>
    </>
  );

  const pagination = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <Link key={p} href={buildHref({ status, q, page: p })}
      className={p === page ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg border border-[var(--ad-line)] px-3 py-1.5 text-sm text-[var(--ad-mut)]"}>{p}</Link>
  )) : null;

  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">주문관리</h1>
      <p className="mb-2 font-mono text-[11px] text-[var(--ad-mut-2)]">총 {total}건</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        pagination={pagination}
        head={<><th className={TH}>주문번호</th><th className={TH}>상태</th><th className={TH}>주문자</th><th className={TH}>금액</th><th className={TH}>주문일</th></>}
      >
        {rows.map((o) => (
          <tr key={o.id} className={ROW}>
            <td className={TD}><Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-[var(--ad-accent)] hover:underline">{o.orderNumber}</Link></td>
            <td className={TD}><StatusBadge value={o.status} /></td>
            <td className={TD}>{o.customerName}</td>
            <td className={`${TD} font-mono`}>{formatKRW(o.totalAmount)}</td>
            <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{formatDate(o.createdAt)}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 2: tsc + 빌드 + 시각 검증 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/orders/page.tsx
git commit -m "feat(admin-ui): orders list on DataTable + StatusBadge"
```

---

### Task 10: 취소/반품 목록

**Files:**
- Modify: `src/app/admin/orders/cancellations/page.tsx`

- [ ] **Step 1: 페이지 교체** — Replace `src/app/admin/orders/cancellations/page.tsx`. 기존 `listCancellations`·필터·`CancellationActions`(client) 유지, 표만 `DataTable`로, 상태를 `StatusBadge`로:

```tsx
import Link from "next/link";
import { listCancellations } from "@/db/queries/admin-cancellations";
import { REQUEST_TYPE_LABEL, canProcessCancellation } from "@/lib/orders/cancellation";
import { formatKRW } from "@/lib/format";
import { CancellationActions } from "@/components/admin/cancellation-actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "", label: "전체" }, { value: "requested", label: "접수" },
  { value: "refunded", label: "환불완료" }, { value: "rejected", label: "반려" },
];

export default async function AdminCancellationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const rows = await listCancellations(status || undefined);

  const toolbar = (
    <div className="flex gap-1">
      {FILTERS.map((f) => {
        const on = (status ?? "") === f.value;
        return (
          <Link key={f.value} href={f.value ? `/admin/orders/cancellations?status=${f.value}` : "/admin/orders/cancellations"}
            className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
            {f.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">취소/반품 관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">승인 시 토스 결제가 자동 환불되고 재고가 원복됩니다(전체취소 기준).</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        head={<><th className={TH}>유형</th><th className={TH}>주문번호</th><th className={TH}>사유</th><th className={TH}>환불예정</th><th className={TH}>상태</th><th className={`${TH} text-right`}>처리</th></>}
      >
        {rows.map((r) => (
          <tr key={r.id} className={`${ROW} align-top`}>
            <td className={`${TD} font-semibold`}>{REQUEST_TYPE_LABEL[r.type as keyof typeof REQUEST_TYPE_LABEL] ?? r.type}</td>
            <td className={TD}><Link href={`/admin/orders/${r.orderNumber}`} className="font-mono text-[var(--ad-accent)] hover:underline">{r.orderNumber}</Link></td>
            <td className={`${TD} max-w-[16rem] text-[var(--ad-mut)]`}><span className="line-clamp-2 whitespace-pre-wrap">{r.reason}</span></td>
            <td className={`${TD} font-mono`}>{formatKRW(r.totalAmount)}</td>
            <td className={TD}><StatusBadge value={r.status} /></td>
            <td className={`${TD} text-right`}>{canProcessCancellation(r.status) ? <CancellationActions id={r.id} /> : <span className="text-xs text-[var(--ad-mut-2)]">처리 완료</span>}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 2: tsc + 빌드 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/orders/cancellations/page.tsx
git commit -m "feat(admin-ui): cancellations list on DataTable + StatusBadge"
```

---

### Task 11: 리뷰 목록 (과밀 해소)

**Files:**
- Modify: `src/app/admin/reviews/page.tsx`

- [ ] **Step 1: 페이지 교체** — Replace `src/app/admin/reviews/page.tsx`. 기존 `listReviewsAdmin`·필터·페이지네이션·server-action(hide/unhide/delete) 유지. 행 높이·여백 정리, 상태를 `StatusBadge`로:

```tsx
import Link from "next/link";
import { listReviewsAdmin } from "@/db/queries/admin-reviews";
import { formatDate } from "@/lib/format";
import { hideReview, unhideReview, deleteReview } from "./actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const FILTERS = [{ value: "", label: "전체" }, { value: "visible", label: "노출" }, { value: "hidden", label: "숨김" }];
const maskUser = (id: string) => `회원 ${id.replace(/-/g, "").slice(0, 6)}`;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { view, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  const hidden = view === "hidden" ? true : view === "visible" ? false : undefined;
  const pageSize = 30;
  const { rows, total } = await listReviewsAdmin({ hidden }, page, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toolbar = (
    <div className="flex gap-1">
      {FILTERS.map((f) => {
        const on = (view ?? "") === f.value;
        return (
          <Link key={f.value} href={f.value ? `/admin/reviews?view=${f.value}` : "/admin/reviews"}
            className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>
            {f.label}
          </Link>
        );
      })}
    </div>
  );

  const pagination = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
    <Link key={p} href={`/admin/reviews?${view ? `view=${view}&` : ""}page=${p}`}
      className={p === page ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg border border-[var(--ad-line)] px-3 py-1.5 text-sm text-[var(--ad-mut)]"}>{p}</Link>
  )) : null;

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">리뷰관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">숨긴 리뷰는 상품 페이지의 평점·목록에서 제외됩니다.</p>
      <DataTable
        toolbar={toolbar}
        empty={rows.length === 0}
        pagination={pagination}
        head={<><th className={TH}>상품</th><th className={TH}>평점</th><th className={TH}>내용</th><th className={TH}>작성자</th><th className={TH}>상태</th><th className={TH}>작성일</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {rows.map((r) => {
          async function onHide() { "use server"; await hideReview(r.id); }
          async function onUnhide() { "use server"; await unhideReview(r.id); }
          async function onDelete() { "use server"; await deleteReview(r.id); }
          return (
            <tr key={r.id} className={`${ROW} align-top`}>
              <td className={`${TD} max-w-[10rem] truncate font-semibold`}><Link href={`/products/${r.productSlug}`} className="hover:underline">{r.productName}</Link></td>
              <td className={`${TD} font-mono text-[var(--ad-accent)]`}>{"★".repeat(r.rating)}</td>
              <td className={`${TD} max-w-[20rem] text-[var(--ad-mut)]`}>{r.title && <b className="text-[var(--ad-ink)]">{r.title} · </b>}<span className="line-clamp-2">{r.body}</span><span className="ml-1 font-mono text-[10px] text-[var(--ad-mut-2)]">({r.imageCount}장)</span></td>
              <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{maskUser(r.userId)}</td>
              <td className={TD}><StatusBadge value={r.isHidden ? "hidden" : "visible"} /></td>
              <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{formatDate(r.createdAt)}</td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  {r.isHidden ? <form action={onUnhide}><AdminButton variant="ghost" className="!py-1 !text-xs">복원</AdminButton></form> : <form action={onHide}><AdminButton variant="ghost" className="!py-1 !text-xs">숨기기</AdminButton></form>}
                  <form action={onDelete}><AdminButton variant="danger" className="!py-1 !text-xs">삭제</AdminButton></form>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 2: tsc + 빌드 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/reviews/page.tsx
git commit -m "feat(admin-ui): reviews list on DataTable (de-crowded) + StatusBadge"
```

---

### Task 12: 쿠폰 목록 + 상품 목록

**Files:**
- Modify: `src/app/admin/coupons/page.tsx`
- Modify: `src/app/admin/products/page.tsx`

- [ ] **Step 1: 쿠폰 목록 교체** — Replace `src/app/admin/coupons/page.tsx` (기존 `listCouponsWithStats`·`CouponForm`·`toggleCoupon`·`CouponDeleteButton` 유지, 표를 `DataTable`로, 상태를 pill로):

```tsx
import Link from "next/link";
import { listCouponsWithStats } from "@/db/queries/admin-coupons";
import { formatKRW, formatDate } from "@/lib/format";
import { CouponForm } from "@/components/admin/coupon-form";
import { CouponDeleteButton } from "@/components/admin/coupon-delete-button";
import { toggleCoupon } from "./actions";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const discountText = (t: string, v: number) => (t === "rate" ? `${v}%` : formatKRW(v));
const periodText = (s: Date | null, e: Date | null) => (!s && !e ? "상시" : `${s ? formatDate(s) : "~"} – ${e ? formatDate(e) : "~"}`);

export default async function AdminCouponsPage() {
  const coupons = await listCouponsWithStats();
  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">쿠폰관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">생성한 코드를 고객이 마이페이지에서 등록해 받습니다.</p>
      <div className="mb-5"><CouponForm /></div>
      <DataTable
        empty={coupons.length === 0}
        head={<><th className={TH}>코드</th><th className={TH}>이름</th><th className={TH}>할인</th><th className={TH}>최소주문</th><th className={TH}>기간</th><th className={TH}>발급/사용</th><th className={TH}>상태</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {coupons.map((c) => {
          async function onToggle() { "use server"; await toggleCoupon(c.id, !c.isActive); }
          return (
            <tr key={c.id} className={ROW}>
              <td className={`${TD} font-mono font-semibold`}>{c.code}</td>
              <td className={TD}>{c.name}</td>
              <td className={`${TD} font-mono`}>{discountText(c.discountType, c.discountValue)}</td>
              <td className={`${TD} font-mono text-xs`}>{c.minSubtotal > 0 ? formatKRW(c.minSubtotal) : "-"}</td>
              <td className={`${TD} text-xs text-[var(--ad-mut)]`}>{periodText(c.startsAt, c.endsAt)}</td>
              <td className={`${TD} font-mono text-xs`}>{c.issued} / {c.used}</td>
              <td className={TD}>{c.isActive ? <StatusBadge value="visible" label="활성" /> : <StatusBadge value="hidden" label="비활성" />}</td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/coupons/${c.id}`}><AdminButton variant="ghost" className="!py-1 !text-xs">수정</AdminButton></Link>
                  <form action={onToggle}><AdminButton variant="ghost" className="!py-1 !text-xs">{c.isActive ? "비활성" : "활성"}</AdminButton></form>
                  <CouponDeleteButton id={c.id} />
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 2: 상품 목록 교체** — Replace `src/app/admin/products/page.tsx` (기존 `listAllProductsAdmin` 유지, `DataTable`+노출 pill):

```tsx
import Link from "next/link";
import { listAllProductsAdmin } from "@/db/queries/admin-products";
import { formatKRW } from "@/lib/format";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await listAllProductsAdmin();
  const toolbar = (
    <Link href="/admin/products/new" className="ml-auto"><AdminButton>+ 상품 등록</AdminButton></Link>
  );
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">상품관리</h1>
      <DataTable
        toolbar={toolbar}
        empty={products.length === 0}
        head={<><th className={TH}>상품명</th><th className={TH}>브랜드</th><th className={TH}>가격</th><th className={TH}>노출</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {products.map((p) => (
          <tr key={p.id} className={ROW}>
            <td className={`${TD} font-semibold`}>{p.name}</td>
            <td className={`${TD} font-mono text-xs text-[var(--ad-mut)]`}>{p.brand}</td>
            <td className={`${TD} font-mono`}>{formatKRW(p.basePrice)}</td>
            <td className={TD}><StatusBadge value={p.isPublished ? "visible" : "hidden"} /></td>
            <td className={`${TD} text-right`}><Link href={`/admin/products/${p.id}`} className="font-semibold text-[var(--ad-accent)] hover:underline">수정</Link></td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
```

> 참고: `listAllProductsAdmin`의 반환 필드(id/name/brand/basePrice/isPublished/slug)는 기존 그대로. 스펙의 "상품 검색/페이지네이션 소폭 보강"은 데이터/쿼리 변경을 수반하므로 본 UI 플랜의 비범위로 둔다(후속). 노출 상태는 pill로 통일.

- [ ] **Step 3: tsc + 빌드 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/coupons/page.tsx src/app/admin/products/page.tsx
git commit -m "feat(admin-ui): coupons & products lists on DataTable"
```

---

## Phase 3 — 폼/상세군

### Task 13: 문의 관리 (카드형 정리)

**Files:**
- Modify: `src/app/admin/inquiries/page.tsx`

- [ ] **Step 1: 페이지 교체** — Replace `src/app/admin/inquiries/page.tsx` (기존 `listInquiries`·`answerInquiry` 유지, 카드·컨트롤·상태 pill):

```tsx
import Link from "next/link";
import { listInquiries } from "@/db/queries/admin-inquiries";
import { formatDate } from "@/lib/format";
import { answerInquiry } from "./actions";
import { AdminCard } from "@/components/admin/ui/card";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminTextarea, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

const FILTERS = [{ value: "", label: "전체" }, { value: "open", label: "미답변" }, { value: "answered", label: "답변완료" }];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const inquiries = await listInquiries(status || undefined);
  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-[var(--ad-ink)]">문의관리</h1>
      <p className="mb-4 mt-0.5 text-[12.5px] text-[var(--ad-mut)]">답변 저장 시 상태가 답변완료로 바뀝니다(이메일 발송은 별도).</p>
      <div className="mb-4 flex gap-1">
        {FILTERS.map((f) => {
          const on = (status ?? "") === f.value;
          return (
            <Link key={f.value} href={f.value ? `/admin/inquiries?status=${f.value}` : "/admin/inquiries"}
              className={on ? "rounded-lg bg-[var(--ad-accent)] px-3 py-1.5 text-sm font-semibold text-white" : "rounded-lg px-3 py-1.5 text-sm font-semibold text-[var(--ad-mut)] hover:bg-[var(--ad-line-2)]"}>{f.label}</Link>
          );
        })}
      </div>
      <div className="space-y-3">
        {inquiries.map((q) => (
          <AdminCard key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--ad-line-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--ad-mut)]">{q.category}</span>
                  <span className="font-semibold text-[var(--ad-ink)]">{q.subject}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--ad-mut)]">{q.email} · {formatDate(q.createdAt)}</p>
              </div>
              <StatusBadge value={q.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-lg bg-[var(--ad-panel-2)] p-3 text-sm text-[var(--ad-ink)]">{q.body}</p>
            <form action={answerInquiry} className="mt-3">
              <input type="hidden" name="id" value={q.id} />
              <AdminTextarea name="answer" required defaultValue={q.answer ?? ""} rows={3} placeholder="답변을 입력하세요" className="w-full" />
              <AdminButton className="mt-2">{q.status === "answered" ? "답변 수정" : "답변 등록"}</AdminButton>
            </form>
          </AdminCard>
        ))}
        {inquiries.length === 0 && <p className="py-10 text-center text-sm text-[var(--ad-mut-2)]">문의가 없습니다.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: tsc + 빌드 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/inquiries/page.tsx
git commit -m "feat(admin-ui): inquiries page with cards + controls"
```

---

### Task 14: 주문 상세 + 배너 + 쿠폰폼 컨트롤 적용

**Files:**
- Modify: `src/app/admin/orders/[orderNumber]/page.tsx`
- Modify: `src/app/admin/banners/page.tsx`
- Modify: `src/components/admin/coupon-form.tsx`

- [ ] **Step 1: 주문 상세** — `src/app/admin/orders/[orderNumber]/page.tsx`를 새 토큰/컴포넌트로 정리. 기존 `getOrderAdmin`·`updateOrderStatus`·`updateShipping`·`trackingUrl`·`SUPPORTED_COURIERS`·`nextStatuses`·`STATUS_LABEL` 로직 전부 유지하고, 색상 클래스만 어드민 토큰(`text-[var(--ad-ink)]` 등)으로 치환, 상태 표시는 `StatusBadge`, 버튼은 `AdminButton`, 입력은 `AdminInput`. 카드 컨테이너는 `AdminCard`로 감싼다. (구조·서버액션 폼 방식 동일, 클래스만 교체.)

  핵심 교체 규칙:
  - `text-wsb-carbon` → `text-[var(--ad-ink)]`, `text-stone-500/600` → `text-[var(--ad-mut)]`, `border-stone-200` → `border-[var(--ad-line)]`.
  - 현재 상태 표시 `<strong>{STATUS_LABEL[...]}</strong>` → `<StatusBadge value={order.status} />`.
  - 상태변경 버튼 `<button className="...wsb-green...">` → `<AdminButton variant="ghost">{STATUS_LABEL[s]}로 변경</AdminButton>`.
  - 송장 입력 `<input ...>` → `<AdminInput ...>` (datalist·name 유지), 저장 버튼 → `<AdminButton>송장 저장</AdminButton>`.
  - 추적 링크 `<a>` 색을 `text-[var(--ad-accent)]`로.

- [ ] **Step 2: 배너 관리** — `src/app/admin/banners/page.tsx`를 동일 규칙으로 교체: 새 배너 폼을 `AdminCard`+컨트롤로, 목록을 `DataTable`+`StatusBadge`(노출/숨김)로. 기존 `listAllBanners`·`createBanner`·`toggleBanner`·`deleteBanner` 유지.

```tsx
import { listAllBanners } from "@/db/queries/banners";
import { createBanner, toggleBanner, deleteBanner } from "./actions";
import { AdminCard } from "@/components/admin/ui/card";
import { DataTable, TH, TD, ROW } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { AdminInput, AdminButton } from "@/components/admin/ui/controls";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await listAllBanners();
  return (
    <div>
      <h1 className="mb-4 text-[22px] font-extrabold text-[var(--ad-ink)]">배너관리</h1>
      <AdminCard title="새 배너 추가" className="mb-5">
        <form action={createBanner} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">제목 <span className="text-xs text-[var(--ad-accent)]">필수</span><AdminInput name="title" required placeholder="배너 제목" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">이미지 URL<AdminInput name="imageUrl" placeholder="https://..." className="w-56" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">링크 URL<AdminInput name="linkUrl" placeholder="https://..." className="w-56" /></label>
          <label className="flex flex-col gap-1 text-sm text-[var(--ad-mut)]">순서<AdminInput name="sortOrder" type="number" defaultValue={0} className="w-20" /></label>
          <AdminButton type="submit">추가</AdminButton>
        </form>
      </AdminCard>
      <DataTable
        empty={banners.length === 0}
        head={<><th className={TH}>제목</th><th className={TH}>이미지 URL</th><th className={TH}>링크 URL</th><th className={TH}>순서</th><th className={TH}>상태</th><th className={`${TH} text-right`}>관리</th></>}
      >
        {banners.map((b) => {
          async function onToggle() { "use server"; await toggleBanner(b.id, !b.isActive); }
          async function onDelete() { "use server"; await deleteBanner(b.id); }
          return (
            <tr key={b.id} className={ROW}>
              <td className={`${TD} font-semibold`}>{b.title}</td>
              <td className={`${TD} max-w-[160px] truncate font-mono text-xs text-[var(--ad-mut)]`}>{b.imageUrl ?? "-"}</td>
              <td className={`${TD} max-w-[160px] truncate font-mono text-xs text-[var(--ad-mut)]`}>{b.linkUrl ?? "-"}</td>
              <td className={`${TD} font-mono text-xs`}>{b.sortOrder}</td>
              <td className={TD}><StatusBadge value={b.isActive ? "visible" : "hidden"} /></td>
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-2">
                  <form action={onToggle}><AdminButton variant="ghost" className="!py-1 !text-xs">{b.isActive ? "숨기기" : "노출"}</AdminButton></form>
                  <form action={onDelete}><AdminButton variant="danger" className="!py-1 !text-xs">삭제</AdminButton></form>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </div>
  );
}
```

- [ ] **Step 3: 쿠폰폼 컨트롤 치환** — `src/components/admin/coupon-form.tsx`의 input/select/button을 `AdminInput`/`AdminSelect`/`AdminButton`으로 치환(로직·필드·server action 호출 불변). `inputCls` 상수는 제거하고 컨트롤 컴포넌트로 대체.

- [ ] **Step 4: tsc + 빌드 + 커밋**

```bash
npx tsc --noEmit && npm run build
git add src/app/admin/orders/[orderNumber]/page.tsx src/app/admin/banners/page.tsx src/components/admin/coupon-form.tsx
git commit -m "feat(admin-ui): order detail, banners, coupon form on admin tokens/controls"
```

---

### Task 15: 잔여 컨트롤 토큰 치환 + 최종 검증

**Files:**
- Modify: `src/components/admin/cancellation-actions.tsx`, `src/components/admin/coupon-delete-button.tsx`, `src/components/admin/product-form.tsx`(있으면)

- [ ] **Step 1: 잔여 클라이언트 컴포넌트 색 토큰 치환** — `cancellation-actions.tsx`·`coupon-delete-button.tsx`·`product-form.tsx`의 하드코딩 색(`wsb-green`/`stone`/`rose`/`red`)을 어드민 토큰(`var(--ad-accent)`/`var(--ad-mut)`/`var(--ad-neg)`)으로 치환. 버튼은 가능하면 `AdminButton` 사용(로직 불변).

- [ ] **Step 2: 전체 빌드 + 기존 테스트**

Run: `npx tsc --noEmit && npm run build && npx vitest run`
Expected: 전부 통과(기존 333 + adminColors 동기화 테스트).

- [ ] **Step 3: 시각 회귀 검증(Playwright)** — 어드민 로그인 후 9개 화면을 라이트·다크 두 테마로 캡처해 일관성 확인. 스토어프론트(홈/PDP/체크아웃/계정) 정상 렌더 확인. 캡처 임시파일은 검증 후 삭제.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat(admin-ui): finalize token migration across admin client components"
```

---

## Self-Review (작성자 점검)

**1. 스펙 커버리지:** §1 테마→T1·T2 · §2 셸/라우트그룹→T3·T4 · §3 공용 컴포넌트→T5·T6·T7 · §4 화면 적용→T8(대시보드)·T9~T14(8개 화면)·T15(잔여) · §5 토큰→T1 · §6 검증→각 Task 빌드/캡처 + T15 · §7 단계=Phase 0~3 매핑 ✅. 막대그래프 정렬→T6 `RevenueChart` ✅.

**2. 플레이스홀더 스캔:** 핵심 컴포넌트·페이지는 실제 코드. T14 Step1(주문 상세)/T15(잔여)는 "클래스 치환 규칙"을 명시(구조 불변·색 토큰 매핑 표 제공)해 구현자가 기계적으로 적용 가능 — 전체 JSX 재게시 대신 정확한 치환 규칙으로 대체(파일이 길고 구조가 그대로이므로). 상품 검색/페이지네이션은 명시적으로 비범위 처리.

**3. 타입 일관성:** `data-admin-theme`·`--ad-*` 토큰은 T1에서 정의→전 컴포넌트 동일 사용. `DataTable`/`TH`/`TD`/`ROW`(T7)→T9~T14 동일. `StatusBadge` value 키(order/cancellation/inquiry/visibility)가 각 페이지 status 값과 일치. `RevenueChart` props `{day,total}[]` = `getDailyRevenue` 반환. `AdminShell` props(theme/badges/crumb) = admin/layout.tsx 전달과 일치. `countOpenInquiries`/`countRequestedCancellations` 기존 export 사용.

**리스크:** (a) 라우트 그룹 이동(T3)이 최대 변경 — 이동 후 빌드 라우트 트리로 URL 불변 확인 필수, `CartProvider` 위치 이동으로 장바구니 회귀 검증. (b) 다크 무플래시는 쿠키 SSR 주입(T4)로 확보 — 클라이언트 토글 단독 금지. (c) StatusBadge 다크 대비는 밝은 pill 유지로 충분(추가 다크 팔레트는 비범위).
