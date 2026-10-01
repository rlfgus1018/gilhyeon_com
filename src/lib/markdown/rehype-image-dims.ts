import type { Root } from "hast";
import { visit } from "unist-util-visit";

export type ImageDims = { width: number; height: number };

/**
 * <img>에 저장된 크기를 넣어 CLS를 막는다. 크기를 모르는(외부) 이미지는 경고만 남긴다.
 * lookup은 호출자가 media 테이블에서 미리 만든 Map이다.
 */
export function rehypeImageDims(options: { lookup: Map<string, ImageDims>; warnings?: string[] }) {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;
      const src = typeof node.properties.src === "string" ? node.properties.src : "";
      const dims = options.lookup.get(src);
      if (dims) {
        node.properties.width = dims.width;
        node.properties.height = dims.height;
      } else if (src) {
        options.warnings?.push(
          `이미지 크기를 알 수 없어요(외부 이미지이거나 미디어에 없음): ${src}`,
        );
      }
      node.properties.loading = "lazy";
      node.properties.decoding = "async";
    });
  };
}
