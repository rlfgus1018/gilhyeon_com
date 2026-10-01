/** 적용된 스키마의 권한 경계를 점검한다. node --env-file=.env.local scripts/db-verify.mjs */
import postgres from "postgres";
const sql = postgres(process.env.SUPABASE_DB_URL, { max: 1, prepare: false, onnotice: () => {} });
try {
  const fns = await sql`
    select p.proname as fn,
           has_function_privilege('anon', p.oid, 'execute') as anon,
           has_function_privilege('authenticated', p.oid, 'execute') as authenticated,
           has_function_privilege('service_role', p.oid, 'execute') as service_role,
           p.prosecdef as secdef,
           coalesce(array_to_string(p.proconfig, ','), '') as config
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' order by 1`;
  console.table(fns);

  const pol = await sql`select schemaname||'.'||tablename as tbl, count(*)::int as policies
    from pg_policies group by 1 order by 1`;
  console.table(pol);

  const grants =
    await sql`select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) as privs
    from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon','authenticated')
    group by 1,2 order by 1,2`;
  console.table(grants);

  const priv =
    await sql`select has_schema_privilege('anon','private','usage') as anon_private_usage,
    has_schema_privilege('authenticated','private','usage') as auth_private_usage`;
  console.table(priv);

  const buckets =
    await sql`select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id`;
  console.table(buckets);

  const seed = await sql`select key, updated_at from public.site_content order by key`;
  console.log("site_content rows:", seed.length);
  const mig = await sql`select name, applied_at from private.schema_migrations order by name`;
  console.table(mig);
} finally {
  await sql.end();
}
