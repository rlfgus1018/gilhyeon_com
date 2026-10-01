import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

/** 지원 언어(plan.md §5). 그 외 언어는 text로 폴백한다. */
export const SUPPORTED_LANGS = [
  "python",
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "bash",
  "shellscript",
  "json",
  "yaml",
  "sql",
  "markdown",
  "html",
  "css",
] as const;
export const THEMES = { light: "github-light", dark: "github-dark-dimmed" } as const;

let promise: Promise<HighlighterCore> | null = null;

/** 모듈 싱글턴. 서버 함수 콜드스타트를 줄이기 위해 코어 번들 + 필요한 언어만 로드한다. */
export function getHighlighter() {
  promise ??= createHighlighterCore({
    themes: [import("@shikijs/themes/github-light"), import("@shikijs/themes/github-dark-dimmed")],
    langs: [
      import("@shikijs/langs/python"),
      import("@shikijs/langs/typescript"),
      import("@shikijs/langs/javascript"),
      import("@shikijs/langs/tsx"),
      import("@shikijs/langs/jsx"),
      import("@shikijs/langs/bash"),
      import("@shikijs/langs/shellscript"),
      import("@shikijs/langs/json"),
      import("@shikijs/langs/yaml"),
      import("@shikijs/langs/sql"),
      import("@shikijs/langs/markdown"),
      import("@shikijs/langs/html"),
      import("@shikijs/langs/css"),
    ],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
  return promise;
}
