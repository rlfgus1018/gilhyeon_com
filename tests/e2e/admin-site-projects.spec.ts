import { test, expect } from "@playwright/test";
import {
  createTestAdmin,
  anonClient,
  e2eConfigured,
  type TestAdmin,
} from "./helpers/admin-session";

test.describe("관리자: 사이트 콘텐츠·프로젝트", () => {
  test.skip(!e2eConfigured, "Supabase 환경변수(.env.local)가 필요해요");
  let admin: TestAdmin;
  let originalGreeting: string;
  const slug = `e2e-project-${Date.now()}`;

  test.beforeAll(async ({ baseURL }) => {
    admin = await createTestAdmin(baseURL!);
    const { data } = await anonClient()
      .from("site_content")
      .select("data")
      .eq("key", "hero")
      .single();
    originalGreeting = (data?.data as { greeting: string }).greeting;
  });
  test.afterAll(async ({ browser, baseURL }) => {
    // 히어로 문구 원복
    const ctx = await browser.newContext({ baseURL });
    await ctx.addCookies(admin.cookies);
    const page = await ctx.newPage();
    await page.goto("/admin/site");
    await page.getByLabel("인사말").fill(originalGreeting);
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("저장했어요")).toBeVisible();
    await ctx.close();
    const db = (await import("postgres")).default(process.env.SUPABASE_DB_URL!, {
      max: 1,
      prepare: false,
      onnotice: () => {},
    });
    try {
      await db`delete from public.projects where slug like 'e2e-%'`;
    } finally {
      await db.end();
    }
    await admin.cleanup();
  });
  test.beforeEach(async ({ context }) => {
    await context.addCookies(admin.cookies);
  });

  test("히어로 문구 저장 → 홈에 반영", async ({ page }) => {
    const greeting = `E2E 인사말 ${Date.now()}`;
    await page.goto("/admin/site");
    await page.getByLabel("인사말").fill(greeting);
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText("저장했어요")).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(greeting);
  });

  test("프로젝트 생성 → 공개 → 목록 카드·상세 → 휴지통", async ({ page }) => {
    await page.goto("/admin/projects/new");
    await page.getByRole("textbox", { name: "제목" }).fill("E2E 프로젝트");
    await page.getByLabel("slug").fill(slug);
    await page.getByLabel(/한 줄 요약/).fill("자동 테스트 프로젝트");
    await page.getByLabel("GitHub").fill("https://github.com/rlfgus1018");
    await page.locator(".cm-content").click();
    await page.keyboard.type("## 문제 정의\n\n설명\n");
    await page.getByRole("button", { name: "공개" }).click();
    await expect(page.getByText("공개했어요.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/projects\/[0-9a-f-]{36}$/);

    await page.goto("/projects");
    const card = page.locator("article", { hasText: "E2E 프로젝트" });
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/rlfgus1018",
    );
    await card.getByRole("link", { name: "자세히" }).click();
    await expect(page).toHaveURL(`/projects/${slug}`);
    await expect(page.locator("#article h2#문제-정의")).toBeVisible();

    await page.goto("/admin/projects");
    const row = page.locator("li", { hasText: "E2E 프로젝트" });
    await row.getByRole("button", { name: "더 보기" }).click();
    await page.getByRole("menuitem", { name: "휴지통" }).click();
    await row.getByRole("button", { name: "확인" }).click();
    await expect(page.locator("li", { hasText: "E2E 프로젝트" })).toHaveCount(0);
    expect((await page.request.get(`/projects/${slug}`)).status()).toBe(404);
    const anon = await anonClient().from("projects").select("id").eq("slug", slug);
    expect(anon.data?.length).toBe(0);
  });
});
