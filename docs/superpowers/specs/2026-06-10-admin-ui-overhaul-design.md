# WSB 종합몰 — 어드민 UI/UX 전면 개선 설계

> 작성일: 2026-06-10 · 범위: 어드민(`/admin/*`) 9개 화면의 시각/구조 개편 — 전용 셸·테마(라이트+다크)·공용 컴포넌트·대시보드 표현 개선 · 기능(쿼리/액션) 변경 없음

## 0. 배경과 목표

현재 어드민은 기능은 갖췄으나 시각·구조 품질이 약하다. 실제 화면 점검(9개 캡처)에서 확인된 문제:

1. **스토어프론트 크롬 상속** — 루트 레이아웃(`src/app/layout.tsx`)이 `SiteHeader`/`SiteFooter`/`CartProvider`를 전 페이지에 주입해, 어드민이 고객용 GNB(두뇌·집중/면역/…)·검색·장바구니·위시리스트·고객 푸터를 그대로 달고 있다. 운영 콘솔에 부적합.
2. **막대그래프 정렬·품질** — 대시보드 "매출 추이"가 div-width 핵으로, 값 라벨(₩117,000)이 막대 우측에 제각각 위치해 정렬이 어긋나 보인다. 축·그리드·baseline 없음, 날짜 간격 불규칙.
3. **빈약한 표현** — KPI가 얇은 테두리 박스, 여백 과다, 시각적 위계 약함. 전반적으로 제네릭한 "AI 어드민 템플릿" 느낌.
4. **화면 간 불일치** — 주문은 필터탭·검색·페이지네이션이 있으나 상품·리뷰·배너는 없음. 상태 표기가 pill이 아닌 평문 컬러 텍스트. 리뷰 표는 과밀(cramped).

**목표:** 기능은 보존하면서, 어드민 전용 셸 + 라이트/다크 테마 + 공용 컴포넌트 시스템을 도입해 9개 화면을 일관되고 프로덕션급으로 끌어올린다. WSB의 "lab/데이터" 브랜드 정체성을 운영 콘솔 톤으로 반영한다.

### 확정된 설계 결정 (사용자 합의)

| 항목 | 결정 |
|---|---|
| 미감 방향 | **라이트 기본 + 다크(Lab Console) 토글** — CSS 변수 테마 |
| 셸 | 어드민 전용 셸, **라우트 그룹으로 스토어프론트 크롬 분리** |
| 범위 | **9개 화면 전부**에 공용 디자인 시스템 적용 |
| 대시보드 | **표현만 개선**(차트·카드·셀) — 신규 집계 쿼리 없음, 기존 데이터 그대로 |
| 구현 방식 | **접근법 A** — 디자인 시스템(파운데이션) 먼저 → 화면 순차 적용 |
| 차트 | 의존성 0 **서버 렌더 SVG 컴포넌트**(외부 차트 라이브러리 미도입) |

### 비범위
- 신규 대시보드 지표(전기 대비 증감·추세 미니차트 등 신규 집계 쿼리)
- 어드민 기능/도메인 로직 변경(쿼리·서버액션·스키마)
- 스토어프론트 디자인 변경(크롬 분리 외)
- 상품 이미지 업로드(Supabase Storage) 등 기존 비범위 항목

## 1. 테마 시스템 (라이트 기본 + 다크 토글)

- **단일 출처:** 어드민 전용 CSS 변수를 `src/styles/globals.css`에 정의. 기본값(라이트)은 `[data-theme]` 루트에, 다크 오버라이드는 `[data-theme="dark"]`에. 토큰 집합:
  `--ad-bg, --ad-panel, --ad-panel-2, --ad-line, --ad-line-2, --ad-ink, --ad-mut, --ad-mut-2, --ad-accent, --ad-accent-2, --ad-neon, --ad-pos, --ad-neg`.
- **스코프:** 변수는 어드민 셸 루트 `div[data-theme]`에만 선언 → 스토어프론트 비영향. 어드민 컴포넌트는 `bg-[var(--ad-panel)]` 식으로 직참조(또는 Tailwind `@theme` 매핑 유틸 `bg-ad-panel`).
- **영속·무플래시:** 쿠키 `admin-theme`(`light`/`dark`). 어드민 레이아웃(서버)이 `cookies()`로 읽어 셸 루트에 `data-theme` 주입 → SSR 시점에 확정되어 깜빡임 없음. 클라이언트 `ThemeToggle`이 클릭 시 쿠키 갱신 + 루트 `data-theme` 즉시 토글.
- **다크 명세:** bg `#0B0F0D` · panel `#121A16` · line `#1E2A24` · ink `#E8EFEA` · mut `#7E908A` · accent `#3DDC84` · accent-2 `#86F7B0` · neon `#E8FF00`(뱃지).
- **라이트 명세:** bg `#F6F7F4` · panel `#FFFFFF` · line `#E7E9E2` · line-2 `#EFF1EB` · ink `#1A201C` · mut `#6B756E` · accent `#0F5132`/`#177A4B`/`#2FB36B` · alert amber `#B7791F`.

