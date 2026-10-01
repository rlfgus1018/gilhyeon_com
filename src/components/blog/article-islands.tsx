"use client";

import { useEffect } from "react";

/**
 * 저장된 HTML 위에 붙는 클라이언트 동작:
 *  - 코드 블록 복사 버튼
 *  - YouTube 플레이스홀더 → 클릭 시 iframe
 * 서버가 만든 마크업은 그대로 두고 이벤트와 작은 요소만 추가한다.
 */
export function ArticleIslands({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    const cleanups: (() => void)[] = [];

    root
      .querySelectorAll<HTMLElement>("figure[data-rehype-pretty-code-figure], pre")
      .forEach((wrap) => {
        if (wrap.tagName === "PRE" && wrap.closest("figure[data-rehype-pretty-code-figure]"))
          return;
        if (wrap.querySelector(":scope > .copy-btn")) return;
        const pre = wrap.tagName === "PRE" ? wrap : wrap.querySelector("pre");
        if (!pre) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "copy-btn bg-card hover:bg-accent absolute top-2 right-2 rounded-md border px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100 focus:opacity-100";
        btn.textContent = "복사";
        btn.setAttribute("aria-label", "코드 복사");
        const onClick = async () => {
          try {
            await navigator.clipboard.writeText(pre.innerText);
            btn.textContent = "복사됨";
          } catch {
            btn.textContent = "실패";
          }
          setTimeout(() => (btn.textContent = "복사"), 1500);
        };
        btn.addEventListener("click", onClick);
        wrap.classList.add("group", "relative");
        wrap.appendChild(btn);
        cleanups.push(() => {
          btn.removeEventListener("click", onClick);
          btn.remove();
        });
      });

    root.querySelectorAll<HTMLElement>("div.youtube[data-youtube-id]").forEach((box) => {
      const id = box.dataset.youtubeId;
      if (!id || box.dataset.enhanced) return;
      box.dataset.enhanced = "1";
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "absolute inset-0 flex items-center justify-center bg-cover bg-center";
      thumb.style.backgroundImage = `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`;
      thumb.setAttribute("aria-label", "YouTube 영상 재생");
      thumb.innerHTML =
        '<span class="bg-background/90 text-foreground rounded-full px-4 py-2 text-sm font-medium">▶ 재생</span>';
      const onClick = () => {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
        iframe.title = "YouTube 영상";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.className = "absolute inset-0 h-full w-full";
        thumb.replaceWith(iframe);
      };
      thumb.addEventListener("click", onClick);
      box.appendChild(thumb);
      cleanups.push(() => thumb.removeEventListener("click", onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [rootId]);

  return null;
}
