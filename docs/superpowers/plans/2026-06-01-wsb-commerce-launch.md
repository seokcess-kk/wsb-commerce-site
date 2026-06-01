# WSB 종합몰 — Compliance · CS · SEO · Launch 구현 계획 (Plan 6/6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 오픈에 필요한 법적/정책 페이지, 고객지원(FAQ), SEO 기반(메타·OG·sitemap·robots·구조화데이터)을 갖추고, 오픈 전 점검 체크리스트로 마무리한다.

**Architecture:** 정책/FAQ는 정적 콘텐츠 서버 컴포넌트(법무 검토용 템플릿 + 회사정보 플레이스홀더). SEO는 루트 `metadata`(metadataBase·OG·robots) + 동적 `sitemap.ts`/`robots.ts` + PDP `generateMetadata` + Product JSON-LD. 순수 로직(sitemap 엔트리·JSON-LD 빌더)은 Vitest TDD. 사이트 URL은 `SITE_URL` 단일 출처.

**Tech Stack:** Next.js App Router(Metadata API·sitemap/robots) · Drizzle(상품/카테고리 조회) · Vitest

## 범위 / 비범위
- **포함:** 개인정보처리방침·이용약관·배송/교환/환불 안내 페이지, 고객지원(FAQ+연락처), SEO(루트 메타·OG·robots·sitemap·PDP 메타·Product 구조화데이터), 오픈 체크리스트 문서.
- **비범위(후속):** 1:1 문의·리뷰(별도 슬라이스), 관리자 공지 CMS, 다국어, 접근성 인증.
- **중요:** 정책 본문은 **법무 검토 필요 템플릿**이며 회사 실제 정보(상호·사업자번호·CPO 등)는 플레이스홀더(`○○○`). 건강기능식품 표시·광고 심의 문구는 이미 PDP/푸터에 적용됨.

## 전제 (Plan 1~5 완료, main 라이브)
- `src/lib/env.ts`(lazy `env`/`getEnv`), `src/db/queries/products.ts`(`listPublishedProducts`,`listCategories`,`getProductBySlug`), `formatKRW`. 푸터가 `/policy/privacy`·`/policy/terms` 링크(현재 404). 루트 `layout.tsx`에 기본 metadata(title/description) 존재. 헤더가 `/support` 링크.

## 새 작업 브랜치
```bash
git checkout main && git checkout -b feat/launch
```

## 파일 구조
```
src/lib/site.ts                          # SITE_URL 단일 출처
src/lib/seo/product-jsonld.ts (+ .test.ts)  # Product 구조화데이터(순수)
src/lib/seo/sitemap-entries.ts (+ .test.ts) # sitemap 엔트리 빌더(순수)
src/app/policy/privacy/page.tsx
src/app/policy/terms/page.tsx
src/app/policy/shipping/page.tsx          # 배송/교환/환불
src/app/support/page.tsx                  # 고객지원 + FAQ
src/app/robots.ts
src/app/sitemap.ts
(수정) src/app/layout.tsx                  # metadataBase·OG·robots
(수정) src/app/products/[slug]/page.tsx    # generateMetadata + JSON-LD
(수정) src/components/layout/site-footer.tsx # 배송/교환/환불 링크 추가
```

---

### Task 1: 정책 페이지 (개인정보·이용약관·배송/교환/환불)

**Files:** Create `src/app/policy/{privacy,terms,shipping}/page.tsx`; Modify `src/components/layout/site-footer.tsx`.

- [ ] **Step 1: 공통 정책 레이아웃 스타일** — 각 페이지는 동일 패턴: `<article className="prose mx-auto max-w-3xl px-6 py-12">` 대신 Tailwind 유틸로 제목/섹션 구성(프로젝트에 typography 플러그인 없음 — 직접 스타일). 각 페이지 상단에 `export const metadata = { title: "...", description: "..." }`.