## 2. 어드민 전용 셸 (라우트 그룹 분리)

**문제:** 루트 레이아웃이 모든 라우트에 고객 크롬 주입.

**구조 변경:**
- `src/app/layout.tsx` → **최소화**: `<html><body>` + 폰트(`JetBrains_Mono`) + `globals.css` + 기본 metadata만. `SiteHeader`/`SiteFooter`/`CartProvider` 제거.
- `src/app/(storefront)/layout.tsx` **신설**: 기존 루트 레이아웃의 `SiteHeader` + `CartProvider` + `<main>` + `SiteFooter` 이전. 스토어프론트 라우트 폴더를 `(storefront)/` 아래로 이동:
  `page.tsx`(홈)·`products`·`category`·`cart`·`checkout`·`search`·`brand`·`support`·`policy`·`account`·`login`·`signup`·`auth`·`order-lookup`. **라우트 그룹은 URL·`@/*` import에 영향 없음**(폴더 이동 = `git mv` 수준).
  - 주의: `robots.ts`·`sitemap.ts`·`api/*`·`admin/*`·`middleware.ts`는 이동 대상 아님. `api/health` 등 그대로.
- `src/app/admin/layout.tsx` → `requireAdmin()` 유지 + **`AdminShell`** 렌더:
  - **사이드바**: 브랜드(WSB OPS CONSOLE) + 섹션 그룹(OVERVIEW / COMMERCE / SUPPORT) + 아이콘 NAV + 활성 하이라이트 + **NAV 뱃지**(미답변 문의·대기 취소요청 수 — 기존 `countOpenInquiries`/`countRequestedCancellations` 재사용).
  - **상단바**: 브레드크럼 · 기간 칩 · **`ThemeToggle`** · 계정 이니셜.
  - 고객 헤더/푸터 없음.

> **검증 포인트:** 라우트 그룹 이동 후 스토어프론트(홈/PDP/체크아웃/계정) 회귀 없음 확인.

## 3. 공용 컴포넌트 라이브러리 (`src/components/admin/ui/*`)

각 컴포넌트는 단일 책임·테마 변수 기반·접근성(포커스링) 준수. 이모지 금지.

- **`AdminCard`** — 패널 컨테이너(제목 + 우측 태그 슬롯 + children).
- **`Kpi`** — 라벨(mono·uppercase) + 큰 숫자(800) + 선택적 델타(`pos`/`neg`). 대시보드는 델타 미사용.
- **`StatusBadge`** — `kind`(order/cancellation/inquiry/visibility) + `value` → 색 pill. 매핑 단일화:
  주문(pending/paid/preparing/shipped/delivered/cancelled), 취소(requested/refunded/rejected), 문의(open/answered), 노출(노출/숨김).
- **`DataTable`** — props: `columns`, `rows`(또는 children 렌더), `toolbar`(검색/필터탭/액션 슬롯), `pagination`(슬롯), `empty`(빈 상태). 헤더·행·여백·정렬 표준화. 7개 표 화면 공통.
- **`RevenueChart`** — 서버 렌더 SVG 막대차트. **공유 baseline + y축 눈금(0/30k/…/ymax) + 그리드 + 정렬된 x라벨**. props: `data: {day,total}[]`, `height`. ymax는 30k 배수 올림. → 막대그래프 정렬 문제 근본 해결. CSS 호버 강조(선택).
- **`Donut`** — 비율 도넛(재구매율). props: `percent`, 중앙 라벨.
- **`StatusBars`** — 주문 상태 막대 목록(라벨·트랙·수치).
- **폼 컨트롤** — `AdminInput`/`AdminSelect`/`AdminTextarea`/`AdminCheckbox`/`AdminButton`(variant: primary/ghost/danger). 일관 사이즈·포커스링.

## 4. 화면별 적용 (9개)

기능·데이터 로직은 **불변**, 표현만 교체.

| 화면 | 변경 |
|---|---|
| 대시보드 | `RevenueChart`로 차트 교체, KPI/처리대기/주문상태/탑상품/회원도넛을 새 카드로 재구성. **기존 쿼리 그대로**(신규 집계 없음). |
| 주문 목록 | `DataTable` + 필터탭/검색/페이지네이션을 툴바·슬롯으로, 상태→`StatusBadge`. |
| 주문 상세 | 카드 레이아웃 정리, 상태 버튼·송장폼·추적링크를 새 컨트롤로. |
| 취소/반품 | `DataTable` + `StatusBadge`(취소상태), 승인/반려 UI 정리. |
| 쿠폰 | `DataTable` + `CouponForm`을 새 폼 컨트롤로, 상태/할인 pill. |
| 문의 | 카드형 목록 정리(과밀 해소), 필터·답변폼 새 컨트롤. |
| 리뷰 | `DataTable` 과밀 해소(행 높이·요약 컬럼 정리), 숨김/노출 `StatusBadge`, 필터·페이지네이션 슬롯. |
| 상품 목록 | `DataTable`, 노출 상태 pill. **검색/페이지네이션 일관성 소폭 보강**(YAGNI 내). |
| 상품 등록/수정·배너 | `ProductForm`/배너폼을 새 폼 컨트롤·카드로. |

