import { defineConfig, devices } from "@playwright/test";

/**
 * e2e: 실행 중인 서버(기본 http://localhost:3000)를 대상으로 한다.
 *   npm run dev  (다른 터미널)  →  npm run test:e2e
 * 관리자 테스트는 .env.local 의 Supabase 값으로 임시 이메일 관리자 계정을 만들고 끝나면 지운다.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "ko-KR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