- [ ] **Step 2: 개인정보처리방침** — Create `src/app/policy/privacy/page.tsx`. 본문(법무 검토용 템플릿, 회사정보 플레이스홀더):
  - 제목 "개인정보처리방침", 시행일 ○○○○-○○-○○
  - 섹션: ① 수집하는 개인정보 항목(회원: 이메일·비밀번호; 주문: 성명·연락처·이메일·배송지; 결제: 결제수단 정보는 PG사 처리) ② 수집·이용 목적(회원관리·주문/배송·CS·법령 의무) ③ 보유·이용 기간(전자상거래법: 계약/청약철회 5년, 대금결제 5년, 소비자 불만 3년; 회원 탈퇴 시 지체없이 파기) ④ 제3자 제공(원칙 미제공; PG·택배 등 위탁) ⑤ 처리위탁(PG: 토스페이먼츠, 배송: 택배사, 인프라: Supabase/Vercel) ⑥ 정보주체 권리(열람·정정·삭제·처리정지) ⑦ **만 14세 미만 아동**: 원칙적으로 가입 제한, 부득이한 경우 법정대리인 동의 ⑧ 개인정보 보호책임자(CPO): ○○○ / 연락처 ⑨ 쿠키 사용 안내 ⑩ 파기 절차·방법.
  - 하단: "본 방침은 법무 검토 후 확정되어야 합니다." 주석.

- [ ] **Step 3: 이용약관** — Create `src/app/policy/terms/page.tsx`. 템플릿:
  - 제목 "이용약관"
  - 섹션: 목적, 정의, 약관 효력·변경, 회원가입·자격, 서비스 이용, 주문·계약 성립, 결제, 청약철회·반품·교환, 면책, 분쟁해결·준거법·관할(전자상거래 소비자보호법 준수) 등 표준 조항.
  - 하단 법무 검토 주석.

- [ ] **Step 4: 배송/교환/환불 안내** — Create `src/app/policy/shipping/page.tsx`. 내용:
  - **배송:** 택배 배송, 기본 배송비 3,000원 / 5만원 이상 무료, 도서산간 추가, 발송 영업일 기준 ○일 이내.
  - **교환/반품:** 수령 후 7일 이내 청약철회 가능. **단, 건강기능식품은 개봉·훼손 시 또는 식품 특성상 재판매가 곤란한 경우 청약철회가 제한**될 수 있음(전자상거래법 제17조). 단순변심 시 왕복배송비 구매자 부담.
  - **환불:** 반품 확인 후 ○영업일 이내 결제수단으로 환불.
  - **교환/반품 신청:** 고객지원 채널 안내.

- [ ] **Step 5: 푸터 링크 추가** — `src/components/layout/site-footer.tsx`에 `배송/교환/환불 안내`(`/policy/shipping`) 링크 추가(기존 개인정보처리방침·이용약관 옆). next/link 사용, 포커스링 유지.

- [ ] **Step 6: 빌드 + 커밋** — `npm run build`(정책 라우트 3개), `npx tsc --noEmit`, `npx vitest run`. `git add -A && git commit -m "feat: policy pages (privacy, terms, shipping/returns)"`

---

### Task 2: 고객지원 (FAQ + 연락처)

**Files:** Create `src/app/support/page.tsx`.

- [ ] **Step 1: 고객지원 페이지** — Create `src/app/support/page.tsx` (정적 서버 컴포넌트, `export const metadata`):
  - 제목 "고객지원".
  - **연락처/운영시간:** 이메일 ○○○, 카카오 채널 ○○○, 운영시간 평일 10:00~17:00(주말·공휴일 휴무). (플레이스홀더)
  - **FAQ:** 접근성 있는 아코디언을 `<details><summary>`로 구현(클라이언트 JS 불필요). 항목 예:
    - 주문/결제: 결제 수단, 주문 확인 방법(마이페이지), 비회원 주문.
    - 배송: 배송비/무료배송 기준, 배송 기간, 배송 조회.
    - 교환/반품: 신청 방법, 건강기능식품 청약철회 제한 안내(→ /policy/shipping 링크).
    - 상품: 건강기능식품 섭취 방법·주의사항은 상품 상세 참고, "질병 예방·치료 목적 아님" 고지.
    - 회원: 가입/로그인, 소셜 로그인.
  - 정책 페이지로의 링크(개인정보·이용약관·배송/교환/환불).
  - 브랜드 토큰, 이모지 금지, 포커스 스타일.

