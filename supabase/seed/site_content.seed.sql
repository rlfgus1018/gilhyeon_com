-- site_content 기본값 (플레이스홀더). /admin/site 에서 수정한다. 이미 있으면 덮어쓰지 않는다.
insert into public.site_content (key, data) values
  ('hero', jsonb_build_object(
      'greeting', '안녕하세요, 이길현입니다 👋',
      'intro', jsonb_build_array('인공지능학과에서 공부하는 학부생입니다.', '배운 것과 만든 것을 이곳에 차곡차곡 기록합니다.'),
      'avatar_media_id', null)),
  ('intro', jsonb_build_object('md', '소개 글을 작성해 주세요.', 'html', '<p>소개 글을 작성해 주세요.</p>')),
  ('timeline', '[]'::jsonb),
  ('interests', '[]'::jsonb),
  ('now', jsonb_build_object('items', '[]'::jsonb)),
  ('stack', '[]'::jsonb),
  ('photos', '[]'::jsonb)
on conflict (key) do nothing;
