# WSB 종합몰 — 회원 · 마이페이지 구현 계획 (Plan 4/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 고객이 회원가입/로그인(이메일 + Kakao·Google 소셜)하고, 자신의 주문·배송 내역을 마이페이지에서 확인할 수 있게 한다. 로그인 상태로 결제 시 주문이 회원 계정에 연결된다.

**Architecture:** Supabase Auth(쿠키 세션)를 사용. Next 미들웨어가 매 요청에서 세션을 갱신하고, 서버 컴포넌트는 `getCurrentUser()`로 인증 상태를 읽는다. 인증 UI는 Supabase 브라우저 클라이언트로 로그인/가입/소셜을 호출하고, OAuth는 `/auth/callback`에서 코드 교환한다. 주문 생성 API는 서버에서 세션을 읽어 `orders.userId`를 채운다. 마이페이지는 보호 라우트(미인증 → /login).

**Tech Stack:** Next.js App Router(미들웨어·Server Components·Server Actions) · @supabase/ssr · Drizzle · Tailwind 브랜드 토큰 · Vitest

## 범위 / 비범위
- **포함:** 이메일 회원가입·로그인·로그아웃, Kakao·Google 소셜 로그인 버튼+콜백, 세션 미들웨어, 헤더 인증 상태, 마이페이지(프로필·주문내역·주문상세), 주문↔회원 연결.
- **비범위(후속):** 네이버 로그인(Supabase 미지원 → 커스텀 OAuth 별도), 리뷰/포토리뷰·1:1 문의(별도 슬라이스), 회원등급제(2차), 비밀번호 재설정/이메일 인증 플로우(후속).
- **외부 설정 필요:** 소셜 로그인은 Supabase 대시보드 Authentication → Providers 에 Kakao·Google client id/secret 등록 + redirect URL 설정 후 작동. 이메일/비번은 즉시 동작(대시보드에서 이메일 확인 옵션 설정에 따라).

## 전제 (Plan 1~3 완료, main 라이브)
- `src/lib/supabase/{client.ts,server.ts}` 존재(@supabase/ssr). `src/lib/env.ts` lazy `env`/`getEnv`. `src/db/queries/products.ts` 패턴. `orders` 테이블에 `userId uuid`(nullable), `customerEmail` 존재. `/api/orders` POST 존재. `site-header.tsx`(서버 컴포넌트), `/account` 링크(User 아이콘) 존재.

## 새 작업 브랜치
```bash
git checkout main && git checkout -b feat/member
```

## 파일 구조
```
middleware.ts                                   # 세션 갱신
src/lib/auth/current-user.ts                    # getCurrentUser 서버 헬퍼
src/app/auth/callback/route.ts                  # OAuth 코드 교환
src/app/auth/signout/route.ts                   # 로그아웃
src/components/auth/auth-form.tsx               # 로그인/가입 폼(client)
src/components/auth/social-buttons.tsx          # Kakao/Google(client)
src/app/login/page.tsx                          # 로그인
src/app/signup/page.tsx                         # 가입
src/components/layout/header-auth.tsx           # 헤더 인증 상태(server)
src/db/queries/orders.ts                        # listOrdersByUser, getOrderDetail
src/app/account/page.tsx                        # 마이페이지(보호)
src/app/account/orders/[orderNumber]/page.tsx   # 주문 상세(보호)
```

---

### Task 1: 세션 미들웨어 + getCurrentUser 헬퍼

**Files:** Create `middleware.ts` (repo root), `src/lib/auth/current-user.ts`.

