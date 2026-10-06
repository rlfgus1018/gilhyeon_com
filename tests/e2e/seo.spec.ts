import { expect, test } from "@playwright/test";

/**
 * P6: OG 이미지·sitemap·404·크론 인증. 로그인 불필요, 데이터 생성 없음.
 */
test.describe("SEO·OG·오류 페이지", () => {
  test("기본 OG 이미지가 PNG 1200×630으로 나온다", async ({ request }) => {
    const res = await request.get("/opengraph-image");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
    const buf = await res.body();
    // PNG 시그니처 + IHDR 폭·높이
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);
  });

  test("없는 글·프로젝트의 OG 이미지도 안내 카드(PNG)로 응답한다", async ({ request }) => {
    for (const path of [
      "/blog/no-such-post-e2e/opengraph-image",
      "/projects/no-such-project-e2e/opengraph-image",
    ]) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
      expect(res.headers()["content-type"], path).toContain("image/png");
    }
  });

  test("홈·목록 페이지의 og:image가 기본 카드를 가리킨다", async ({ page }) => {
    await page.goto("/");
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toMatch(/\/opengraph-image/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/^https?:\/\/[^/]+\/?$/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  });

  test("sitemap·robots가 응답한다", async ({ request }) => {
    const sm = await request.get("/sitemap.xml");
    expect(sm.status()).toBe(200);
    const xml = await sm.text();
    expect(xml).toContain("/projects</loc>");
    expect(xml).toContain("/guestbook</loc>");
    const rb = await request.get("/robots.txt");
    expect(rb.status()).toBe(200);
  });

  test("404 페이지: 상태 코드와 둘러보기 링크", async ({ page }) => {
    const res = await page.goto("/no-such-page-e2e");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "이 페이지는 없어요" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "대신 둘러보기" })).toBeVisible();
    // Button render={<Link/>} 는 접근성 트리에서 button 으로 잡힌다
    await expect(page.getByRole("button", { name: "홈으로" })).toBeVisible();
  });

  test("크론 엔드포인트는 비밀 없이는 401", async ({ request }) => {
    const res = await request.get("/api/cron/daily");
    expect(res.status()).toBe(401);
    const bad = await request.get("/api/cron/daily", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(bad.status()).toBe(401);
  });
});