- [ ] **Step 2: 빌드 + 커밋** — `npm run build`(`/support`), `npx tsc --noEmit`, `npx vitest run`. `git add -A && git commit -m "feat: customer support page with FAQ"`

---

### Task 3: SEO 기반 (SITE_URL · 루트 메타 · robots · sitemap)

**Files:** Modify `src/lib/env.ts`, `.env.example`, `.env.local`; Create `src/lib/site.ts`, `src/lib/seo/sitemap-entries.ts` (+ test), `src/app/robots.ts`, `src/app/sitemap.ts`; Modify `src/app/layout.tsx`.

- [ ] **Step 1: SITE_URL 단일 출처** — env에 `NEXT_PUBLIC_SITE_URL: z.string().optional()` 추가(.env.example/.env.local에 `NEXT_PUBLIC_SITE_URL=https://wsb-commerce-site.vercel.app`). Create `src/lib/site.ts`:
```ts
import { getEnv } from "@/lib/env";
export function getSiteUrl(): string {
  return (getEnv().NEXT_PUBLIC_SITE_URL ?? "https://wsb-commerce-site.vercel.app").replace(/\/$/, "");
}
```

- [ ] **Step 2: sitemap 엔트리 빌더(순수, TDD)** — Create `src/lib/seo/sitemap-entries.ts`:
```ts
export type SitemapEntry = { url: string; priority: number };
const STATIC_PATHS = ["", "/products", "/support", "/policy/privacy", "/policy/terms", "/policy/shipping"];

export function buildSitemapEntries(
  siteUrl: string, productSlugs: string[], categorySlugs: string[],
): SitemapEntry[] {
  const base = siteUrl.replace(/\/$/, "");
  const entries: SitemapEntry[] = STATIC_PATHS.map((p) => ({ url: `${base}${p}`, priority: p === "" ? 1 : 0.6 }));
  categorySlugs.forEach((s) => entries.push({ url: `${base}/category/${s}`, priority: 0.7 }));
  productSlugs.forEach((s) => entries.push({ url: `${base}/products/${s}`, priority: 0.8 }));
  return entries;
}
```
Test `sitemap-entries.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildSitemapEntries } from "./sitemap-entries";
describe("buildSitemapEntries", () => {
  it("정적+카테고리+상품 URL을 생성하고 trailing slash를 정규화", () => {
    const e = buildSitemapEntries("https://x.com/", ["p1"], ["c1"]);
    const urls = e.map((x) => x.url);
    expect(urls).toContain("https://x.com");
    expect(urls).toContain("https://x.com/products");
    expect(urls).toContain("https://x.com/category/c1");
    expect(urls).toContain("https://x.com/products/p1");
    expect(e.find((x) => x.url === "https://x.com")!.priority).toBe(1);
  });
});
```
Run red→green.

