-- 0004_cron_log.sql — 크론 결과 기록 RPC(백업 등 DB 밖 작업용) + 대시보드에 마지막 백업 노출
-- private.cron_runs는 PostgREST에 노출되지 않으므로 secret key 호출도 RPC를 거친다.

create or replace function public.record_cron_run(p_job text, p_ok boolean, p_details jsonb default '{}'::jsonb)
returns void
language sql security definer set search_path = ''
as $$
  insert into private.cron_runs (job, ok, details) values (p_job, p_ok, coalesce(p_details, '{}'::jsonb));
$$;
revoke execute on function public.record_cron_run(text, boolean, jsonb) from public, anon, authenticated;
grant  execute on function public.record_cron_run(text, boolean, jsonb) to service_role;

create or replace function public.admin_status()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'posts_published', (select count(*) from public.posts p where p.status = 'published' and p.deleted_at is null),
    'posts_draft',     (select count(*) from public.posts p where p.status = 'draft' and p.deleted_at is null),
    'posts_trashed',   (select count(*) from public.posts p where p.deleted_at is not null),
    'projects_published', (select count(*) from public.projects p where p.status = 'published' and p.deleted_at is null),
    'projects_draft',  (select count(*) from public.projects p where p.status = 'draft' and p.deleted_at is null),
    'views_total',     (select coalesce(sum(pv.count), 0) from public.post_views pv),
    'guestbook_public', (select count(*) from public.guestbook g where g.is_hidden = false),
    'guestbook_hidden', (select count(*) from public.guestbook g where g.is_hidden = true),
    'blocked_users',   (select count(*) from private.blocked_users),
    'last_cron',       (select to_jsonb(c) from (select job, ok, ran_at, details from private.cron_runs where job = 'daily' order by ran_at desc limit 1) c),
    'last_backup',     (select to_jsonb(c) from (select job, ok, ran_at, details from private.cron_runs where job = 'backup' order by ran_at desc limit 1) c)
  ) into v;
  return v;
end $$;
