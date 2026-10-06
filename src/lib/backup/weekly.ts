/**
 * 주간 콘텐츠 백업 규칙 (plan.md §11.4). 순수 함수만 — 크론 라우트와 단위 테스트가 함께 쓴다.
 * - 파일명은 ISO 주 단위(`content-2026-W41.json`)라 같은 주에는 덮어써서 멱등.
 * - 매일 돌아도 한 주에 파일 하나, 최근 KEEP_WEEKS개만 남긴다.
 */
export const BACKUP_BUCKET = "backups";
export const BACKUP_PREFIX = "content-";
export const KEEP_WEEKS = 8;
export const BACKUP_TABLES = ["posts", "projects", "site_content", "media"] as const;
export type BackupTable = (typeof BACKUP_TABLES)[number];

/** ISO 8601 주 번호 (월요일 시작). Asia/Seoul 기준 날짜로 계산한다. */
export function isoWeekLabel(date = new Date()) {
  const seoul = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const d = new Date(Date.UTC(seoul.getFullYear(), seoul.getMonth(), seoul.getDate()));
  const day = d.getUTCDay() || 7; // 일요일=7
  d.setUTCDate(d.getUTCDate() + 4 - day); // 그 주의 목요일
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function backupFileName(date = new Date()) {
  return `${BACKUP_PREFIX}${isoWeekLabel(date)}.json`;
}

/** 보관 개수를 넘는 오래된 백업 파일 이름 (이름 내림차순 = 최신 우선). 규칙에 안 맞는 파일은 건드리지 않는다. */
export function expiredBackupNames(names: string[], keep = KEEP_WEEKS) {
  // BACKUP_PREFIX + ISO 주 + .json
  const pattern = /^content-\d{4}-W\d{2}\.json$/;
  return names
    .filter((n) => pattern.test(n))
    .sort((a, b) => b.localeCompare(a))
    .slice(keep);
}

export type BackupPayload = {
  version: 1;
  created_at: string;
  week: string;
  tables: Record<BackupTable, unknown[]>;
};

export function buildBackupPayload(
  tables: Record<BackupTable, unknown[]>,
  date = new Date(),
): BackupPayload {
  return { version: 1, created_at: date.toISOString(), week: isoWeekLabel(date), tables };
}
