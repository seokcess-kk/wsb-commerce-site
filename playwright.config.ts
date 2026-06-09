import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 설정. Vitest 단위/컴포넌트 테스트와 분리된 브라우저 E2E (testDir: e2e/).
 *
 * 실행 전제:
 *   1) 앱이 빌드되어 구동 중이어야 함 (`npm run build && npx next start -p 3100`)
 *   2) 시드된 DB + "이메일 확인이 끝난" 테스트 계정
 *   3) 해당 계정 UID로 더미데이터 시드: `SEED_DEMO_USER_ID=<uid> npm run db:seed`
 *
 * 환경변수:
 *   E2E_BASE_URL  (기본 http://localhost:3100)
 *   E2E_EMAIL     로그인 테스트 계정 이메일   (없으면 로그인 필요 테스트는 skip)
 *   E2E_PASSWORD  로그인 테스트 계정 비밀번호
 *
 * 실행: `E2E_EMAIL=.. E2E_PASSWORD=.. npm run test:e2e`
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    viewport: { width: 1280, height: 1600 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
