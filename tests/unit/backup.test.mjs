import { test } from "node:test";
import assert from "node:assert/strict";
import {
  backupFileName,
  buildBackupPayload,
  expiredBackupNames,
  isoWeekLabel,
} from "../../src/lib/backup/weekly.ts";

test("ISO 주 라벨: 연말·연초 경계와 서울 시간대", () => {
  assert.equal(isoWeekLabel(new Date("2026-10-06T00:00:00+09:00")), "2026-W41");
  // 2026-01-01(목)은 2026-W01, 2024-12-30(월)은 2025-W01
  assert.equal(isoWeekLabel(new Date("2026-01-01T12:00:00+09:00")), "2026-W01");
  assert.equal(isoWeekLabel(new Date("2024-12-30T12:00:00+09:00")), "2025-W01");
  // UTC 일요일 23시 = 서울 월요일 08시 → 다음 주
  assert.equal(isoWeekLabel(new Date("2026-10-04T23:00:00Z")), "2026-W41");
  assert.equal(isoWeekLabel(new Date("2026-10-04T10:00:00Z")), "2026-W40");
  assert.equal(backupFileName(new Date("2026-10-06T00:00:00+09:00")), "content-2026-W41.json");
});

test("보관 8개 초과분만 삭제 대상, 규칙 밖 파일은 제외", () => {
  const names = Array.from(
    { length: 11 },
    (_, i) => `content-2026-W${String(30 + i).padStart(2, "0")}.json`,
  );
  const expired = expiredBackupNames([
    ...names,
    "guestbook-2026-10.csv",
    ".emptyFolderPlaceholder",
  ]);
  assert.deepEqual(expired, [
    "content-2026-W32.json",
    "content-2026-W31.json",
    "content-2026-W30.json",
  ]);
  assert.deepEqual(expiredBackupNames(names.slice(0, 8)), []);
});

test("페이로드 형식", () => {
  const p = buildBackupPayload(
    { posts: [{ id: 1 }], projects: [], site_content: [], media: [] },
    new Date("2026-10-06T00:00:00+09:00"),
  );
  assert.equal(p.version, 1);
  assert.equal(p.week, "2026-W41");
  assert.equal(p.tables.posts.length, 1);
});
