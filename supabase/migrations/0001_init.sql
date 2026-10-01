-- 0001_init.sql — gilhyeon.com 초기 스키마 (plan.md §7)
-- 실행: npm run db:migrate (scripts/db-migrate.mjs가 파일 단위 트랜잭션으로 적용)
-- 원칙: public만 API 노출, 내부 데이터는 private 스키마. 함수 기본 EXECUTE 제거 후 필요한 역할에만 부여.

-- 0. 스키마·기본 권한 ---------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

-- 1. 관리자 (로그인 후 확정된 UUID 기반, 단일 기준) -----------------------------
create table if not exists private.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- 2. 콘텐츠: media / posts / projects / site_content ----------------------------
create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,
  url         text not null,
  width       int,
  height      int,
  bytes       int,
  mime        text,
  alt_default text,
  created_at  timestamptz not null default now()
);

create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique
                  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title           text not null check (char_length(title) between 1 and 120),
  description     text not null default '' check (char_length(description) <= 200),
  content_md      text not null default '',
  content_html    text not null default '',
  toc             jsonb not null default '[]'::jsonb,
  reading_minutes int  not null default 1,
  tags            text[] not null default '{}' check (cardinality(tags) <= 5),
  lang            text not null default 'ko' check (lang in ('ko','en')),
  featured        boolean not null default false,
  status          text not null default 'draft' check (status in ('draft','published')),
  published_at    timestamptz,
  cover_media_id  uuid references public.media(id) on delete set null,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists posts_public on public.posts (published_at desc)
  where status = 'published' and deleted_at is null;
create index if not exists posts_tags on public.posts using gin (tags);
drop trigger if exists posts_updated on public.posts;
create trigger posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique
                     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title              text not null check (char_length(title) between 1 and 120),
  summary            text not null default '' check (char_length(summary) <= 200),
  content_md         text not null default '',
  content_html       text not null default '',
  toc                jsonb not null default '[]'::jsonb,
  type               text not null default 'ai' check (type in ('ai','web','other')),
  tech               text[] not null default '{}',
  links              jsonb not null default '{}'::jsonb,
  thumbnail_media_id uuid references public.media(id) on delete set null,
  featured           boolean not null default false,
  work_status        text not null default 'done' check (work_status in ('done','wip','archived')),
  status             text not null default 'draft' check (status in ('draft','published')),
  sort_date          date not null default current_date,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
