/**
 * 키셋 페이지네이션 커서: (created_at desc, id desc). created_at은 DB가 준 문자열을 그대로 보존해
 * 마이크로초 정밀도를 잃지 않는다. 커서는 클라이언트를 거치므로 디코드 시 형식을 엄격히 검증한다.
 */
export type GuestbookCursor = { created_at: string; id: string };

const TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function encodeCursor(c: GuestbookCursor) {
  return Buffer.from(JSON.stringify([c.created_at, c.id]), "utf8").toString("base64url");
}

export function decodeCursor(input: string | null | undefined): GuestbookCursor | null {
  if (!input || input.length > 200) return null;
  try {
    const v: unknown = JSON.parse(Buffer.from(input, "base64url").toString("utf8"));
    if (!Array.isArray(v) || v.length !== 2) return null;
    const [created_at, id] = v;
    if (typeof created_at !== "string" || !TS_RE.test(created_at) || !isUuid(id)) return null;
    return { created_at, id };
  } catch {
    return null;
  }
}

/** PostgREST or() 필터: 커서보다 뒤(더 오래된) 행. 값은 위 정규식으로 검증된 것만 들어온다. */
export function cursorFilter(c: GuestbookCursor) {
  return `created_at.lt."${c.created_at}",and(created_at.eq."${c.created_at}",id.lt.${c.id})`;
}
