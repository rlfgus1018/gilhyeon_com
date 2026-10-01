"use client";

import { useEffect, useRef, useState } from "react";
import { ArticleBody } from "@/components/blog/article-body";
import { previewMarkdown } from "@/app/admin/(gated)/posts/actions";

type Props = { markdown: string; initialHtml?: string; debounceMs?: number };

/** 서버 액션으로 컴파일한 미리보기 (디바운스). 공개 페이지와 같은 스타일. */
export function PreviewPane({ markdown, initialHtml = "", debounceMs = 800 }: Props) {
  const [html, setHtml] = useState(initialHtml);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [toc, setToc] = useState<{ depth: number; id: string; text: string }[]>([]);
  const last = useRef(markdown);
  const seq = useRef(0);

  useEffect(() => {
    if (markdown === last.current && html) return;
    const my = ++seq.current;
    setState("loading");
    const t = setTimeout(async () => {
      const r = await previewMarkdown({ content_md: markdown });
      if (my !== seq.current) return;
      if (r.ok) {
        setHtml(r.html);
        setToc(r.toc);
        setState("idle");
        last.current = markdown;
      } else setState("error");
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown, debounceMs]);

  return (
    <div className="card-surface relative min-h-[60vh] overflow-y-auto p-6">
      <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
        <span>미리보기</span>
        <span>
          {state === "loading"
            ? "렌더 중…"
            : state === "error"
              ? "렌더 실패"
              : toc.length
                ? `목차 ${toc.length}개`
                : ""}
        </span>
      </div>
      {html ? (
        <ArticleBody html={html} />
      ) : (
        <p className="text-muted-foreground text-sm">본문을 입력하면 여기에 미리보기가 나타나요.</p>
      )}
    </div>
  );
}
