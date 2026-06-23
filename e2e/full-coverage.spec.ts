import { test, expect, type Page } from "@playwright/test";

/**
 * 비로그인(게스트) 전체 페이지·핵심 흐름 E2E.
 * 자격증명 불필요 — 공개 페이지 + localStorage 장바구니 + 게스트 체크아웃까지 커버.
 * 전제: 서버가 E2E_BASE_URL(기본 http://localhost:3100) 에서 구동, 시드 DB 연결.
 *
 * 주의: 결제는 절대 실제 승인까지 진행하지 않는다(검증 에러 경로까지만).
 */

const PRODUCT = "nutrogin-focus";

// 에러 바운더리/Next 오버레이가 떠 있지 않은지 확인하는 공통 가드.
async function assertNotErrorPage(page: Page) {
  const body = page.locator("body");
  await expect(body).not.toContainText("This page couldn't load");
  await expect(body).not.toContainText("Application error");
  await expect(body).not.toContainText("Internal Server Error");
}

// 콘솔/페이지 에러 수집기.
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
  });
  return errors;
}

test.describe.configure({ mode: "serial" });

// ───────────────────────── 1. 전 공개 라우트 스모크 ─────────────────────────
const PUBLIC_ROUTES: [string, RegExp][] = [
  ["/", /NUTROGIN|라인업|브랜드/],
  ["/products", /라인업|상품|전체/],
  [`/products/${PRODUCT}`, /바로 구매하기|장바구니/],
  ["/category/brain-focus", /집중|상품|라인업|BRAIN/i],
  ["/category/immune", /면역|상품|라인업/],
  ["/cart", /장바구니/],
  ["/checkout", /주문서|장바구니가 비어/],
  ["/checkout/fail", /실패|결제|다시/],
  ["/login", /로그인/],
  ["/signup", /회원가입|약관/],
  ["/auth/reset", /비밀번호|재설정|이메일/],
  ["/order-lookup", /주문조회|주문번호|조회/],
  ["/search", /검색/],
  ["/support", /고객지원|문의|FAQ|자주/],
  ["/support/inquiry", /문의|작성|제목|내용/],
  ["/brand", /브랜드|NUTROGIN|스토리|BRAIN/i],
  ["/policy/shipping", /배송|교환|반품/],
  ["/policy/privacy", /개인정보/],
  ["/policy/terms", /약관|이용/],
];

for (const [path, marker] of PUBLIC_ROUTES) {
  test(`스모크: ${path} 정상 렌더`, async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res, `${path} 응답 없음`).toBeTruthy();
    expect(res!.status(), `${path} HTTP 상태`).toBeLessThan(400);
    await assertNotErrorPage(page);
    await expect(page.locator("body")).toContainText(marker);
    // 치명적 런타임 에러가 없어야 함(분석/3rd-party 잡음은 허용 폭 둠)
    const fatal = errors.filter(
      (e) => /pageerror/.test(e) && !/ResizeObserver|hydration|favicon/i.test(e),
    );
    expect(fatal, `${path} 런타임 에러:\n${fatal.join("\n")}`).toHaveLength(0);
  });
}

// ───────────────────────── 2. 헤더 네비게이션 ─────────────────────────
test("헤더: 로고·검색·장바구니·라인업 네비 동작", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "라인업" }).first().click();
  await page.waitForURL("**/products");
  await expect(page).toHaveURL(/\/products$/);

  await page.getByRole("link", { name: "검색" }).first().click();
  await page.waitForURL("**/search");

  await page.getByRole("link", { name: "장바구니" }).first().click();
  await page.waitForURL("**/cart");
});

// ───────────────────────── 3. 상품목록 → PDP ─────────────────────────
test("상품목록: 카드 렌더 + PDP 진입", async ({ page }) => {
  await page.goto("/products");
  // 헤더 nav 가 아니라 본문(main)의 상품 카드를 대상으로 — 카탈로그가 스트리밍되므로 보일 때까지 대기.
  const card = page.locator('main a[href^="/products/"]').first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.click();
  await page.waitForURL("**/products/**");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 });
});

