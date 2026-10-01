import { test } from "node:test";
import assert from "node:assert/strict";
import { compileMarkdown } from "../../src/lib/markdown/compile.ts";
import { extractImageUrls, estimateReadingMinutes } from "../../src/lib/markdown/reading-time.ts";

test("헤딩 id와 목차가 같은 트리에서 나온다 (중복 제목·한글·인라인 코드)", async () => {
  const md = `## 시작하기\n\n본문\n\n## 시작하기\n\n### \`torch.nn\` 모듈\n\n#### 4단계는 목차 제외\n`;
  const { html, toc } = await compileMarkdown(md);
  assert.deepEqual(
    toc.map((t) => [t.depth, t.id]),
    [
      [2, "시작하기"],
      [2, "시작하기-1"],
      [3, "torchnn-모듈"],
    ],
  );
  for (const t of toc)
    assert.ok(html.includes(`id="${t.id}"`), `heading id ${t.id} missing in html`);
  assert.equal(toc.find((t) => t.depth === 3)?.text, "torch.nn 모듈");
});

test("raw HTML·script·이벤트 속성은 제거된다", async () => {
  const md = `텍스트 <script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\n[링크](javascript:alert(1))\n\n<div onclick="x">raw</div>\n`;
  const { html } = await compileMarkdown(md);
  assert.ok(!html.includes("<script"), "script tag present");
  assert.ok(!html.includes("onerror"), "onerror present");
  assert.ok(!html.includes("onclick"), "onclick present");
  assert.ok(!html.includes("javascript:"), "javascript: href present");
});

test("코드 하이라이트(듀얼 테마), 미지원 언어는 text로 폴백", async () => {
  const md = '```python title="train.py"\nimport torch\n```\n\n```brainfuck\n+++\n```\n';
  const { html } = await compileMarkdown(md);
  assert.ok(
    html.includes("--shiki-light") || html.includes("--shiki-dark"),
    "dual theme vars missing",
  );
  assert.ok(html.includes('data-language="python"'), "language attr missing");
  assert.ok(html.includes("+++"), "fallback code lost");
});

test("수식·콜아웃·YouTube·figure 디렉티브", async () => {
  const md = [
    "인라인 $E=mc^2$ 와 블록",
    "",
    "$$",
    "\int_0^1 x\,dx",
    "$$",
    "",
    ':::callout{type="warn" title="주의"}',
    "조심하세요",
    ":::",
    "",
    '::youtube{id="dQw4w9WgXcQ"}',
    "",
    '::youtube{id="<bad>"}',
    "",
    ':::figure{caption="그림 1"}',
    "![샘플](https://example.com/a.png)",
    ":::",
    "",
  ].join("\n");
  const { html, hasMath, warnings } = await compileMarkdown(md);
  assert.ok(hasMath && html.includes("katex"), "katex missing");
  assert.ok(
    html.includes('<aside class="callout" data-type="warn" data-title="주의">'),
    `callout: ${html}`,
  );
  assert.ok(html.includes('class="youtube" data-youtube-id="dQw4w9WgXcQ"'), "youtube missing");
  assert.ok(
    html.includes("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "youtube fallback link missing",
  );
  assert.ok(html.includes("잘못된 YouTube 영상 ID"), "bad youtube id not rejected");
  assert.ok(
    html.includes('<figure class="figure">') && html.includes("<figcaption>그림 1</figcaption>"),
    "figure missing",
  );
  assert.ok(
    warnings.some((w) => w.includes("example.com/a.png")),
    "external image warning missing",
  );
});

test("이미지 크기 주입과 GFM 표/체크박스", async () => {
  const md = "![a](https://cdn.test/img.png)\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n- [x] 완료\n";
  const { html } = await compileMarkdown(md, {
    images: new Map([["https://cdn.test/img.png", { width: 800, height: 600 }]]),
  });
  assert.ok(html.includes('width="800"') && html.includes('height="600"'), "dims missing");
  assert.ok(html.includes('loading="lazy"'), "lazy missing");
  assert.ok(html.includes("<table>") && html.includes('type="checkbox"'), "gfm missing");
});

test("헬퍼: 이미지 URL 추출·읽기시간", () => {
  assert.deepEqual(extractImageUrls("![a](x.png) ![b](<y z.png>) ![a](x.png)"), [
    "x.png",
    "y z.png",
  ]);
  assert.equal(estimateReadingMinutes("가".repeat(1000)), 2);
  assert.equal(estimateReadingMinutes("short"), 1);
});
