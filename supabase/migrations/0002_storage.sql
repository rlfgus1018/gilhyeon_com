-- 0002_storage.sql — 이미지 버킷(media, 공개 읽기)과 백업 버킷(backups, 비공개)
-- 쓰기는 관리자 JWT + storage.objects RLS(public.is_admin()). backups 쓰기는 크론(secret key)만.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 5242880,
  array['image/png','image/jpeg','image/webp','image/gif','image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'uploads'
  );

drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists media_admin_list on storage.objects;
create policy media_admin_list on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists backups_admin_read on storage.objects;
create policy backups_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'backups' and public.is_admin());
