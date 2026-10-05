/** 방명록 오류 코드 → 사용자 안내 문구. DB RPC가 raise 하는 코드와 서버 액션 자체 코드를 함께 다룬다. */
export const GUESTBOOK_MESSAGES = {
  AUTH_REQUIRED: "로그인이 필요해요.",
  SESSION_EXPIRED: "세션이 만료됐어요. 다시 로그인해 주세요.",
  USER_BLOCKED: "이 계정은 방명록을 이용할 수 없어요.",
  INVALID_LENGTH: "메시지는 1자 이상 280자 이하로 적어 주세요.",
  LINK_NOT_ALLOWED: "링크나 주소는 넣을 수 없어요.",
  INVALID_COLOR: "카드 색상을 다시 골라 주세요.",
  BAD_WORD: "부적절한 표현이 포함돼 있어요. 조금만 다듬어 주세요.",
  RATE_LIMIT_MINUTE: "방금 남기셨어요. 1분 뒤에 다시 시도해 주세요.",
  RATE_LIMIT_DAY: "하루에 5개까지 남길 수 있어요. 내일 다시 찾아와 주세요.",
  FORBIDDEN: "권한이 없어요.",
  NOT_FOUND: "이미 삭제됐거나 권한이 없는 글이에요.",
  CANNOT_BLOCK_SELF: "자기 자신은 차단할 수 없어요.",
  INVALID_INPUT: "요청 형식이 올바르지 않아요.",
  UNAVAILABLE: "방명록을 잠시 사용할 수 없어요. 잠시 후 다시 시도해 주세요.",
  UNKNOWN: "문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
} as const;

export type GuestbookErrorCode = keyof typeof GUESTBOOK_MESSAGES;

const DB_CODES: GuestbookErrorCode[] = [
  "AUTH_REQUIRED",
  "USER_BLOCKED",
  "INVALID_LENGTH",
  "LINK_NOT_ALLOWED",
  "INVALID_COLOR",
  "RATE_LIMIT_MINUTE",
  "RATE_LIMIT_DAY",
  "CANNOT_BLOCK_SELF",
  "FORBIDDEN",
  "NOT_FOUND",
];

/** PostgREST 오류(message에 raise 문자열이 담김)를 코드로 바꾼다 */
export function toGuestbookErrorCode(
  error: { message?: string; code?: string } | null | undefined,
): GuestbookErrorCode {
  const msg = error?.message ?? "";
  const hit = DB_CODES.find((c) => msg.includes(c));
  if (hit) return hit;
  if (error?.code === "42501" || /permission denied|row-level security/i.test(msg))
    return "FORBIDDEN";
  return "UNKNOWN";
}

export type GuestbookFailure = { ok: false; error: GuestbookErrorCode; message: string };

export function fail(error: GuestbookErrorCode): GuestbookFailure {
  return { ok: false, error, message: GUESTBOOK_MESSAGES[error] };
}
