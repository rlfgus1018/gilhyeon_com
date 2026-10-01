# Supabase 운영 메모

## 1. 마이그레이션 적용

1. Dashboard → **Connect** → **Session pooler** 탭의 URI를 복사해 `.env.local`의 `SUPABASE_DB_URL`에 넣는다(비밀번호 포함, 커밋 금지).
2. `npm run db:migrate:dry` 로 적용 대상 확인 → `npm run db:migrate`.
   - 파일 단위 트랜잭션, `private.schema_migrations`에 기록. seed(`supabase/seed/*.sql`)는 멱등이라 매번 실행.
3. Dashboard → Settings → API → **Exposed schemas**에 `private`이 **없는지** 확인한다(기본값: public, graphql_public).

## 2. 관리자 등록 (최초 1회)

1. 사이트 `/admin/login`에서 GitHub 또는 Google로 로그인한다(아직 관리자가 아니므로 "권한이 없어요" 화면).
2. Dashboard → Authentication → Users에서 본인 계정의 **UUID**를 복사한다.
3. SQL Editor에서 실행:
   ```sql
   insert into private.admins (user_id, note) values ('<UUID>', '본인') on conflict do nothing;
   ```
4. `/admin`을 새로고침하면 대시보드가 열린다.

## 3. OAuth 설정

콜백 URL은 두 종류가 있다.

- **공급자 → Supabase**: `https://<project-ref>.supabase.co/auth/v1/callback` — GitHub OAuth App·Google 클라이언트에 등록.
- **Supabase → 사이트**: `https://gilhyeon.com/auth/callback` 등 — Supabase Redirect URLs allow list에 등록.

### GitHub

GitHub → Settings → Developer settings → OAuth Apps → New. Homepage `https://gilhyeon.com`, Authorization callback URL은 위 Supabase 콜백. Client ID/Secret을 Dashboard → Authentication → Providers → GitHub에 입력.

### Google

Google Cloud Console → APIs & Services → Credentials → OAuth client (Web application).
Authorized JavaScript origins: `https://gilhyeon.com`, `http://localhost:3000`. Authorized redirect URIs: Supabase 콜백.
OAuth consent screen: External, Publishing status **In production**, scope는 기본(email, profile, openid)만. Client ID/Secret을 Providers → Google에 입력.

### Redirect URLs (Authentication → URL Configuration)

- Site URL: `https://gilhyeon.com`
- Redirect URLs: `https://gilhyeon.com/auth/callback`, `http://localhost:3000/auth/callback`,
  `https://*-<vercel-account-slug>.vercel.app/auth/callback` (본인 계정 프리뷰만, 전체 `*.vercel.app`는 금지)

## 4. 테스트 프로젝트 (`npm run test:db`)

권한 테스트는 운영 데이터와 분리된 **두 번째 무료 프로젝트**에 같은 마이그레이션을 적용해 실행한다.
`.env.test.local`에 `TEST_SUPABASE_URL`, `TEST_SUPABASE_PUBLISHABLE_KEY`, `TEST_SUPABASE_SECRET_KEY`, `TEST_SUPABASE_DB_URL`을 넣는다.
테스트 프로젝트에서만 Email provider(비밀번호 로그인)를 켠다. 테스트 사용자는 자동 생성·삭제된다.

## 5. 일시정지·복구

Free 플랜은 1주 미사용 시 일시정지된다. 크론 keepalive는 보조 수단일 뿐이다.
Dashboard에서 프로젝트를 **Restore**한 뒤 `/admin`의 "캐시 새로고침"(P4 이후) 또는 Vercel 재배포로 ISR 캐시를 갱신한다.

## 6. 백업

자동 백업 없음. P6에서 주 1회 JSON 백업(크론 → `backups` 버킷)을 추가한다. 방명록은 월 1회 CSV 내보내기.
