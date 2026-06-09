import { test, expect, type Page } from "@playwright/test";

/**
 * 로그인이 필요한 P0/P1 고객 여정 E2E.
 * 자격증명은 환경변수로만 받는다 (하드코딩 금지). 미설정 시 전체 skip.
 * 전제: 빌드·구동된 서버 + 시드된 DB + E2E_EMAIL 계정 UID로 더미데이터 시드.
 */
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const PRODUCT_SLUG = process.env.E2E_PRODUCT_SLUG ?? "nutrogin-focus";
const COUPON_CODE = process.env.E2E_COUPON_CODE ?? "WELCOME3000";

test.skip(!EMAIL || !PASSWORD, "E2E_EMAIL / E2E_PASSWORD 환경변수가 필요합니다.");

async function login(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("이메일").fill(EMAIL!);
  await page.getByPlaceholder("비밀번호").fill(PASSWORD!);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("**/account");
}

test.describe.configure({ mode: "serial" });

test.describe("로그인 후 고객 여정", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("마이페이지: 요약 카드 + 네비 + 주문 목록", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "마이페이지" })).toBeVisible();
    // 서버 에러 페이지가 아니어야 함 (통합 회귀 가드)
    await expect(page.locator("body")).not.toContainText("This page couldn't load");
    // 네비 그리드 — 헤더의 동명 링크와 구분하기 위해 마이페이지 메뉴 영역으로 스코프
    const menu = page.getByLabel("마이페이지 메뉴");
    for (const label of ["찜 목록", "쿠폰함", "배송지 관리", "내 리뷰", "1:1 문의"]) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }
  });

  for (const [path, marker] of [
    ["wishlist", /찜|상품|담은/],
    ["coupons", /쿠폰|할인/],
    ["reviews", /리뷰/],
    ["addresses", /배송지|기본|주소/],
    ["inquiries", /문의/],
  ] as const) {
    test(`계정 섹션 /account/${path} 렌더`, async ({ page }) => {
      await page.goto(`/account/${path}`);
      await expect(page.locator("body")).toContainText(marker);
      // 서버 에러 페이지가 아니어야 함
      await expect(page.locator("body")).not.toContainText("This page couldn't load");
    });
  }

  test("PDP 찜 토글", async ({ page }) => {
    await page.goto(`/products/${PRODUCT_SLUG}`);
    const heart = page.locator("button[aria-pressed]").first();
    const before = await heart.getAttribute("aria-pressed");
    await heart.click();
    await expect(heart).not.toHaveAttribute("aria-pressed", before ?? "");
  });

  test("체크아웃 쿠폰 적용 → 할인 반영", async ({ page }) => {
    // 담기 → 장바구니
    await page.goto(`/products/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: /장바구니 담기/ }).click();
    await page.waitForURL("**/cart");
    // 체크아웃 → 쿠폰 적용
    await page.goto("/checkout");
    const couponInput = page.getByPlaceholder(/쿠폰 코드|코드/).first();
    await couponInput.fill(COUPON_CODE);
    await page.getByRole("button", { name: /적용/ }).first().click();
    // 할인 적용 라벨 또는 해제 버튼이 떠야 함
    await expect(page.getByText(/할인 적용|해제/).first()).toBeVisible({ timeout: 10000 });
  });
});
