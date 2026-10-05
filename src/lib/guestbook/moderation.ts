/**
 * 방명록 입력 규칙. 최종 강제는 DB(guestbook_create RPC)가 하고, 여기서는 같은 규칙을 먼저 적용해
 * 빠른 안내를 준다. 욕설 필터는 서버 액션에서만 적용되는 1차 방어선이다(우회 시 관리자 숨김·차단으로 대응).
 */
export const GUESTBOOK_COLORS = ["brand", "coral", "amber", "mint", "sky", "violet"] as const;
export type GuestbookColor = (typeof GUESTBOOK_COLORS)[number];

export const COLOR_LABELS: Record<GuestbookColor, string> = {
  brand: "인디고",
  coral: "코랄",
  amber: "앰버",
  mint: "민트",
  sky: "스카이",
  violet: "바이올렛",
};

export const MESSAGE_MAX = 280;
export const PAGE_SIZE = 12;
export const ADMIN_PAGE_SIZE = 20;

export function isGuestbookColor(v: unknown): v is GuestbookColor {
  return typeof v === "string" && (GUESTBOOK_COLORS as readonly string[]).includes(v);
}

/** 줄바꿈 통일 + 앞뒤 공백 제거 + 3줄 이상 빈 줄 축소 */
export function normalizeMessage(input: string) {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** DB의 char_length와 맞추기 위해 코드 포인트 단위로 센다 (이모지 1자) */
export function messageLength(message: string) {
  return [...message].length;
}

// DB 정규식과 동일 (0001_init.sql guestbook_create)
const LINK_RE = /(https?:\/\/|www\.)/i;
const DOMAIN_RE = /\b[a-z0-9-]+\.(com|net|org|io|kr|co|me|dev|xyz|app|ly)\b/i;

export function containsLink(message: string) {
  return LINK_RE.test(message) || DOMAIN_RE.test(message);
}

const BAD_WORDS = [
  "씨발",
  "시발",
  "씨바",
  "ㅅㅂ",
  "ㅆㅂ",
  "병신",
  "ㅂㅅ",
  "지랄",
  "ㅈㄹ",
  "좆",
  "개새끼",
  "미친놈",
  "미친년",
  "꺼져",
  "닥쳐",
  "fuck",
  "shit",
  "bitch",
  "asshole",
];
// 정상 단어 예외 (포함되면 해당 부분을 먼저 지우고 검사)
const ALLOWED = ["시발점", "시발역"];

export function containsBadWord(message: string) {
  let s = message.toLowerCase();
  for (const a of ALLOWED) s = s.split(a).join(" ");
  // 글자 사이에 끼운 공백·기호·숫자를 제거해 단순 우회를 막는다
  s = s.replace(/[\s\d.,!?~*_\-^@#$%&+=|/\\'"`()[\]{}<>:;]/g, "");
  return BAD_WORDS.some((w) => s.includes(w));
}

export type MessageIssue = "INVALID_LENGTH" | "LINK_NOT_ALLOWED" | "INVALID_COLOR" | "BAD_WORD";

/** 정규화된 메시지와 색상을 검사한다. 문제 없으면 null */
export function checkMessage(message: string, color: unknown): MessageIssue | null {
  const len = messageLength(message);
  if (len < 1 || len > MESSAGE_MAX) return "INVALID_LENGTH";
  if (!isGuestbookColor(color)) return "INVALID_COLOR";
  if (containsLink(message)) return "LINK_NOT_ALLOWED";
  if (containsBadWord(message)) return "BAD_WORD";
  return null;
}
