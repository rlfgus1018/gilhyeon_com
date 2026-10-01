export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 영문·숫자만 slug로 변환. 한글 제목은 빈 문자열이 되므로 호출자가 기본값을 제안한다. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function suggestSlug(title: string, prefix = "post") {
  const s = slugify(title);
  if (s.length >= 3) return s;
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${prefix}-${ymd}-${Math.random().toString(36).slice(2, 6)}`;
}

export function isValidSlug(s: string) {
  return SLUG_RE.test(s) && s.length <= 80;
}