// ───────────────────────── 4. PDP 구성요소 ─────────────────────────
test("PDP: 가격·옵션·CTA·규제고지 노출", async ({ page }) => {
  await page.goto(`/products/${PRODUCT}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "바로 구매하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "장바구니 담기" })).toBeVisible();
  // 옵션 라디오그룹
  await expect(page.getByRole("radiogroup", { name: "옵션 선택" })).toBeVisible();
  // 건강기능식품 규제 고지(질병 예방·치료 목적 아님)
  await expect(page.locator("body")).toContainText(/질병의 예방.*치료|기능성|심의|건강기능식품/);
});

// ───────────────────────── 5. 게스트 장바구니 흐름 ─────────────────────────
test("게스트: 담기 → 토스트 → 장바구니 반영 → 수량 변경 → 체크아웃 진입", async ({ page }) => {
  await page.goto(`/products/${PRODUCT}`);
  await page.getByRole("button", { name: "장바구니 담기" }).click();
  // 토스트 노출
  await expect(page.getByRole("status")).toContainText("장바구니에 담았어요");

  await page.goto("/cart");
  const row = page.locator("li", { hasText: "NUTROGIN" }).first();
  await expect(row).toBeVisible();

  // 총액 표시
  await expect(page.locator("body")).toContainText("총액");

  // 수량 증가
  const inc = page.getByRole("button", { name: /수량 증가/ }).first();
  await inc.click();
  await expect(page.locator("span.tabular-nums").first()).toHaveText("2");

  // 주문하기 → 체크아웃
  await page.getByRole("link", { name: "주문하기" }).click();
  await page.waitForURL("**/checkout");
  await expect(page.getByRole("heading", { name: "주문서" })).toBeVisible();
});

// ───────────────────────── 6. 빈 장바구니 상태 ─────────────────────────
test("빈 장바구니: 안내 + 라인업 링크", async ({ page }) => {
  await page.goto("/cart");
  await page.evaluate(() => localStorage.removeItem("wsb-cart-v1"));
  await page.reload();
  await expect(page.locator("body")).toContainText("장바구니가 비어 있습니다");
  await expect(page.getByRole("link", { name: /라인업 보러가기/ })).toBeVisible();
});

// ───────────────────────── 7. 게스트 체크아웃 검증 에러 ─────────────────────────
test("체크아웃: 빈 폼 결제 시도 → 검증 에러(주문 미생성)", async ({ page }) => {
  // 담아서 체크아웃 진입
  await page.goto(`/products/${PRODUCT}`);
  await page.getByRole("button", { name: "바로 구매하기" }).click();
  await page.waitForURL("**/checkout");

  const payBtn = page.getByRole("button", { name: /결제하기|결제 준비중/ }).first();
  await expect(payBtn).toBeVisible();
  const label = (await payBtn.textContent()) ?? "";

  if (/결제 준비중/.test(label)) {
    // 결제 OFF(소프트오픈) — 비활성 안내가 떠야 함
    await expect(page.locator("body")).toContainText(/결제를 준비 중/);
    return;
  }
  // 결제 ON — 빈 폼으로 결제 클릭 시 검증 에러 노출, 토스 SDK 미호출
  await payBtn.click();
  await expect(page.locator("body")).toContainText(/입력해 주세요|약관에 동의|주소를 검색/);
});

// ───────────────────────── 8. 검색 ─────────────────────────
test("검색: 결과/빈결과/빈쿼리 처리", async ({ page }) => {
  // 빈 쿼리 안내
  await page.goto("/search");
  await expect(page.locator("body")).toContainText("검색어를 입력해 주세요");

  // 실제 검색
  await page.getByLabel("검색어").fill("집중");
  await page.getByRole("button", { name: "검색" }).click();
  await page.waitForURL("**/search?q=**");
  await expect(page.locator("body")).toContainText(/검색 결과|결과가 없습니다/);

  // 없을 법한 쿼리 → 빈 결과 메시지
  await page.goto("/search?q=zzxxqq없는상품999");
  await expect(page.locator("body")).toContainText("검색 결과가 없습니다");
});

// ───────────────────────── 9. 회원가입 동의 게이트 ─────────────────────────
test("회원가입: 필수 약관 미동의 시 제출 비활성", async ({ page }) => {
  await page.goto("/signup");
  const submit = page.getByRole("button", { name: "회원가입" });
  await expect(submit).toBeDisabled();
  // 필수 2개 체크 → 활성화
  await page.getByLabel("이용약관 동의 (필수)").check();
  await page.getByLabel("개인정보 수집·이용 동의 (필수)").check();
  await expect(submit).toBeEnabled();
});

// ───────────────────────── 10. 로그인 폼 + 잘못된 자격 에러 ─────────────────────────
test("로그인: 폼 노출 + 잘못된 자격 시 에러", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("이메일").fill("nobody-e2e@example.com");
  await page.getByPlaceholder("비밀번호").fill("wrongpassword123");
  await page.getByRole("button", { name: "로그인" }).click();
  // Supabase 인증 에러 메시지(alert role)
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
});

// ───────────────────────── 11. 인증 게이트 ─────────────────────────
test("인증 게이트: /account → /login?next=/account 리다이렉트", async ({ page }) => {
  await page.goto("/account");
  await page.waitForURL("**/login**");
  await expect(page).toHaveURL(/next=(%2Faccount|\/account)/);
  await expect(page.locator("body")).toContainText("로그인");
});

test("어드민 게이트: /admin → /login?next=/admin", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("**/login**");
  await expect(page).toHaveURL(/next=%2Fadmin|next=\/admin/);
});

// ───────────────────────── 12. 존재하지 않는 상품 ─────────────────────────
test("없는 상품 slug: 실제 HTTP 404 + 브랜드 한국어 + 구매 패널 미노출", async ({ page }) => {
  const res = await page.goto("/products/this-slug-does-not-exist-xyz");
  expect(res?.status(), "soft-404 가 아니라 실제 404 여야 함").toBe(404);
  await expect(page.getByRole("button", { name: "바로 구매하기" })).toHaveCount(0);
  await expect(page.locator("body")).toContainText("페이지를 찾을 수 없습니다");
  await expect(page.locator("body")).not.toContainText("This page could not be found");
});

test("없는 카테고리 slug: 실제 HTTP 404", async ({ page }) => {
  const res = await page.goto("/category/this-category-does-not-exist-xyz");
  expect(res?.status()).toBe(404);
  await expect(page.locator("body")).toContainText("페이지를 찾을 수 없습니다");
});

test("최상위 미존재 경로: 헤더/푸터 포함 브랜드 404", async ({ page }) => {
  await page.goto("/this-route-truly-does-not-exist-xyz");
  await expect(page.locator("body")).toContainText("페이지를 찾을 수 없습니다");
  // 사이트 크롬(헤더 라인업 + 푸터 사업자정보)이 함께 노출되어 복귀 가능해야 함
  await expect(page.locator("footer")).toContainText(/사업자등록번호|통신판매업/);
});

// ───────────────────────── 13. 푸터 사업자정보 ─────────────────────────
test("푸터: 법적 필수 사업자정보 노출", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer).toContainText(/사업자등록번호|대표|통신판매업/);
});

// ───────────────────────── 14. SEO 인프라 ─────────────────────────
test("SEO: robots.txt / sitemap.xml 응답", async ({ page }) => {
  const robots = await page.goto("/robots.txt");
  expect(robots!.status()).toBe(200);
  const sitemap = await page.goto("/sitemap.xml");
  expect(sitemap!.status()).toBe(200);
  await expect(page.locator("body")).toContainText(/products|nutrogin|http/i);
});
