import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  createTestUser,
  adminClient,
  anonClient,
  e2eConfigured,
  type TestAdmin,
} from "./helpers/admin-session";

/**
 * 방명록: 비로그인 화면 → 방문자 작성(링크 거부·1분 제한) → 관리자 숨김/차단/복원/삭제.
 * 임시 방문자·관리자 계정을 만들고 끝나면 글·작성 이력·차단 행까지 지운다.
 */
test.describe.configure({ mode: "serial" });

test.describe("방명록: 작성·제한·모더레이션", () => {
  test.skip(!e2eConfigured, "Supabase 환경변수(.env.local)가 필요해요");
  let visitor: TestAdmin;
  let admin: TestAdmin;
  let visitorCtx: BrowserContext;
  let adminCtx: BrowserContext;
  let vPage: Page;
  let aPage: Page;
  const message = `E2E 방명록 ${Date.now()}`;

  const card = (page: Page) => page.locator("li", { hasText: message });
  const publicCount = async () =>
    (await anonClient().from("guestbook_public").select("id").eq("message", message)).data?.length;

  test.beforeAll(async ({ browser, baseURL }) => {
    visitor = await createTestUser(baseURL!, { admin: false });
    admin = await createTestUser(baseURL!, { admin: true });
    visitorCtx = await browser.newContext({ baseURL, locale: "ko-KR" });
    await visitorCtx.addCookies(visitor.cookies);
    adminCtx = await browser.newContext({ baseURL, locale: "ko-KR" });
    await adminCtx.addCookies(admin.cookies);
    vPage = await visitorCtx.newPage();
    aPage = await adminCtx.newPage();
  });
  test.afterAll(async () => {
    await visitorCtx?.close();
    await adminCtx?.close();
    // 방문자를 먼저 지워야 관리자가 만든 차단 행 정리와 겹치지 않는다. 하나가 실패해도 나머지는 진행.
    try {
      await visitor?.cleanup();
    } finally {
      await admin?.cleanup();
    }
  });

  test("비로그인: 로그인 안내만 보이고 작성 폼은 없다 (프로덕션은 no-store)", async ({ page }) => {
    const res = await page.goto("/guestbook");
    // next dev는 Cache-Control을 덮어쓴다. 프로덕션 서버(next start) 대상으로 돌릴 때만 검사한다.
    if (process.env.E2E_PROD) expect(res?.headers()["cache-control"] ?? "").toContain("no-store");
    await expect(page.getByRole("heading", { level: 1, name: "방명록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "GitHub로 계속하기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Google로 계속하기" })).toBeVisible();
    await expect(page.getByRole("form", { name: "방명록 작성" })).toHaveCount(0);
  });

  test("방문자: 링크 거부 → 작성 → 카드 표시 → 1분 제한", async () => {
    await vPage.goto("/guestbook");
    await expect(vPage.getByText("님으로 로그인했어요")).toBeVisible();
    await expect(vPage.getByRole("link", { name: "관리 콘솔" })).toHaveCount(0);
    const box = vPage.getByRole("textbox", { name: "메시지" });
    const submit = vPage.getByRole("button", { name: "남기기", exact: true });

    await box.fill("구경 오세요 https://example.com");
    await submit.click();
    await expect(vPage.getByText("링크나 주소는 넣을 수 없어요.")).toBeVisible();
    expect(await publicCount()).toBe(0);

    await box.fill(message);
    await vPage.getByText("민트", { exact: true }).locator("..").click();
    await submit.click();
    await expect(vPage.getByText("남겨주셔서 고마워요!")).toBeVisible();
    await expect(card(vPage)).toBeVisible();
    await expect(card(vPage)).toHaveAttribute("data-accent", "mint");
    await expect(card(vPage).getByText("내 글")).toBeVisible();
    expect(await publicCount()).toBe(1);

    await box.fill(`${message} 두 번째`);
    await submit.click();
    await expect(vPage.getByText("1분 뒤에 다시 시도해 주세요.")).toBeVisible();

    // 내 글 메뉴에는 삭제만 있고 숨기기는 없다
    await card(vPage)
      .getByRole("button", { name: /글 메뉴$/ })
      .click();
    await expect(vPage.getByRole("menuitem", { name: "삭제", exact: true })).toBeVisible();
    await expect(vPage.getByRole("menuitem", { name: "숨기기" })).toHaveCount(0);
    await vPage.keyboard.press("Escape");

    // 홈 미리보기에도 보인다
    await vPage.goto("/");
    await expect(vPage.getByText(message)).toBeVisible();
  });

  test("방문자는 관리 콘솔에 들어갈 수 없다 (404)", async () => {
    const res = await vPage.request.get("/admin/guestbook");
    expect(res.status()).toBe(404);
  });

  test("관리자: 카드 메뉴로 숨기면 공개 응답과 홈에서 사라진다", async ({ browser, baseURL }) => {
    await aPage.goto("/guestbook");
    await expect(aPage.getByRole("link", { name: "관리 콘솔" })).toBeVisible();
    await card(aPage)
      .getByRole("button", { name: /글 메뉴$/ })
      .click();
    await aPage.getByRole("menuitem", { name: "숨기기", exact: true }).click();
    await expect(card(aPage).getByText("숨김")).toBeVisible();
    expect(await publicCount()).toBe(0);

    const fresh = await browser.newContext({ baseURL });
    const p = await fresh.newPage();
    await p.goto("/guestbook");
    await expect(p.getByRole("heading", { level: 1, name: "방명록" })).toBeVisible();
    await expect(p.getByText(message)).toHaveCount(0);
    await p.goto("/");
    await expect(p.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(p.getByText(message)).toHaveCount(0);
    await fresh.close();

    // 작성자 본인에게도 보이지 않는다
    await vPage.goto("/guestbook");
    await expect(vPage.getByText("님으로 로그인했어요")).toBeVisible();
    await expect(vPage.getByText(message)).toHaveCount(0);
  });

  test("관리자 콘솔: 숨김 필터 → 복원 → 작성자 차단(모두 숨김)", async () => {
    await aPage.goto("/admin/guestbook?status=hidden");
    const row = aPage.locator("li", { hasText: message });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /글 관리$/ }).click();
    await aPage.getByRole("menuitem", { name: "복원", exact: true }).click();
    await expect(aPage.locator("li", { hasText: message })).toHaveCount(0);
    expect(await publicCount()).toBe(1);

    await aPage.goto("/admin/guestbook?status=public");
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: /글 관리$/ }).click();
    await aPage.getByRole("menuitem", { name: "작성자 차단", exact: true }).click();
    await row.getByRole("textbox", { name: "차단 사유" }).fill("e2e 차단 테스트");
    await expect(row.getByRole("checkbox", { name: "이 사용자의 글 모두 숨기기" })).toBeChecked();
    await row.getByRole("button", { name: "차단", exact: true }).click();
    await expect(aPage.locator("li", { hasText: message })).toHaveCount(0);
    expect(await publicCount()).toBe(0);

    await aPage.goto("/admin/guestbook?status=blocked");
    const blockedRow = aPage.locator("li", { hasText: visitor.id });
    await expect(blockedRow).toBeVisible();
    await expect(blockedRow.getByText("e2e 차단 테스트")).toBeVisible();
  });

  test("차단된 방문자는 작성할 수 없다", async () => {
    await vPage.goto("/guestbook");
    await vPage.getByRole("textbox", { name: "메시지" }).fill(`${message} 차단 후`);
    await vPage.getByRole("button", { name: "남기기", exact: true }).click();
    await expect(vPage.getByText("이 계정은 방명록을 이용할 수 없어요.")).toBeVisible();
  });

  test("관리자 콘솔: 차단 해제 → 글 삭제", async () => {
    await aPage.goto("/admin/guestbook?status=blocked");
    const blockedRow = aPage.locator("li", { hasText: visitor.id });
    await blockedRow.getByRole("button", { name: /차단 해제$/ }).click();
    await expect(aPage.locator("li", { hasText: visitor.id })).toHaveCount(0);

    await aPage.goto("/admin/guestbook?status=hidden");
    const row = aPage.locator("li", { hasText: message });
    await expect(row.getByText("차단됨")).toHaveCount(0);
    await row.getByRole("button", { name: /글 관리$/ }).click();
    await aPage.getByRole("menuitem", { name: "삭제", exact: true }).click();
    await row.getByRole("button", { name: "확인", exact: true }).click();
    await expect(aPage.locator("li", { hasText: message })).toHaveCount(0);

    const left = await adminClient().from("guestbook").select("id").eq("user_id", visitor.id);
    expect(left.data?.length).toBe(0);
  });
});
