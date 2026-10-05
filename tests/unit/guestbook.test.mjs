import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkMessage,
  containsBadWord,
  containsLink,
  messageLength,
  normalizeMessage,
} from "../../src/lib/guestbook/moderation.ts";
import {
  cursorFilter,
  decodeCursor,
  encodeCursor,
  isUuid,
} from "../../src/lib/guestbook/cursor.ts";
import { GUESTBOOK_MESSAGES, toGuestbookErrorCode } from "../../src/lib/guestbook/errors.ts";

const ID = "3f2b8c1e-5a44-4c0e-9b1d-0a1b2c3d4e5f";

test("메시지 정규화: 줄바꿈 통일·앞뒤 공백·빈 줄 축소", () => {
  assert.equal(normalizeMessage("  안녕\r\n\r\n\r\n\r\n하세요  "), "안녕\n\n하세요");
});

test("길이는 코드 포인트 기준 (이모지 1자) — DB char_length와 일치", () => {
  assert.equal(messageLength("👋안녕"), 3);
  assert.equal(checkMessage("가".repeat(280), "brand"), null);
  assert.equal(checkMessage("가".repeat(281), "brand"), "INVALID_LENGTH");
  assert.equal(checkMessage("", "brand"), "INVALID_LENGTH");
});

test("링크·도메인 거부, 일반 문장의 마침표는 허용", () => {
  for (const s of ["http://a.b", "HTTPS://x", "www.naver", "놀러와 example.com", "my-site.kr 구경"])
    assert.equal(containsLink(s), true, s);
  for (const s of ["잘 봤어요. 감사합니다.", "v1.2 업데이트 축하", "3.14는 원주율"])
    assert.equal(containsLink(s), false, s);
  assert.equal(checkMessage("놀러와 example.com", "mint"), "LINK_NOT_ALLOWED");
});

test("색상은 허용 목록만", () => {
  assert.equal(checkMessage("안녕", "violet"), null);
  assert.equal(checkMessage("안녕", "red"), "INVALID_COLOR");
  assert.equal(checkMessage("안녕", undefined), "INVALID_COLOR");
});

test("욕설 필터: 끼워 넣은 공백·기호 우회 차단, 정상 단어 예외", () => {
  assert.equal(containsBadWord("시 발"), true);
  assert.equal(containsBadWord("F.u.c.k"), true);
  assert.equal(containsBadWord("이 글이 제 공부의 시발점이 됐어요"), false);
  assert.equal(containsBadWord("좋은 글 감사합니다"), false);
  assert.equal(checkMessage("병1신", "brand"), "BAD_WORD");
});

test("커서: 왕복·마이크로초 보존·변조 거부", () => {
  const c = { created_at: "2026-10-05T12:39:05.427123+00:00", id: ID };
  assert.deepEqual(decodeCursor(encodeCursor(c)), c);
  assert.equal(
    cursorFilter(c),
    `created_at.lt."${c.created_at}",and(created_at.eq."${c.created_at}",id.lt.${ID})`,
  );
  const forge = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  for (const bad of [
    null,
    "",
    "!!!",
    forge(["2026-10-05", ID]),
    forge(['2026-10-05T12:39:05Z",id.gt.0', ID]),
    forge(["2026-10-05T12:39:05Z", "not-a-uuid"]),
    forge(["2026-10-05T12:39:05Z", `${ID}),or(id.neq.x`]),
    forge({ created_at: c.created_at, id: ID }),
    "x".repeat(300),
  ])
    assert.equal(decodeCursor(bad), null, String(bad));
  assert.equal(isUuid(ID), true);
  assert.equal(isUuid("1"), false);
});

test("오류 코드 변환: DB raise 문자열·권한 오류·알 수 없는 오류", () => {
  assert.equal(toGuestbookErrorCode({ message: "RATE_LIMIT_MINUTE" }), "RATE_LIMIT_MINUTE");
  assert.equal(toGuestbookErrorCode({ message: "USER_BLOCKED" }), "USER_BLOCKED");
  assert.equal(
    toGuestbookErrorCode({ message: "permission denied for table guestbook", code: "42501" }),
    "FORBIDDEN",
  );
  assert.equal(toGuestbookErrorCode({ message: "connection reset" }), "UNKNOWN");
  assert.equal(toGuestbookErrorCode(null), "UNKNOWN");
  assert.match(GUESTBOOK_MESSAGES.USER_BLOCKED, /이용할 수 없어요/);
});
