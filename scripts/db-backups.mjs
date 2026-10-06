/**
 * backups 버킷의 주간 콘텐츠 백업 목록과 최신 파일 요약을 보여준다.
 *   node --env-file=.env.local scripts/db-backups.mjs
 * 필요 env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY (비공개 버킷이라 secret key 필요)
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY 가 필요합니다.");
  process.exit(1);
}
const sb = createClient(url, secret, { auth: { persistSession: false } });

const { data, error } = await sb.storage.from("backups").list("", { limit: 100 });
if (error) {
  console.error("목록 실패:", error.message);
  process.exit(1);
}
const files = data
  .filter((o) => o.name.endsWith(".json"))
  .sort((a, b) => b.name.localeCompare(a.name));
console.log(`backups/ 파일 ${files.length}개`);
for (const o of files)
  console.log(`  ${o.name}  ${o.metadata?.size ?? "?"}B  ${o.updated_at ?? ""}`);

if (files[0]) {
  const dl = await sb.storage.from("backups").download(files[0].name);
  if (dl.error) {
    console.error("다운로드 실패:", dl.error.message);
    process.exit(1);
  }
  const j = JSON.parse(await dl.data.text());
  const counts = Object.fromEntries(Object.entries(j.tables).map(([k, v]) => [k, v.length]));
  console.log(
    `최신 ${files[0].name}: version ${j.version}, week ${j.week}, created ${j.created_at}`,
  );
  console.log("  rows:", JSON.stringify(counts));
}
