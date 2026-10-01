import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeExtractToc from "@stefanprobst/rehype-extract-toc";
import rehypeStringify from "rehype-stringify";
import type { Highlighter } from "shiki";
import { remarkDirectiveHandlers } from "./directives";
import { rehypeImageDims, type ImageDims } from "./rehype-image-dims";
import { sanitizeSchema } from "./sanitize-schema";
import { getHighlighter, THEMES } from "./highlighter";
import { estimateReadingMinutes } from "./reading-time";

export type TocItem = { depth: number; id: string; text: string };
export type CompileResult = {
  html: string;
  toc: TocItem[];
  readingMinutes: number;
  hasMath: boolean;
  warnings: string[];
};
export type CompileOptions = {
  /** 이미지 URL → 크기 (media 테이블에서 호출자가 조회) */
  images?: Map<string, ImageDims>;
};

type TocEntry = { depth: number; value: string; id?: string; children?: TocEntry[] };

function flattenToc(entries: TocEntry[] | undefined, out: TocItem[] = []): TocItem[] {
  for (const e of entries ?? []) {
    if (e.id && e.depth >= 2 && e.depth <= 3) out.push({ depth: e.depth, id: e.id, text: e.value });
    flattenToc(e.children, out);
  }
  return out;
}

/**
 * Markdown(+GFM, 수식, 디렉티브) → sanitize된 HTML + 목차 + 읽기시간.
 * 순서: parse → gfm → math → directive → remark-rehype(raw HTML 폐기) → **sanitize** →
 *       slug → autolink → katex → pretty-code(shiki) → image-dims → extract-toc → stringify
 * sanitize 이후 플러그인은 정화된 트리 위에서 신뢰된 마크업만 추가한다. 목차 id와 본문 헤딩 id는 같은 트리에서 나온다.
 */
export async function compileMarkdown(
  markdown: string,
  options: CompileOptions = {},
): Promise<CompileResult> {
  const warnings: string[] = [];
  const highlighter = await getHighlighter();

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkDirective)
    .use(remarkDirectiveHandlers)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypeKatex, { strict: false, throwOnError: false })
    .use(rehypePrettyCode, {
      theme: { light: THEMES.light, dark: THEMES.dark },
      keepBackground: false,
      defaultLang: "text",
      getHighlighter: async () => highlighter as unknown as Highlighter,
    })
    .use(rehypeImageDims, { lookup: options.images ?? new Map(), warnings })
    .use(rehypeExtractToc)
    .use(rehypeStringify)
    .process(markdown);

  const html = String(file);
  return {
    html,
    toc: flattenToc(file.data.toc as TocEntry[] | undefined),
    readingMinutes: estimateReadingMinutes(markdown),
    hasMath: html.includes('class="katex'),
    warnings,
  };
}