- [ ] **Step 1: 미들웨어** — Create `middleware.ts` (프로젝트 루트, `src/` 밖):
```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // 세션 토큰 갱신 (반드시 호출)
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

- [ ] **Step 2: getCurrentUser 헬퍼** — Create `src/lib/auth/current-user.ts`:
```ts
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = { id: string; email: string | null };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}
```

- [ ] **Step 3: tsc + 빌드** — `npx tsc --noEmit` 클린, `npm run build` 성공(미들웨어가 빌드에 포함되는지 확인 — `ƒ Middleware` 표기). 미들웨어가 `env`(lazy)를 읽으므로 Supabase 키가 `.env.local`에 있어야 dev에서 동작(이미 존재).

- [ ] **Step 4: 커밋** — `git add -A && git commit -m "feat: supabase session middleware and getCurrentUser helper"`

---

### Task 2: 로그인/가입 페이지 + 소셜 + 콜백 + 로그아웃

**Files:** Create `src/components/auth/auth-form.tsx`, `src/components/auth/social-buttons.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/auth/signout/route.ts`.

- [ ] **Step 1: AuthForm(client)** — Create `src/components/auth/auth-form.tsx`:
```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const fn = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    const { error } = await fn;
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/account");
    router.refresh();
  }

  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green";
  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="email" required placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)}
        className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`} />
      <input type="password" required placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)}
        className={`w-full rounded-md border border-stone-300 px-3 py-2 text-sm ${ring}`} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={loading}
        className={`w-full rounded-md bg-wsb-green py-3 text-sm font-bold text-white disabled:opacity-40 ${ring} focus-visible:ring-offset-2`}>
        {loading ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
      </button>
      <p className="text-center text-sm text-stone-500">
        {mode === "login" ? (
          <>계정이 없으신가요? <Link href="/signup" className="font-semibold text-wsb-green">회원가입</Link></>
        ) : (
          <>이미 계정이 있으신가요? <Link href="/login" className="font-semibold text-wsb-green">로그인</Link></>
        )}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: SocialButtons(client)** — Create `src/components/auth/social-buttons.tsx`:
```tsx
"use client";
import { createClient } from "@/lib/supabase/client";

const PROVIDERS = [
  { id: "kakao" as const, label: "카카오로 시작하기", cls: "bg-[#FEE500] text-[#191600]" },
  { id: "google" as const, label: "Google로 시작하기", cls: "border border-stone-300 text-stone-700" },
];

export function SocialButtons() {
  async function signIn(provider: "kakao" | "google") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <button key={p.id} type="button" onClick={() => signIn(p.id)}
          className={`w-full rounded-md py-3 text-sm font-bold ${p.cls} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2`}>
          {p.label}
        </button>
      ))}
      <p className="text-center text-[11px] text-stone-400">소셜 로그인은 Supabase 대시보드에 provider 등록 후 작동합니다.</p>
    </div>
  );
}
```

- [ ] **Step 3: 로그인/가입 페이지** — Create `src/app/login/page.tsx`:
```tsx
import { AuthForm } from "@/components/auth/auth-form";
import { SocialButtons } from "@/components/auth/social-buttons";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-6 text-2xl font-extrabold text-wsb-carbon">로그인</h1>
      <AuthForm mode="login" />
      <div className="my-6 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />또는<span className="h-px flex-1 bg-stone-200" /></div>
      <SocialButtons />
    </section>
  );
}
```
Create `src/app/signup/page.tsx` (동일 구조, `mode="signup"`, 제목 "회원가입").

- [ ] **Step 4: 콜백 라우트** — Create `src/app/auth/callback/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 5: 로그아웃 라우트** — Create `src/app/auth/signout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
```

- [ ] **Step 6: 빌드 + tsc** — `npm run build`(라우트 `/login`,`/signup`,`/auth/callback`,`/auth/signout` 표기), `npx tsc --noEmit` 클린, 전체 `npx vitest run` 회귀 없음.

- [ ] **Step 7: 커밋** — `git add -A && git commit -m "feat: email + social auth (login/signup/callback/signout)"`

---

### Task 3: 헤더 인증 상태

**Files:** Create `src/components/layout/header-auth.tsx`; Modify `src/components/layout/site-header.tsx`.

