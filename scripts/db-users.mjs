/** 가입한 사용자와 관리자 여부를 나열한다. node --env-file=.env.local scripts/db-users.mjs */
import postgres from "postgres";
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false, onnotice: () => {} });
try {
  const users = await sql`
    select u.id, u.email, u.created_at, u.last_sign_in_at,
           (select string_agg(i.provider, ',') from auth.identities i where i.user_id = u.id) as providers,
           exists(select 1 from private.admins a where a.user_id = u.id) as is_admin
    from auth.users u order by u.created_at`;
  console.log("users:", users.length);
  for (const u of users) {
    console.log(
      `${u.id}  ${u.email}  providers=${u.providers}  admin=${u.is_admin}  last_sign_in=${u.last_sign_in_at?.toISOString?.() ?? u.last_sign_in_at}`,
    );
  }
} finally {
  await sql.end();
}
