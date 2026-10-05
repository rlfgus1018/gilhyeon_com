/**
 * e2e가 중간에 끊겨 남긴 흔적을 지운다: e2e-admin-*@example.com 임시 관리자, slug가 e2e-로 시작하는 글·프로젝트, e2e- 미디어.
 *   node --env-file=.env.local scripts/db-e2e-cleanup.mjs
 */
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false, onnotice: () => {} });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
try {
  const posts = await sql`delete from public.posts where slug like 'e2e-%' returning slug`;
  const projects = await sql`delete from public.projects where slug like 'e2e-%' returning slug`;
  const media = await sql`delete from public.media where alt_default like 'e2e-%' returning id`;
  console.log(`posts=${posts.length} projects=${projects.length} media=${media.length}`);

  const users = await sql`
    select id, email from auth.users
    where email like 'e2e-admin-%@example.com'
      and not exists (select 1 from auth.identities i where i.user_id = auth.users.id and i.provider <> 'email')`;
  for (const u of users) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    console.log(`${error ? "FAIL" : "deleted"}  ${u.email}${error ? `  ${error.message}` : ""}`);
  }
  const left = await sql`select count(*)::int as n from private.admins a
    where not exists (select 1 from auth.users u where u.id = a.user_id)`;
  console.log(`users=${users.length} orphan_admin_rows=${left[0].n}`);
} finally {
  await sql.end();
}