- [ ] **Step 1: HeaderAuth(server)** — Create `src/components/layout/header-auth.tsx`:
```tsx
import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function HeaderAuth() {
  const user = await getCurrentUser();
  const ring = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wsb-green focus-visible:ring-offset-2 rounded-sm";
  if (!user) {
    return (
      <Link href="/login" aria-label="로그인" className={`text-wsb-carbon transition-colors hover:text-wsb-green ${ring}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <Link href="/account" aria-label="마이페이지" className={`text-wsb-carbon transition-colors hover:text-wsb-green ${ring}`}>
        <User size={20} strokeWidth={1.75} aria-hidden />
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className={`text-xs font-semibold text-stone-500 hover:text-wsb-green ${ring}`}>로그아웃</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: 헤더에 장착** — `src/components/layout/site-header.tsx`의 유틸 영역에서, 기존 `/account` User 아이콘 링크를 `<HeaderAuth />`로 교체(검색·장바구니 아이콘은 유지). site-header는 서버 컴포넌트이므로 async `HeaderAuth`를 직접 렌더 가능. 기존 `UTILS` 배열에서 account 항목을 제거하고 그 자리에 `<HeaderAuth />`를 배치. import 추가.
  주의: 기존 `site-header.test.tsx`가 `getByRole("link", { name: "내 계정" })`를 단언한다면, HeaderAuth는 비로그인 시 `aria-label="로그인"`을 렌더하므로 그 단언을 `"로그인"`으로 갱신해야 한다(테스트는 `getCurrentUser`를 호출 → Supabase 서버 클라이언트 → 쿠키 필요. jsdom 단위테스트에서 async 서버 컴포넌트 직접 렌더는 부적합). **해결:** site-header.test.tsx에서 account 관련 단언을 제거하고, HeaderAuth는 별도로 테스트하지 않는다(서버/외부 의존). 대신 검색·장바구니·로고·내비 단언만 유지. 변경 사항을 명확히 보고.

- [ ] **Step 3: 빌드 + 테스트** — `npm run build`, `npx vitest run`(site-header 테스트 갱신 후 통과), `npx tsc --noEmit`.

- [ ] **Step 4: 커밋** — `git add -A && git commit -m "feat: header auth state (login vs mypage/logout)"`

---

### Task 4: 주문 ↔ 회원 연결

**Files:** Modify `src/app/api/orders/route.ts`.

- [ ] **Step 1: 주문 생성 시 userId 설정** — `src/app/api/orders/route.ts`에서 주문 insert 전에 현재 사용자를 읽어 `userId`를 채운다(비로그인은 null 유지):
```ts
import { getCurrentUser } from "@/lib/auth/current-user";
// ... POST 내부, order insert 직전:
const user = await getCurrentUser();
// orders insert values에 추가:
//   userId: user?.id ?? null,
```
기존 서버 금액 재계산·검증 로직은 그대로 둔다. `userId`만 추가.

- [ ] **Step 2: tsc + 빌드 + 통합 확인** — `npx tsc --noEmit`, `npm run build`. 비로그인 주문 생성이 여전히 200을 반환하는지(이전 curl과 동일) 확인(userId는 null). 로그인 상태 주문 연결은 Task 5 마이페이지에서 함께 수동 검증.

- [ ] **Step 3: 커밋** — `git add -A && git commit -m "feat: link orders to authenticated user on creation"`

---

### Task 5: 주문 조회 쿼리 + 마이페이지(보호)

**Files:** Create `src/db/queries/orders.ts`, `src/app/account/page.tsx`, `src/app/account/orders/[orderNumber]/page.tsx`.

- [ ] **Step 1: 주문 조회 쿼리** — Create `src/db/queries/orders.ts`:
```ts
import { and, eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/db/index";

export type OrderSummaryRow = typeof schema.orders.$inferSelect;
export type OrderItemRow = typeof schema.orderItems.$inferSelect;

export async function listOrdersByUser(userId: string): Promise<OrderSummaryRow[]> {
  const db = getDb();
  return db.select().from(schema.orders)
    .where(eq(schema.orders.userId, userId))
    .orderBy(desc(schema.orders.createdAt));
}

export async function getOrderDetailForUser(
  userId: string, orderNumber: string,
): Promise<{ order: OrderSummaryRow; items: OrderItemRow[] } | null> {
  const db = getDb();
  const [order] = await db.select().from(schema.orders)
    .where(and(eq(schema.orders.orderNumber, orderNumber), eq(schema.orders.userId, userId)))
    .limit(1);
  if (!order) return null;
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  return { order, items };
}
```