## 5. 디자인 토큰 명세 (요약)

- 색: §1 라이트/다크 표 참조. 단일 출처 = `globals.css` CSS 변수.
- 타이포: 본문 **Pretendard**, 데이터·라벨 **JetBrains Mono**(기존 유지). KPI 큰 숫자 weight 800, 라벨 mono uppercase tracking.
- 형태: 라디우스 14–16(카드), 9–10(컨트롤). 1px 라인 + 라이트는 soft shadow, 다크는 라인+서브틀 글로우.
- 아이콘: 인라인 SVG(stroke-width 2), 외부 아이콘 패키지 미도입.

## 6. 테스트 / 검증

- 시각 작업이라 순수 도메인 테스트는 없음. **빌드 + 어드민 로그인 후 Playwright로 9개 화면 캡처 + 라이트/다크 토글 캡처** 비교.
- **토큰 동기화:** `src/lib/design-tokens.ts` ↔ `globals.css` 동기화 검증 테스트가 있으면, 어드민 토큰도 동일 패턴으로 미러·검증 추가.
- **스토어프론트 회귀:** 라우트 그룹 이동 후 홈·PDP·장바구니·체크아웃·계정 정상 렌더 + 빌드 라우트 트리에 URL 변동 없음 확인.
- `npx tsc --noEmit` + `npm run build` + 기존 `npx vitest run` 전부 통과.

## 7. 구현 단계 (접근법 A — 파운데이션 → 적용)

- **Phase 0 — 파운데이션:** 테마 토큰(globals.css) + 쿠키 토글(`ThemeToggle`) · 루트 레이아웃 최소화 + `(storefront)` 라우트 그룹 이동 + `AdminShell`(사이드바·상단바) · 공용 컴포넌트(`AdminCard`/`Kpi`/`StatusBadge`/`DataTable`/`RevenueChart`/`Donut`/`StatusBars`/폼 컨트롤). 빌드·회귀 확인.
- **Phase 1 — 대시보드:** 새 카드/차트로 재구성(기존 쿼리).
- **Phase 2 — 표 화면군:** 주문·취소·쿠폰·리뷰·상품 목록을 `DataTable`+`StatusBadge`로.
- **Phase 3 — 폼/상세군:** 주문상세·상품 등록/수정·배너·문의·쿠폰폼을 새 컨트롤로.
- 각 Phase 종료 시 빌드 + Playwright 캡처 검증, 독립 커밋.

## 8. 리스크 / 주의

- **라우트 그룹 이동**이 최대 구조 변경 — 폴더 이동은 URL/import 불변이나, 루트 레이아웃에서 `CartProvider`가 빠지므로 스토어프론트 레이아웃으로 정확히 옮겨야 장바구니 동작 유지. 이동 후 회귀 검증 필수.
- 다크 무플래시는 쿠키 SSR 주입으로 확보(클라이언트 토글만 쓰면 깜빡임 발생 → 반드시 서버 주입).
- `DataTable` 일반화가 과해지지 않도록 — 7개 화면의 실제 공통분모만 추출(YAGNI). 특수 셀은 render 슬롯으로.
- 토큰 동기화 테스트가 어드민 변수까지 강제하면 라이트/다크 두 세트 미러 필요 — 테스트 범위 합의.

## 부록. 신규/수정 파일 맵 (개요)

```
신규:
  src/app/(storefront)/layout.tsx                  # 스토어프론트 크롬
  src/components/admin/shell/admin-shell.tsx       # 사이드바+상단바
  src/components/admin/shell/theme-toggle.tsx      # 다크 토글(client)
  src/components/admin/ui/{admin-card,kpi,status-badge,data-table,revenue-chart,donut,status-bars,controls}.tsx
수정:
  src/app/layout.tsx                               # 최소화(html/body/폰트)
  src/styles/globals.css                           # 어드민 테마 변수(라이트/다크)
  src/app/admin/layout.tsx                          # AdminShell 적용
  src/app/admin/page.tsx                            # 대시보드 재구성
  src/app/admin/**/page.tsx, actions 연계 폼 컴포넌트  # 9개 화면 적용
이동(git mv, URL 불변):
  src/app/{page.tsx,products,category,cart,checkout,search,brand,support,policy,account,login,signup,auth,order-lookup} → src/app/(storefront)/
```
