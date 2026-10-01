import { defaultSchema, type Options as SanitizeOptions } from "rehype-sanitize";

const base = defaultSchema.attributes ?? {};

/**
 * sanitize는 remark-rehype 직후(하이라이트·KaTeX 전)에 실행된다.
 * 이후 플러그인(slug, katex, pretty-code, toc)은 이미 정화된 트리 위에서 신뢰된 마크업만 추가한다.
 * raw HTML은 remark-rehype에서 이미 버려진다(allowDangerousHtml=false).
 */
export const sanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "aside",
    "figure",
    "figcaption",
    "section",
    "mark",
    "kbd",
  ],
  attributes: {
    ...base,
    code: [...(base.code ?? []), ["className", /^language-[\w+#.-]+$/]],
    span: [...(base.span ?? []), ["className", "math", "math-inline"]],
    div: [
      ...(base.div ?? []),
      ["className", "math", "math-display", "youtube"],
      ["dataYoutubeId", /^[A-Za-z0-9_-]{6,20}$/],
    ],
    aside: [["className", "callout"], ["dataType", "info", "warn", "tip"], "dataTitle"],
    figure: [["className", "figure"]],
    a: [...(base.a ?? []), "title"],
    img: [...(base.img ?? []), "title"],
  },
};
