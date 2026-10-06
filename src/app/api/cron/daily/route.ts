import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import {
  BACKUP_BUCKET,
  BACKUP_TABLES,
  backupFileName,
  buildBackupPayload,
  expiredBackupNames,
  type BackupTable,
} from "@/lib/backup/weekly";

export const dynamic = "force-dynamic";

type Admin = NonNullable<ReturnType<typeof createAdminSupabase>>;

/**
 * 주간 콘텐츠 백업 (plan.md §11.4). 매일 돌지만 파일명이 ISO 주 단위라 한 주에 하나만 남고(덮어쓰기),
 * 최근 8주만 보관한다. 비공개 버킷 backups/ 에 JSON. 이미지 원본은 Storage 자체가 저장소.
 */
async function runBackup(admin: Admin) {
  const tables = {} as Record<BackupTable, unknown[]>;
  const counts: Record<string, number> = {};
  for (const t of BACKUP_TABLES) {
    const { data, error } = await admin.from(t).select("*");
    if (error) throw new Error(`${t}: ${error.message}`);
    tables[t] = data ?? [];
    counts[t] = tables[t].length;
  }
  const file = backupFileName();
  const body = JSON.stringify(buildBackupPayload(tables));
  const up = await admin.storage
    .from(BACKUP_BUCKET)
    .upload(file, body, { contentType: "application/json", upsert: true });
  if (up.error) throw new Error(`upload: ${up.error.message}`);

  const list = await admin.storage.from(BACKUP_BUCKET).list("", { limit: 100 });
  const expired = list.error ? [] : expiredBackupNames(list.data.map((o) => o.name));
  if (expired.length > 0) {
    const rm = await admin.storage.from(BACKUP_BUCKET).remove(expired);
    if (rm.error) throw new Error(`prune: ${rm.error.message}`);
  }
  return { file, bytes: body.length, counts, pruned: expired };
}

/**
 * Vercel Cron (Hobby: 1일 1회, ±59분, best effort). Authorization: Bearer <CRON_SECRET> 로 검증.
 * 역할: keepalive 읽기 + maintenance_daily()(멱등) + 주간 백업. 결과는 private.cron_runs에 기록.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const admin = createAdminSupabase();
  if (!admin)
    return NextResponse.json({ ok: false, error: "SUPABASE_NOT_CONFIGURED" }, { status: 503 });

  const keepalive = await admin.from("post_views").select("slug").limit(1);
  const maintenance = await admin.rpc("maintenance_daily");

  let backup: Awaited<ReturnType<typeof runBackup>> | null = null;
  let backupError: string | null = null;
  try {
    backup = await runBackup(admin);
  } catch (e) {
    backupError = e instanceof Error ? e.message : String(e);
    console.error("[cron] backup failed:", backupError);
  }
  await admin.rpc("record_cron_run", {
    p_job: "backup",
    p_ok: backupError === null,
    p_details: backup ?? { error: backupError },
  });

  const ok = !keepalive.error && !maintenance.error && backupError === null;
  return NextResponse.json(
    {
      ok,
      keepalive: keepalive.error ? keepalive.error.message : "ok",
      maintenance: maintenance.error ? maintenance.error.message : maintenance.data,
      backup: backupError ?? backup,
      ran_at: new Date().toISOString(),
    },
    { status: ok ? 200 : 500, headers: { "Cache-Control": "no-store" } },
  );
}
