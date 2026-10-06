# 수동 체크리스트 — 실제 OAuth 로그인 (plan.md §12 P5)

자동 테스트는 임시 이메일 계정으로 세션을 심기 때문에 GitHub·Google의 실제 로그인 화면은 거치지 않는다.
아래는 사람이 직접 확인한다. 환경마다(로컬 `http://localhost:3000`, 프리뷰, 운영 `https://gilhyeon.com`) 한 번씩.

## 준비

- Supabase → Authentication → Providers: GitHub, Google 활성화 (Client ID/Secret 입력)
- Supabase → Authentication → URL Configuration → Redirect URLs에 각 환경의 `<origin>/auth/callback` 등록 (정확 일치, 쿼리 없음)
- GitHub OAuth App / Google OAuth Client의 콜백 URL은 `https://<project-ref>.supabase.co/auth/v1/callback`

## 방명록 `/guestbook`

- [ ] 비로그인: "로그인하고 한 줄 남기기" 카드와 GitHub·Google 버튼이 보이고 작성 폼은 없다
- [ ] GitHub로 로그인 → `/guestbook`으로 돌아오고 "○○ 님으로 로그인했어요"에 GitHub 이름·아바타가 보인다
- [x] Google로 로그인 → 같은 확인 (Google 이름·프로필 사진) — 로컬 확인 2026-10-06, 운영 도메인은 배포 후 재확인
- [ ] 글을 남기면 카드에 공급자 이름·아바타가 찍힌다 (이메일은 어디에도 보이지 않는다)
- [ ] 공급자 동의 화면에서 "취소" → `/guestbook`에 "로그인이 취소됐어요." 안내
- [ ] 로그아웃 → 비로그인 화면으로 돌아오고, 뒤로 가기를 눌러도 작성 폼이 되살아나지 않는다
- [ ] 로그인한 채 다른 탭에서 로그아웃한 뒤 글을 남기면 "세션이 만료됐어요" 안내가 뜬다
- [ ] 내 글 메뉴에 "삭제"만 있다 (일반 계정) / 관리자 계정은 "숨기기"와 "관리 콘솔" 링크가 보인다

## 관리자 `/admin`

- [ ] 관리자 GitHub 계정으로 `/admin/login` 로그인 → `/admin` 대시보드
- [ ] 관리자가 아닌 계정으로 로그인 → `/admin`은 404, `/admin/login`은 "관리자 권한이 없어요"
- [ ] `/admin/guestbook`에서 숨기기 → 시크릿 창의 `/guestbook`과 홈 카드에서 사라진다
- [ ] 작성자 차단 → 그 계정으로 글을 남기면 "이 계정은 방명록을 이용할 수 없어요"

## 리다이렉트 안전성

- [ ] 로그인 시작 폼의 `next` 값을 개발자 도구로 `https://evil.example`이나 `//evil.example`로 바꿔도 로그인 후 `/guestbook`으로만 돌아온다
