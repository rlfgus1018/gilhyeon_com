/** 한글 500자/분 + 그 외 단어 200개/분 가정. 코드 블록은 제외한다. */
export function estimateReadingMinutes(markdown: string) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/[#>*_`~\-[\]()!|]/g, " ");
  const hangul = (text.match(/[ㄱ-힝]/g) ?? []).length;
  const words = text
    .replace(/[ㄱ-힝]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(hangul / 500 + words / 200));
}

/** 본문에서 이미지 URL을 뽑는다 (media 테이블 크기 조회용). */
export function extractImageUrls(markdown: string) {
  const urls = new Set<string>();
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)/g)) {
    urls.add(m[1].replace(/^<|>$/g, ""));
  }
  return [...urls];
}
