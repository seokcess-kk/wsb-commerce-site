# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Next.js 16 + React 19 — 학습 데이터와 다를 수 있음.** API를 쓰기 전 `node_modules/next/dist/docs/` 의 해당 가이드를 먼저 확인할 것 (AGENTS.md 참조).

## 프로젝트

WSB(우리스마트바이오) 건강기능식품 D2C **종합몰**. 자사몰 운영 주체는 WSB(쉘), NUTROGIN이 입점 대표 브랜드. Lean MVP — "보고 → 담고 → 결제 → 받고 → 재방문" 핵심 매출 흐름에 집중. 전체 설계는 `docs/superpowers/specs/2026-06-01-wsb-commerce-site-design.md`, 단계별 구현 계획은 `docs/superpowers/plans/` 참조.

## 명령어

```bash
npm run dev          # 개발 서버 (Turbopack)
npm run build        # 프로덕션 빌드
npm run lint         # ESLint (eslint-config-next)
npm test             # Vitest 1회 실행
npm run test:watch   # Vitest watch
npx vitest run src/lib/checkout/pricing.test.ts   # 단일 테스트 파일 실행

npm run db:generate  # 스키마 변경 → 마이그레이션 SQL 생성 (drizzle/)
npm run db:migrate   # 마이그레이션 적용
npm run db:seed      # 시드 데이터 (src/db/seed.ts)
```

환경변수는 `.env.example` 참조 후 `.env.local` 생성. `src/lib/env.ts` 의 zod 스키마가 검증한다 — 새 환경변수는 반드시 이 스키마에 추가할 것.

## 아키텍처

**스택:** Next.js 16 App Router (Server Components 중심) · React 19 · Drizzle ORM + postgres-js · Supabase (Auth/DB/Storage) · 토스페이먼츠 · Tailwind v4 + shadcn/ui · Vitest. 경로 별칭 `@/*` → `src/*`.

### 지연 초기화 패턴 (중요)

`env`, `db` 는 **Proxy 기반 지연 접근자**다 (`src/lib/env.ts`, `src/db/index.ts`). 모듈을 import해도 side effect가 없고, 실제 프로퍼티 접근 시점에 `process.env`/DB 클라이언트가 생성된다. 이유: 테스트 환경에서 env 누락으로 import-time crash를 피하기 위함. 코드에서는 `env.X` / `db.select()` 또는 명시적으로 `getEnv()` / `getDb()` 를 쓴다 — **모듈 최상위에서 env 값을 캡처하지 말 것.**

### 데이터 계층

- 스키마: `src/db/schema/*` (테이블별 파일), `index.ts`가 배럴 re-export. `getDb()` 의 drizzle 인스턴스에 `schema`가 주입돼 있어 `db.query` 관계형 API 사용 가능.
- 쿼리: `src/db/queries/*` 에 도메인별로 모음 (storefront용 `products.ts`/`orders.ts`, 어드민용 `admin-*.ts`).
- 가격은 **정수(원)** 로 저장. `basePrice`(products) + `priceDelta`(variants) = 단가.
- 마이그레이션은 drizzle-kit로 생성된 `drizzle/*.sql` — 수동 편집 금지, 스키마 수정 후 `db:generate`.

### 인증 / 권한

- Supabase Auth(SSR). 클라이언트 생성: 서버 컴포넌트/액션은 `src/lib/supabase/server.ts`의 `createClient()`, 브라우저는 `client.ts`.
- `middleware.ts` 가 매 요청마다 `supabase.auth.getUser()` 로 세션 쿠키를 갱신한다 (matcher가 정적 자산·`/api/health` 제외).
- 현재 사용자: `getCurrentUser()` (`src/lib/auth/current-user.ts`).
- **어드민 게이트:** 어드민 서버 액션/페이지는 첫 줄에서 `await requireAdmin()` 호출. `ADMIN_EMAILS`(쉼표 구분) 화이트리스트로 판정하며, 미인증은 `/login`, 권한없음은 `/`로 redirect. 역할 테이블이 아닌 이메일 기반임에 유의.

### 결제 흐름 (토스페이먼츠)

1. `POST /api/orders` — variant/product 조회로 서버에서 가격·배송비 재계산(클라이언트 금액 신뢰 안 함), `status: "pending"` 주문 생성, `orderNumber` 반환. **재고는 best-effort 체크만 — 원자적 차감/예약은 미구현(TODO).**
2. 클라이언트가 토스 SDK로 결제 → `/checkout/success` 로 리다이렉트.
3. `/checkout/success` (force-dynamic) 에서 `confirmTossPayment()` 로 서버 승인, 금액 일치 검증 후 트랜잭션으로 payment insert + order를 `paid`로 전이. 멱등 처리(`onConflictDoNothing`, 이미 `paid`면 재승인 안 함).

`shippingFee()`(`src/lib/checkout/pricing.ts`): 기본 3,000원 / 5만원 이상 무료.

### 장바구니

`src/lib/cart/cart-context.tsx` — **localStorage 기반 클라이언트 전용**(`wsb-cart-v1`). 순수 로직은 `cart-logic.ts`에 분리(테스트 대상). 서버 DB에 장바구니 없음.

### 라우트 구조 (`src/app`)

`/`(홈) · `/products`·`/products/[slug]`(PDP) · `/category/[slug]` · `/cart` · `/checkout`(+`success`/`fail`) · `/login`·`/signup`·`/auth/*` · `/account/*`(마이페이지) · `/admin/*`(상품·주문·배너 CRUD + 대시보드) · `/policy/*`·`/support` · `robots.ts`·`sitemap.ts`.

### 디자인 시스템 — 듀얼 브랜드

색상 단일 출처는 `src/styles/globals.css`(`:root` CSS 변수) ↔ `src/lib/design-tokens.ts`(동일 값 미러, 테스트로 동기화 검증). **WSB 쉘**(green `#0F5132`/carbon/lab) 위에 **NUTROGIN 존**(cobalt `#0047FF`/neon `#E8FF00`)이 브랜드 스토리·해당 PDP에서 액센트로 전환. Tailwind 토큰: `wsb-*`, `ng-*`. 폰트: 본문 Pretendard, 데이터/뱃지 JetBrains Mono.

> 디자인 메모리: 브랜드 기반 프로덕션급 UI를 지향, 제네릭한 "AI look" 금지.

## 테스트 컨벤션

Vitest + jsdom + Testing Library. 테스트는 소스 옆 `*.test.ts(x)` 로 배치(`src/**/*.test.{ts,tsx}`). **순수 도메인 로직(`src/lib/**`, `src/db/queries` 헬퍼)을 먼저 분리해 단위 테스트**하는 패턴 — 가격·수량·주문번호·재고·분석 헬퍼 등이 UI/DB와 독립적으로 검증된다. UI 컴포넌트도 RTL로 테스트. `vitest.setup.ts`가 jest-dom matcher 로드.

## 규제 (건강기능식품)

PDP에는 심의필 문구 + "질병의 예방·치료를 위한 것이 아님" 고지가 표준 배치돼야 한다(`compliance-notice` 컴포넌트). products 스키마의 `reportNo`/`functionality`/`intakeNotice`/`ingredients`/`reviewPhraseNo` 는 규제 표기 필드.
