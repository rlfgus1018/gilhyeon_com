import { test, expect } from "@playwright/test";
import {
  createTestAdmin,
  anonClient,
  e2eConfigured,
  type TestAdmin,
} from "./helpers/admin-session";
import { makePng } from "./helpers/png";

test.describe("관리자: 글 작성·발행·휴지통, 미디어 업로드", () => {
  test.skip(!e2eConfigured, "Supabase 환경변수(.env.local)가 필요해요");
  let admin: TestAdmin;
  const slug = `e2e-post-${Date.now()}`;

  test.beforeAll(async ({ baseURL }) => {
    admin = await createTestAdmin(baseURL!);
  });
  test.afterAll(async () => {
    await admin?.cleanup();
  });
  test.beforeEach(async ({ context }) => {
    await context.addCookies(admin.cookies);
  });

  test("비로그인은 /admin → 로그인, 관리자 세션은 대시보드", async ({ browser, page }) => {
    const fresh = await browser.newContext();
    const p = await fresh.newPage();
    await p.goto("/admin");
    await expect(p).toHaveURL(/\/admin\/login/);
    await fresh.close();

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    await expect(page.getByText("E2E 관리자")).toBeVisible();
  });

  test("새 글 → 미리보기 → 초안 저장 → 발행 → 공개 확인 → 휴지통", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await page.getByRole("textbox", { name: "제목" }).fill("E2E 테스트 글");
    await page.getByLabel("slug").fill(slug);
    await page.getByLabel("설명").fill("자동 테스트로 만든 글");

    const editor = page.locator(".cm-content");
    await editor.click();
    await page.keyboard.type("## 첫 소제목\n\n본문 **굵게** 그리고 $E=mc^2$\n\n");
    await page.keyboard.type("```python\nprint('hi')\n```\n");

    // 디바운스 미리보기: 같은 트리에서 나온 헤딩 id
    const preview = page.locator(".card-surface .prose-article");
    await expect(preview.locator("h2#첫-소제목")).toHaveText("첫 소제목", { timeout: 15_000 });
    await expect(preview.locator(".katex").first()).toBeVisible();
    await expect(preview.locator('[data-language="python"]').first()).toBeVisible();

    await page.getByRole("button", { name: "초안 저장" }).click();
    await expect(page.getByText("저장했어요.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/);

    // 초안은 anon에게 보이지 않는다
    const anon = anonClient();
    const draft = await anon.from("posts").select("id").eq("slug", slug);
    expect(draft.data?.length).toBe(0);

    await page.getByRole("button", { name: "발행" }).click();
    await expect(page.getByText("발행했어요.")).toBeVisible();
    await expect(page.getByRole("button", { name: "업데이트" })).toBeVisible();
    await expect(page.getByLabel("slug")).toBeDisabled();

    // 발행 후 anon 공개 읽기 가능, 저장된 HTML에 헤딩 id 포함, content_md는 명시 컬럼으로만
    const pub = await anon
      .from("posts")
      .select("slug,status,content_html,toc,reading_minutes")
      .eq("slug", slug)
      .single();
    expect(pub.data?.status).toBe("published");
    expect(pub.data?.content_html).toContain('id="첫-소제목"');
    expect((pub.data?.toc as { id: string }[]).map((t) => t.id)).toEqual(["첫-소제목"]);

    // 목록에 공개 배지
    await page.goto("/admin/posts");
    const row = page.locator("li", { hasText: "E2E 테스트 글" });
    await expect(row.getByText("공개", { exact: true })).toBeVisible();

    // 미리보기 페이지
    await page.goto(
      `/admin/preview/post/${(await anon.from("posts").select("id").eq("slug", slug).single()).data!.id}`,
    );
    await expect(page.getByRole("heading", { name: "E2E 테스트 글" })).toBeVisible();

    // 휴지통 → anon에게 사라짐
    await page.goto("/admin/posts");
    await row.getByRole("button", { name: "더 보기" }).click();
    await page.getByRole("menuitem", { name: "휴지통" }).click();
    await row.getByRole("button", { name: "확인" }).click();
    await expect(row).toHaveCount(0);
    await expect(page.locator("li", { hasText: "E2E 테스트 글" })).toHaveCount(0);
    const gone = await anon.from("posts").select("id").eq("slug", slug);
    expect(gone.data?.length).toBe(0);
    await page.goto("/admin/posts?status=trash");
    await expect(
      page.locator("li", { hasText: "E2E 테스트 글" }).getByText("휴지통"),
    ).toBeVisible();
  });

  test("미디어 업로드 → 크기 기록 → 삭제", async ({ page }) => {
    await page.goto("/admin/media");
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "이미지 업로드" }).click();
    await (
      await chooser
    ).setFiles({ name: "e2e-sample.png", mimeType: "image/png", buffer: makePng(4, 3) });

    const card = page.locator("li", { hasText: "e2e-sample" });
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(card.getByText("4×3")).toBeVisible();

    await card.getByRole("button", { name: "삭제" }).click();
    await card.getByRole("button", { name: "삭제", exact: true }).last().click();
    await expect(card).toHaveCount(0);
  });
});
