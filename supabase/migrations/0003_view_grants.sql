-- 0003_view_grants.sql — guestbook_public 뷰 권한 수정
-- Supabase 기본 권한(default privileges)이 새 뷰에 ALL을 부여해 anon/authenticated가 자동 갱신 가능한 뷰를 통해
-- 기본 테이블에 INSERT/UPDATE/DELETE 할 수 있었다. SELECT만 남긴다.
revoke all on public.guestbook_public from public, anon, authenticated;
grant select on public.guestbook_public to anon, authenticated;

-- 트리거 함수는 직접 호출할 이유가 없다
revoke execute on function public.set_updated_at() from public, anon, authenticated;