- [ ] **Step 3: robots.ts** — Create `src/app/robots.ts`:
```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/api"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: sitemap.ts** — Create `src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";
import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";
import { listPublishedProducts, listCategories } from "@/db/queries/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([listPublishedProducts(), listCategories()]);
  return buildSitemapEntries(getSiteUrl(), products.map((p) => p.slug), categories.map((c) => c.slug))
    .map((e) => ({ url: e.url, priority: e.priority }));
}
```

- [ ] **Step 5: 루트 메타데이터 강화** — `src/app/layout.tsx`의 `metadata`를 확장:
```ts
import { getSiteUrl } from "@/lib/site";
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "WSB 스토어", template: "%s | WSB 스토어" },
  description: "Engineered by Data, Grown by Design. 데이터로 키운 건강기능식품 — NUTROGIN 브레인케어와 WSB 건강기능식품.",
  openGraph: { type: "website", siteName: "WSB 스토어", locale: "ko_KR" },
  robots: { index: true, follow: true },
};
```
(metadataBase가 getSiteUrl()를 호출 → env lazy. 빌드 시 NEXT_PUBLIC_SITE_URL 없으면 폴백 URL 사용 — 안전.)

- [ ] **Step 6: 빌드 + 테스트 + 커밋** — `npm run build`(`/robots.txt`,`/sitemap.xml` 생성 확인), `npx vitest run`(+sitemap 테스트), `npx tsc --noEmit`. `git add -A && git commit -m "feat: SEO foundation (site url, root metadata, robots, sitemap)"`

---

### Task 4: PDP SEO (generateMetadata + Product JSON-LD) + 목록 메타

**Files:** Create `src/lib/seo/product-jsonld.ts` (+ test); Modify `src/app/products/[slug]/page.tsx`, `src/app/products/page.tsx`, `src/app/category/[slug]/page.tsx`.

- [ ] **Step 1: Product JSON-LD 빌더(순수, TDD)** — Create `src/lib/seo/product-jsonld.ts`:
```ts
export type ProductJsonLdInput = {
  name: string; description: string; brand: string; priceKRW: number; url: string; image?: string | null; availability: boolean;
};
export function buildProductJsonLd(p: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    brand: { "@type": "Brand", name: p.brand },
    ...(p.image ? { image: p.image } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "KRW",
      price: p.priceKRW,
      availability: p.availability ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: p.url,
    },
  };
}
```
Test `product-jsonld.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildProductJsonLd } from "./product-jsonld";
describe("buildProductJsonLd", () => {
  it("Product 스키마와 KRW Offer를 생성", () => {
    const j = buildProductJsonLd({ name: "FOCUS", description: "설명", brand: "NUTROGIN", priceKRW: 39000, url: "https://x.com/products/nutrogin-focus", image: "/a.png", availability: true });
    expect(j["@type"]).toBe("Product");
    expect(j.brand.name).toBe("NUTROGIN");
    expect(j.offers.price).toBe(39000);
    expect(j.offers.priceCurrency).toBe("KRW");
    expect(j.offers.availability).toBe("https://schema.org/InStock");
  });
  it("이미지 없으면 image 키 생략, 품절이면 OutOfStock", () => {
    const j = buildProductJsonLd({ name: "x", description: "d", brand: "WSB", priceKRW: 1000, url: "u", image: null, availability: false });
    expect("image" in j).toBe(false);
    expect(j.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});
```
Run red→green.

- [ ] **Step 2: PDP에 generateMetadata + JSON-LD** — `src/app/products/[slug]/page.tsx` 수정:
  - `export async function generateMetadata({ params })`: `getProductBySlug(slug)`로 상품을 읽어 `{ title: product.name, description: product.summary ?? ..., openGraph: { images: product.images?.[0] ? [product.images[0]] : [] } }` 반환. 없으면 기본.
  - 페이지 본문에 JSON-LD 스크립트 삽입: 재고 여부(variants 중 stock>0 존재)로 availability 계산.
```tsx
import { buildProductJsonLd } from "@/lib/seo/product-jsonld";
import { getSiteUrl } from "@/lib/site";
// ... 컴포넌트 내 product 확보 후:
const jsonLd = buildProductJsonLd({
  name: product.name,
  description: product.summary ?? product.name,
  brand: product.brand,
  priceKRW: product.basePrice,
  url: `${getSiteUrl()}/products/${product.slug}`,
  image: product.thumbnail,
  availability: product.variants.some((v) => v.stock > 0),
});
// return JSX 최상단에:
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
```
  (주의: 상품을 generateMetadata와 페이지에서 각각 조회 — Next가 동일 요청 내 fetch 중복제거를 하지만 우리 쿼리는 DB. 중복 조회 허용(소량) 또는 그대로 둠.)

- [ ] **Step 3: 목록/카테고리 메타** — `/products`에 `export const metadata = { title: "전체 상품" }`. `/category/[slug]`에 `generateMetadata`로 카테고리명 기반 title(없으면 기본). 간단히.

- [ ] **Step 4: 빌드 + 테스트 + 커밋** — `npm run build`, `npx vitest run`(+jsonld 테스트), `npx tsc --noEmit`. `git add -A && git commit -m "feat: PDP SEO metadata and product JSON-LD"`

---

### Task 5: 오픈 체크리스트 + 최종 검증

**Files:** Create `docs/launch-checklist.md`.

- [ ] **Step 1: 체크리스트 문서** — Create `docs/launch-checklist.md` (실행자가 작성, 실제 항목 채움):
```md
# WSB 종합몰 오픈 체크리스트 (목표 2026-06-30)

## 환경변수 (Vercel + .env.local)
- [ ] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / DATABASE_URL
- [ ] NEXT_PUBLIC_TOSS_CLIENT_KEY / TOSS_SECRET_KEY (운영 키로 교체)
- [ ] ADMIN_EMAILS (운영자 이메일)
- [ ] NEXT_PUBLIC_SITE_URL (실제 도메인)

## 외부 승인/계약 (리드타임 주의 — 임계경로)
- [ ] PG(토스페이먼츠) 계약·심사 완료, 운영 키 발급
- [ ] 건강기능식품판매업 신고 / 통신판매업 신고 / 구매안전(에스크로)
- [ ] 기능성 표시·광고 자율심의(건협) 통과 — 상품 카피 반영
- [ ] 사업자 정보(상호·번호·CPO 등) 정책/푸터 플레이스홀더 교체

## 인증/소셜
- [ ] Supabase Auth: 이메일 확인 정책 설정
- [ ] Kakao/Google OAuth provider 등록 + redirect URL
- [ ] (후속) 네이버 로그인

## 데이터/콘텐츠
- [ ] 실제 상품·옵션·재고·이미지 등록(어드민)
- [ ] 메인 배너 등록
- [ ] 정책 3종 법무 검토 완료
- [ ] FAQ/연락처 실제 정보

## 기능 점검(수동)
- [ ] 카탈로그→상세→장바구니→결제(테스트키)→주문완료→마이페이지
- [ ] 어드민: 상품 등록/수정, 주문 상태변경·송장, 배너, 대시보드
- [ ] 회원: 가입/로그인/로그아웃/소셜

## 기술
- [ ] 결제 하드닝(웹훅·원자적 재고) — 실결제 전
- [ ] robots.txt / sitemap.xml 확인, 네이버·구글 등록
- [ ] 도메인 연결 + SSL
```

- [ ] **Step 2: 최종 전체 검증** — `npx vitest run`(전체 통과), `npm run build`(성공, robots/sitemap 포함 라우트 확인), `npx tsc --noEmit`. 결과를 보고.

- [ ] **Step 3: 커밋** — `git add -A && git commit -m "docs: launch checklist"`

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지(§8 법적·규제, §SEO/마케팅, §고객지원):** 정책 3종(개인정보·약관·배송/교환/환불) → T1 ✅ / 14세 정책·쿠키 안내 → 개인정보처리방침 ✅ / 건강기능식품 청약철회 제한 → 배송/교환/환불 ✅ / FAQ·연락처 → T2 ✅ / SEO(메타·OG·robots·sitemap·구조화데이터) → T3/T4 ✅ / 오픈 체크리스트 → T5 ✅.

**2. 플레이스홀더 스캔:** 코드 스텝은 실제 코드. 정책 본문은 "법무 검토 템플릿 + 회사정보 플레이스홀더(○○○)"로 의도적(실데이터·법무는 운영자/법무). 체크리스트는 운영 산출물.

**3. 타입 일관성:** `getSiteUrl()`(T3)을 robots/sitemap/layout/PDP가 공유. `buildSitemapEntries`(T3)·`buildProductJsonLd`(T4) 순수·테스트. PDP의 product 필드(slug/name/summary/brand/basePrice/thumbnail/variants[].stock)는 기존 `ProductDetail`과 일치.

**리스크/주의:**
- 정책 본문은 **법적 효력을 위해 반드시 법무 검토** 후 확정. 본 계획은 구조·표준문구 템플릿 제공.
- sitemap/robots/홈/PDP가 `force-dynamic` 또는 DB 조회 → 트래픽 시 캐시 전략(후속). 
- `generateMetadata`와 페이지가 상품을 각각 조회(소량 중복) — 허용.
- SEO는 코드 기반; 실제 색인은 네이버/구글 등록(체크리스트).
