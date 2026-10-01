import type { Root, Paragraph, PhrasingContent } from "mdast";
import type { ContainerDirective, LeafDirective, TextDirective } from "mdast-util-directive";
import { visit } from "unist-util-visit";

type Directive = ContainerDirective | LeafDirective | TextDirective;
const CALLOUT_TYPES = new Set(["info", "warn", "tip"]);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

function paragraph(children: PhrasingContent[], hName?: string): Paragraph {
  const p: Paragraph = { type: "paragraph", children };
  if (hName) p.data = { hName };
  return p;
}

/**
 * 지원 디렉티브 (plan.md §8A.2)
 *   :::callout{type="info" title="참고"} … :::   → <aside class="callout" data-type data-title>
 *   ::youtube{id="..."}                           → <div class="youtube" data-youtube-id>(링크 폴백)
 *   :::figure{caption="..."} ![..](..) :::       → <figure class="figure">…<figcaption>
 * 알 수 없는 디렉티브는 일반 div로 떨어지고 sanitize가 속성을 제거한다.
 */
export function remarkDirectiveHandlers() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }
      const d = node as Directive;
      const attrs = d.attributes ?? {};
      d.data ??= {};

      if (d.type === "containerDirective" && d.name === "callout") {
        const type = CALLOUT_TYPES.has(attrs.type ?? "") ? attrs.type : "info";
        d.data.hName = "aside";
        d.data.hProperties = {
          className: ["callout"],
          dataType: type,
          dataTitle: attrs.title ?? undefined,
        };
        return;
      }

      if (d.type === "leafDirective" && d.name === "youtube") {
        const id = attrs.id ?? "";
        if (!YOUTUBE_ID.test(id)) {
          d.data.hName = "p";
          d.children = [{ type: "text", value: "(잘못된 YouTube 영상 ID)" }];
          return;
        }
        const label = d.children.length
          ? d.children
          : [{ type: "text", value: "YouTube 영상 보기" } as const];
        d.data.hName = "div";
        d.data.hProperties = { className: ["youtube"], dataYoutubeId: id };
        d.children = [
          paragraph([
            {
              type: "link",
              url: `https://www.youtube.com/watch?v=${id}`,
              children: label as PhrasingContent[],
            },
          ]),
        ] as unknown as typeof d.children;
        return;
      }

      if (d.type === "containerDirective" && d.name === "figure") {
        d.data.hName = "figure";
        d.data.hProperties = { className: ["figure"] };
        if (attrs.caption) {
          d.children.push(paragraph([{ type: "text", value: attrs.caption }], "figcaption"));
        }
        return;
      }

      // 알 수 없는 디렉티브: 텍스트 디렉티브는 그대로(span), 블록은 div
      d.data.hName = d.type === "textDirective" ? "span" : "div";
    });
  };
}