drop trigger if exists projects_updated on public.projects;
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table if not exists public.site_content (
  key        text primary key
             check (key in ('hero','intro','timeline','interests','now','stack','photos')),
  data       jsonb not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists site_content_updated on public.site_content;
create trigger site_content_updated before update on public.site_content
  for each row execute function public.set_updated_at();

-- 콘텐츠 권한: 읽기는 공개(정책으로 제한), 쓰기는 관리자만
alter table public.media        enable row level security;
alter table public.posts        enable row level security;
alter table public.projects     enable row level security;
alter table public.site_content enable row level security;

revoke all on table public.media, public.posts, public.projects, public.site_content
  from public, anon, authenticated;
grant select on table public.media, public.posts, public.projects, public.site_content
  to anon, authenticated;
grant insert, update, delete on table public.posts, public.projects, public.media to authenticated;
grant insert, update on table public.site_content to authenticated;

-- 읽기 정책 (anon은 is_admin 실행 권한이 없으므로 역할별로 분리)
drop policy if exists posts_read_anon on public.posts;
create policy posts_read_anon on public.posts for select to anon
  using (status = 'published' and deleted_at is null and published_at <= now());
drop policy if exists posts_read_auth on public.posts;
create policy posts_read_auth on public.posts for select to authenticated
  using ((status = 'published' and deleted_at is null and published_at <= now()) or public.is_admin());

drop policy if exists projects_read_anon on public.projects;
create policy projects_read_anon on public.projects for select to anon
  using (status = 'published' and deleted_at is null);
drop policy if exists projects_read_auth on public.projects;
create policy projects_read_auth on public.projects for select to authenticated
  using ((status = 'published' and deleted_at is null) or public.is_admin());

drop policy if exists site_read on public.site_content;
create policy site_read on public.site_content for select to anon, authenticated using (true);
drop policy if exists media_read on public.media;
create policy media_read on public.media for select to anon, authenticated using (true);

-- 쓰기 정책 (관리자만)
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated with check (public.is_admin());
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts for delete to authenticated using (public.is_admin());

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert to authenticated with check (public.is_admin());
drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete to authenticated using (public.is_admin());

drop policy if exists media_insert on public.media;
create policy media_insert on public.media for insert to authenticated with check (public.is_admin());
drop policy if exists media_update on public.media;
create policy media_update on public.media for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists media_delete on public.media;
create policy media_delete on public.media for delete to authenticated using (public.is_admin());

drop policy if exists site_insert on public.site_content;
create policy site_insert on public.site_content for insert to authenticated with check (public.is_admin());
drop policy if exists site_update on public.site_content;
create policy site_update on public.site_content for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 3. 방명록 ---------------------------------------------------------------------
create table if not exists public.guestbook (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  avatar_url  text,
  message     text not null check (char_length(message) between 1 and 280),
  color       text not null check (color in ('brand','coral','amber','mint','sky','violet')),
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists guestbook_public_order on public.guestbook (created_at desc, id desc)
  where is_hidden = false;
create index if not exists guestbook_user on public.guestbook (user_id, created_at desc);

alter table public.guestbook enable row level security;
revoke all on table public.guestbook from public, anon, authenticated;
grant select, delete on table public.guestbook to authenticated;   -- INSERT/UPDATE 권한 없음

-- 익명 공개 응답: 표시 컬럼만, 숨김 제외 (뷰 정의에 고정 필터, 소유자 postgres로 실행)
create or replace view public.guestbook_public with (security_barrier = true) as
  select id, author_name, avatar_url, message, color, created_at
  from public.guestbook
  where is_hidden = false;
grant select on public.guestbook_public to anon, authenticated;

drop policy if exists guestbook_select on public.guestbook;
create policy guestbook_select on public.guestbook for select to authenticated
  using (is_hidden = false or public.is_admin());
drop policy if exists guestbook_delete_owner_or_admin on public.guestbook;
create policy guestbook_delete_owner_or_admin on public.guestbook for delete to authenticated
  using ((select auth.uid()) = user_id or public.is_admin());

-- 작성 이력(공개 글 삭제와 무관하게 유지, 사용자 접근 불가) / 차단 사용자
create table if not exists private.guestbook_writes (
  id         bigint generated always as identity primary key,
  user_id    uuid not null,
  entry_id   uuid,
  provider   text,
  created_at timestamptz not null default now()
);
create index if not exists guestbook_writes_user on private.guestbook_writes (user_id, created_at desc);

create table if not exists private.blocked_users (
  user_id    uuid primary key,
  reason     text,
  blocked_by uuid,
  created_at timestamptz not null default now()
);

-- 작성 RPC: 규칙을 DB에 강제하므로 클라이언트가 직접 호출해도 동일 제한 (plan.md §7.3)
create or replace function public.guestbook_create(p_message text, p_color text)
returns table (id uuid, author_name text, avatar_url text, message text, color text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := (select auth.uid());
  v_msg      text := btrim(p_message);
  v_ident    jsonb;
  v_provider text;
  v_name     text;
  v_avatar   text;
  v_last     timestamptz;
  v_cnt      int;
  v_id       uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists (select 1 from private.blocked_users b where b.user_id = v_uid) then
    raise exception 'USER_BLOCKED';
  end if;
  if v_msg is null or char_length(v_msg) < 1 or char_length(v_msg) > 280 then
    raise exception 'INVALID_LENGTH';
  end if;
  if v_msg ~* '(https?://|www\.)'
     or v_msg ~* '\m[a-z0-9-]+\.(com|net|org|io|kr|co|me|dev|xyz|app|ly)\M' then
    raise exception 'LINK_NOT_ALLOWED';
  end if;
  if p_color not in ('brand','coral','amber','mint','sky','violet') then
    raise exception 'INVALID_COLOR';
  end if;

  -- 사용자별 직렬화 (잠금 1개, 트랜잭션 종료 시 해제)
  perform pg_advisory_xact_lock(hashtext('guestbook:' || v_uid::text));

  select max(w.created_at) into v_last from private.guestbook_writes w where w.user_id = v_uid;
  if v_last is not null and v_last > now() - interval '60 seconds' then
    raise exception 'RATE_LIMIT_MINUTE';
  end if;
  select count(*) into v_cnt from private.guestbook_writes w
    where w.user_id = v_uid and w.created_at > now() - interval '24 hours';
  if v_cnt >= 5 then raise exception 'RATE_LIMIT_DAY'; end if;

  -- 표시용 스냅샷: 공급자 identity_data 우선, 없으면 fallback
  select i.identity_data, i.provider into v_ident, v_provider
    from auth.identities i where i.user_id = v_uid
    order by i.last_sign_in_at desc nulls last limit 1;
  v_name := left(coalesce(
      nullif(btrim(v_ident->>'full_name'), ''),
      nullif(btrim(v_ident->>'name'), ''),
      nullif(btrim(v_ident->>'user_name'), ''),
      nullif(btrim(v_ident->>'preferred_username'), ''),
      '방문자'), 40);
  v_avatar := coalesce(v_ident->>'avatar_url', v_ident->>'picture');
  if v_avatar is null
     or v_avatar !~ '^https://(avatars\.githubusercontent\.com|lh[0-9]\.googleusercontent\.com)/' then
    v_avatar := null;
  end if;

  insert into public.guestbook (user_id, author_name, avatar_url, message, color)
    values (v_uid, v_name, v_avatar, v_msg, p_color)
    returning public.guestbook.id into v_id;
  insert into private.guestbook_writes (user_id, entry_id, provider)
    values (v_uid, v_id, v_provider);

  return query
    select g.id, g.author_name, g.avatar_url, g.message, g.color, g.created_at
    from public.guestbook g where g.id = v_id;
end $$;
revoke execute on function public.guestbook_create(text, text) from public, anon;
grant  execute on function public.guestbook_create(text, text) to authenticated;

-- 관리자 숨김/복원 (테이블 UPDATE 권한 없이 RPC로만)
create or replace function public.guestbook_set_hidden(p_id uuid, p_hidden boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.guestbook g set is_hidden = p_hidden where g.id = p_id;
  if not found then raise exception 'NOT_FOUND'; end if;
end $$;
revoke execute on function public.guestbook_set_hidden(uuid, boolean) from public, anon;
grant  execute on function public.guestbook_set_hidden(uuid, boolean) to authenticated;

-- 사용자 차단/해제/목록
create or replace function public.admin_block_user(p_user uuid, p_reason text, p_hide_all boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user = (select auth.uid()) then raise exception 'CANNOT_BLOCK_SELF'; end if;
  insert into private.blocked_users (user_id, reason, blocked_by)
    values (p_user, left(p_reason, 200), (select auth.uid()))
    on conflict (user_id) do update set reason = excluded.reason;
  if p_hide_all then
    update public.guestbook g set is_hidden = true where g.user_id = p_user;
  end if;
end $$;

create or replace function public.admin_unblock_user(p_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  delete from private.blocked_users b where b.user_id = p_user;
end $$;

create or replace function public.admin_list_blocked()
returns table (user_id uuid, reason text, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select b.user_id, b.reason, b.created_at from private.blocked_users b where public.is_admin();
$$;

revoke execute on function public.admin_block_user(uuid, text, boolean) from public, anon;
revoke execute on function public.admin_unblock_user(uuid) from public, anon;
revoke execute on function public.admin_list_blocked() from public, anon;
grant  execute on function public.admin_block_user(uuid, text, boolean) to authenticated;
grant  execute on function public.admin_unblock_user(uuid) to authenticated;
grant  execute on function public.admin_list_blocked() to authenticated;

-- 4. 조회수 ---------------------------------------------------------------------
create table if not exists public.post_views (
  slug       text primary key
             check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  count      bigint not null default 0 check (count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.post_views enable row level security;
revoke all on table public.post_views from public, anon, authenticated;
grant select on table public.post_views to anon, authenticated;
drop policy if exists post_views_read on public.post_views;
create policy post_views_read on public.post_views for select to anon, authenticated using (true);

create table if not exists private.view_hits (
  slug         text not null,
  visitor_hash text not null,
  day          date not null,
  primary key (slug, visitor_hash, day)
);
create table if not exists private.rate_limits (
  bucket_key   text not null,
  window_start timestamptz not null,
  hits         int not null default 0,
  primary key (bucket_key, window_start)
);

-- service_role 전용. API 라우트가 slug 형식을 검증한 뒤 secret key로 호출한다 (plan.md §7.7, §8.7)
create or replace function public.record_view(p_slug text, p_visitor_hash text)
returns table (count bigint, counted boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_hits  int;
  v_count bigint;
  v_win   timestamptz := date_trunc('minute', now());
begin
  if p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_slug) > 80 then
    raise exception 'INVALID_SLUG';
  end if;
  if p_visitor_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_HASH'; end if;
  if not exists (select 1 from public.posts p
                 where p.slug = p_slug and p.status = 'published' and p.deleted_at is null) then
    raise exception 'UNKNOWN_SLUG';
  end if;

  insert into private.rate_limits (bucket_key, window_start, hits)
    values ('view:' || p_visitor_hash, v_win, 1)
    on conflict (bucket_key, window_start) do update set hits = private.rate_limits.hits + 1
    returning hits into v_hits;
  if v_hits > 30 then
    select pv.count into v_count from public.post_views pv where pv.slug = p_slug;
    return query select coalesce(v_count, 0::bigint), false;
    return;
  end if;

  insert into private.view_hits (slug, visitor_hash, day)
    values (p_slug, p_visitor_hash, (now() at time zone 'Asia/Seoul')::date)
    on conflict do nothing;
  if found then
    insert into public.post_views (slug, count) values (p_slug, 1)
      on conflict (slug) do update
        set count = public.post_views.count + 1, updated_at = now()
      returning public.post_views.count into v_count;
    return query select v_count, true;
  else
    select pv.count into v_count from public.post_views pv where pv.slug = p_slug;
    return query select coalesce(v_count, 0::bigint), false;
  end if;
end $$;
revoke execute on function public.record_view(text, text) from public, anon, authenticated;
grant  execute on function public.record_view(text, text) to service_role;

-- 5. 크론·운영 -----------------------------------------------------------------
create table if not exists private.cron_runs (
  id      bigint generated always as identity primary key,
  job     text not null,
  ok      boolean not null,
  details jsonb not null default '{}'::jsonb,
  ran_at  timestamptz not null default now()
);

-- 일일 정리 (멱등). 크론이 secret key로 호출. 결과를 cron_runs에 기록한다.
create or replace function public.maintenance_daily()
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_hits int; v_rl int; v_writes int; v_runs int; v_result jsonb;
begin
  delete from private.view_hits   where day < (now() at time zone 'Asia/Seoul')::date - 2;
  get diagnostics v_hits = row_count;
  delete from private.rate_limits where window_start < now() - interval '1 day';
  get diagnostics v_rl = row_count;
  delete from private.guestbook_writes where created_at < now() - interval '30 days';
  get diagnostics v_writes = row_count;
  delete from private.cron_runs where ran_at < now() - interval '90 days';
  get diagnostics v_runs = row_count;
  v_result := jsonb_build_object('view_hits', v_hits, 'rate_limits', v_rl,
                                 'guestbook_writes', v_writes, 'cron_runs', v_runs);
  insert into private.cron_runs (job, ok, details) values ('daily', true, v_result);
  return v_result;
end $$;
revoke execute on function public.maintenance_daily() from public, anon, authenticated;
grant  execute on function public.maintenance_daily() to service_role;

-- 관리자 대시보드 요약 (관리자만)
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
    'last_cron',       (select to_jsonb(c) from (select job, ok, ran_at, details from private.cron_runs order by ran_at desc limit 1) c)
  ) into v;
  return v;
end $$;
revoke execute on function public.admin_status() from public, anon;
grant  execute on function public.admin_status() to authenticated;
