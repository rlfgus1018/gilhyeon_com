/** 사용자를 관리자로 등록한다. node --env-file=.env.local scripts/db-grant-admin.mjs <user-uuid> [메모] */
import postgres from "postgres";
const [id, note = "관리자"] = process.argv.slice(2);
if (!/^[0-9a-f-]{36}$/i.test(id ?? "")) {
  console.error("usage: db-grant-admin.mjs <user-uuid> [note]");
  process.exit(1);
}
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false, onnotice: () => {} });
try {
  const [u] = await sql`select id, email from auth.users where id = ${id}`;
  if (!u) {
    console.error("no such user");
    process.exit(1);
  }
  await sql`insert into private.admins (user_id, note) values (${id}, ${note}) on conflict (user_id) do update set note = excluded.note`;
  console.log(`admin granted: ${u.email} (${u.id})`);
} finally {
  await sql.end();
}