- [ ] **Step 2: 마이페이지(보호)** — Create `src/app/account/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOrdersByUser } from "@/db/queries/orders";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { pending: "결제 대기", paid: "결제 완료", cancelled: "취소" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const orders = await listOrdersByUser(user.id);
  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-wsb-carbon">마이페이지</h1>
      <p className="mt-1 text-sm text-stone-500">{user.email}</p>

      <h2 className="mt-8 mb-3 text-lg font-bold text-wsb-carbon">주문 내역</h2>
      {orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-500">주문 내역이 없습니다.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between p-4">
              <div>
                <Link href={`/account/orders/${o.orderNumber}`} className="font-mono text-sm font-semibold text-wsb-green hover:underline">
                  {o.orderNumber}
                </Link>
                <p className="mt-0.5 text-xs text-stone-500">{STATUS_LABEL[o.status] ?? o.status}</p>
              </div>
              <span className="font-mono text-sm font-bold">{formatKRW(o.totalAmount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 3: 주문 상세(보호)** — Create `src/app/account/orders/[orderNumber]/page.tsx`:
```tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getOrderDetailForUser } from "@/db/queries/orders";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const detail = await getOrderDetailForUser(user.id, orderNumber);
  if (!detail) notFound();
  const { order, items } = detail;
  return (
    <section className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/account" className="text-sm text-wsb-green">← 마이페이지</Link>
      <h1 className="mt-2 font-mono text-xl font-extrabold text-wsb-carbon">{order.orderNumber}</h1>
      <ul className="mt-6 divide-y divide-stone-200 rounded-lg border border-stone-200">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between p-4 text-sm">
            <span>{it.productName} <span className="text-stone-400">/ {it.variantName}</span> × {it.quantity}</span>
            <span className="font-mono font-bold">{formatKRW(it.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-stone-500">상품 합계</dt><dd className="font-mono">{formatKRW(order.itemsSubtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-stone-500">배송비</dt><dd className="font-mono">{formatKRW(order.shippingFee)}</dd></div>
        <div className="flex justify-between border-t border-stone-200 pt-1 font-extrabold"><dt>총 결제금액</dt><dd className="font-mono">{formatKRW(order.totalAmount)}</dd></div>
      </dl>
      <div className="mt-4 text-sm text-stone-600">
        <p>받는 분: {order.customerName} ({order.customerPhone})</p>
        <p>배송지: {order.shippingAddress}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 빌드 + tsc + 테스트** — `npm run build`(라우트 `/account`, `/account/orders/[orderNumber]` 동적 표기), `npx tsc --noEmit`, 전체 `npx vitest run` 회귀 없음.

- [ ] **Step 5: 커밋** — `git add -A && git commit -m "feat: mypage with order history and order detail (protected)"`

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지(§8 회원 시스템):** 가입 정책(회원+비회원 둘 다 — 비회원은 Plan 3, 회원은 본 계획) ✅ / 소셜 로그인(카카오·구글 구현, 네이버 보류 명시) ✅ / 마이페이지 주문·배송조회 ✅ / 주문↔회원 연결 ✅. 회원등급제·리뷰·1:1문의는 비범위(명시).

**2. 플레이스홀더 스캔:** 모든 코드 스텝 실제 코드. 소셜 provider 키 등록은 외부 설정(명시).

**3. 타입 일관성:** `getCurrentUser(): CurrentUser | null`(Task1)을 헤더·api/orders·마이페이지·주문상세가 동일 사용. `listOrdersByUser`/`getOrderDetailForUser`(Task5) 시그니처를 페이지가 사용. `orders.userId`(기존 스키마)에 Task4가 값 주입, Task5가 그 값으로 조회 — 일관.

**리스크/주의:**
- 미들웨어가 `env`(lazy proxy)를 읽음 → Supabase 키 필수(이미 .env.local·Vercel 존재). 미들웨어 matcher가 정적/health 제외.
- 서버 컴포넌트 인증(`getCurrentUser`)은 쿠키·Supabase 의존 → jsdom 단위테스트 부적합. 따라서 인증/마이페이지는 **단위 테스트 없이** 빌드+수동 검증(로그인→주문→마이페이지 노출)으로 확인. 순수 로직이 없어 TDD 대상이 적은 계획임(인증·DB·UI 결합).
- site-header 기존 테스트의 account 단언은 HeaderAuth 도입으로 조정 필요(Task3에 명시).
- 소셜 로그인 실제 동작은 Supabase 대시보드 provider 등록 + redirect URL(`<origin>/auth/callback`) 설정 후 가능 — 수동.
- 네이버 로그인은 Supabase 미지원 → 커스텀 OAuth 후속 슬라이스.
