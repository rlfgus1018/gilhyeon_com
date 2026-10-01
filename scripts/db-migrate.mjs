/**
 * Supabase Postgres에 supabase/migrations/*.sql 을 순서대로 적용한다.
 *   node --env-file=.env.local scripts/db-migrate.mjs            # 미적용 마이그레이션 + seed
 *   node --env-file=.env.local scripts/db-migrate.mjs --dry-run  # 적용 대상만 출력
 * 필요 env: SUPABASE_DB_URL (Dashboard → Connect → Session pooler URI, 비밀번호 포함)
 * 각 파일은 하나의 트랜잭션으로 실행되며 private.schema_migrations 에 기록된다.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) {
  console.error(
    "SUPABASE_DB_URL 이 없습니다. .env.local 에 Session pooler 연결 문자열을 넣어 주세요.",
  );
  process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");
const root = path.resolve(import.meta.dirname, "..", "supabase");

const sql = postgres(DB_URL, { max: 1, prepare: false, onnotice: () => {} });

try {
  await sql.unsafe(`create schema if not exists private;
    revoke all on schema private from public, anon, authenticated;
    create table if not exists private.schema_migrations (
      name text primary key, applied_at timestamptz not null default now()
    );`);

  const applied = new Set(
    (await sql`select name from private.schema_migrations`).map((r) => r.name),
  );
  const files = (await readdir(path.join(root, "migrations")))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const pending = files.filter((f) => !applied.has(f));

  console.log(`applied: ${applied.size}, pending: ${pending.length}${dryRun ? " (dry-run)" : ""}`);
  for (const f of pending) console.log(`  - ${f}`);
  if (dryRun) process.exit(0);

  for (const f of pending) {
    const body = await readFile(path.join(root, "migrations", f), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into private.schema_migrations (name) values (${f})`;
    });
    console.log(`✓ ${f}`);
  }

  // seed는 멱등(on conflict do nothing)이라 매번 실행
  const seedDir = path.join(root, "seed");
  for (const f of (await readdir(seedDir)).filter((f) => f.endsWith(".sql")).sort()) {
    await sql.unsafe(await readFile(path.join(seedDir, f), "utf8"));
    console.log(`✓ seed ${f}`);
  }
  console.log("done");
} finally {
  await sql.end();
}
