# gilhyeon.com

이길현(Gilhyeon Lee)의 개인 프로필 사이트 — 프로필 + 블로그 + 프로젝트 + 방명록.
설계·마일스톤은 [`plan.md`](./plan.md)를 기준으로 한다.

## 스택 (P0 기준 고정 버전)

| 항목          | 버전                                                          |
| ------------- | ------------------------------------------------------------- |
| Node.js       | 24.x (`.nvmrc`, `package.json#engines`) — 로컬·CI·Vercel 동일 |
| Next.js       | 16.3.7 (App Router, Turbopack)                                |
| React         | 19.2.8                                                        |
| Tailwind CSS  | v4 (`@tailwindcss/postcss`)                                   |
| shadcn/ui     | v4 (Base UI 기반, style `base-nova`)                          |
| TypeScript    | 5.x                                                           |
| 패키지 매니저 | npm (lockfile 커밋)                                           |

## 스크립트

```bash
npm run dev          # 개발 서버
npm run check        # lint + typecheck + build + check:bundle (CI와 동일)
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write .
```

## 환경변수

`.env.example`을 `.env.local`로 복사해 채운다. DB 변수가 없어도 빌드와 정적 페이지 렌더는 성공해야 한다.
서버 전용 값(`SUPABASE_SECRET_KEY`, `CRON_SECRET`, `VIEW_HASH_SECRET`)은 절대 `NEXT_PUBLIC_` 접두어를 붙이지 않는다.

## 디렉터리 (P0)

```
src/
├─ app/            # layout, page(홈 셸), not-found, error, robots
├─ components/
│  ├─ layout/      # SiteHeader, MobileNav, SiteFooter, ThemeToggle, Container, NavLink
│  └─ ui/          # shadcn 프리미티브
├─ lib/            # site-config(이름·링크·내비·fallback 문구), site-url(환경별 origin), utils
└─ styles/tokens.css   # 디자인 토큰 (팔레트 A)
```

## 진행 상황

- [x] P0 기반 — 스캐폴딩, 토큰, 레이아웃, 다크모드, 메타데이터, robots
- [x] P1 Supabase·인증·관리자 게이트 — 스키마 0001~0003, OAuth(GitHub), 관리자 게이트, 크론
- [x] P2 마크다운 파이프라인·글 에디터 — unified 컴파일러, CodeMirror 에디터, 미디어 업로드, e2e 3건
- [x] P3 공개 블로그·조회수 — 목록(태그 필터)·상세(목차·복사·YouTube)·조회수 API·RSS·sitemap
- [x] P4 홈·About·프로젝트 + 에디터 — 공개 페이지, 사이트/프로젝트 관리자 에디터, e2e 2건, DB 없는 빌드 fallback 확인
- [~] P5 방명록·모더레이션 — 공개 방명록(작성·카드 그리드·더 보기), 카드 메뉴, `/admin/guestbook` 콘솔(숨김·삭제·차단), e2e 7건·단위 7건·DB 매트릭스 16건 통과. **실제 OAuth 수동 체크만 남음** (아래 참고)
- [~] P6 마감·도메인 — OG 이미지(기본·글·프로젝트, Pretendard), 주간 백업 크론(마이그레이션 0004, 대시보드 표시), 번들 점검 스크립트, 404/에러/global-error, JSON-LD(홈·프로젝트), sitemap에 프로젝트 추가, e2e 6건·단위 3건. **Vercel 배포·도메인·Search Console은 사용자 작업** (아래 참고)

## 이어하기 (2026-10-06 기준)

### 현재 상태

- P0~P4 완료·검증됨. P5·P6은 **코드 완료, 사용자 계정 작업만 남음**.
  - P5: 실제 GitHub·Google 로그인은 `tests/manual/oauth.md` 체크리스트로 직접 확인. Google OAuth 공급자는 아직 미설정이라 Google 버튼은 실패 안내로 떨어진다.
  - P6(2026-10-06): `npm run check`(lint·typecheck·build·번들 점검) 통과, 단위 16건, e2e `seo.spec.ts` 6건(`next start` 기준) 통과. 크론을 로컬에서 1회 호출해 운영 Storage `backups/content-2026-W41.json`이 생성된 것을 `npm run db:backups`로 확인했다.
  - DB 매트릭스(`tests/db`, 16건)는 2026-10-05에 **운영 DB에 1회 실행해 통과**했다(배포 전 빈 DB). **배포 후에는 운영 DB에 돌리지 않는다.** 스키마를 바꾸면 로컬 Supabase(Docker)나 테스트 프로젝트에서 `.env.test.local`로 실행한다.
- 운영 DB(Supabase)에는 마이그레이션 **0001~0004** 적용, 관리자 1명(GitHub 로그인 계정). 글·프로젝트·미디어·방명록 글은 아직 없다. `backups` 버킷에 주간 백업 1개.
- **Vercel 배포·도메인 연결 완료** (P0 때 import, master push마다 자동 배포). `https://gilhyeon.com`이 Cloudflare DNS(프록시) → Vercel로 응답하며 2026-10-06 확인: `/opengraph-image`·`/sitemap.xml`·`/privacy`·`/terms` 최신 커밋 반영, robots 색인 허용, `/guestbook`·`/admin` no-store, 크론 401 보호. `www.gilhyeon.com` → `gilhyeon.com` 307 리다이렉트 확인(10-06).
- Google OAuth 공급자 설정·로컬 로그인 확인 완료(2026-10-06). 운영 도메인에서 `tests/manual/oauth.md` 나머지 항목 재확인 필요.

### 로컬에서 다시 시작

```bash
npm install
npm run dev                 # http://localhost:3000, /admin/login 에서 GitHub 로그인
npm run check               # lint + typecheck + build + 공개 번들 점검(check:bundle)
npm run test:unit           # 마크다운 컴파일러·방명록·백업 규칙 단위 테스트
npm run test:e2e            # dev 서버가 떠 있어야 함. 임시 이메일 관리자 계정을 만들었다 지움
npm run db:verify           # DB 권한 경계 점검
npm run db:users            # 가입 사용자·관리자 여부
npm run db:backups          # backups 버킷의 주간 백업 목록·최신 파일 요약
npm run db:e2e-cleanup      # e2e가 중간에 끊겨 남은 임시 관리자(e2e-admin-*@example.com)·e2e- 데이터 삭제
```

`.env.local` 필수 키: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, CRON_SECRET, VIEW_HASH_SECRET, SUPABASE_DB_URL(Session pooler, 마이그레이션·테스트용).

### 다음 할 일 (plan.md §12 순서) — 전부 사용자 계정 작업

1. **P5 마무리**: 운영 도메인(`https://gilhyeon.com/guestbook`)에서 `tests/manual/oauth.md` 나머지 항목 체크 → 위 체크박스 [x].
2. **관문 G1**: 사진·소개·프로젝트 실제 콘텐츠를 `/admin/site`, `/admin/projects`에서 입력.
3. **P6 남은 확인**: `private.cron_runs`에 Vercel 크론 실행 기록이 2026-10-01 이후 없다 → Vercel → Settings → Cron Jobs에 `/api/cron/daily`가 등록돼 있는지, 환경변수 `CRON_SECRET`이 Production에 있는지 확인. 다음날 `/admin` 대시보드 "마지막 크론 실행"·"마지막 콘텐츠 백업"이 채워지면 해결 → Lighthouse 모바일 Perf ≥ 90 / a11y ≥ 95 → Search Console 등록(sitemap 제출).
4. 2차(P7~): Toolbox·Changelog·Stats, 링크 미리보기, 한/영, 리액션, 백업 가져오기 UI.

### 알아두면 좋은 것

- 콘텐츠 쓰기는 전부 관리자 JWT + RLS(`is_admin()`)로 간다. secret key는 `/api/views` POST와 `/api/cron`에서만 쓰며 ESLint가 다른 import를 막는다.
- `"use server"` 파일은 async 함수만 export 가능. 상수·스키마는 `src/lib/admin/*`에 둔다.
- 로그인 후 목적지는 `?next=`가 아니라 `auth_next` 쿠키로 전달한다(Supabase Redirect URL 정확 일치 때문).
- 공개 페이지의 데이터 읽기는 `src/lib/supabase/public.ts`(쿠키 없음)만 사용해 ISR 캐시가 세션에 오염되지 않게 한다. 공용 레이아웃은 cookies()를 호출하지 않는다.
- e2e는 Auth Admin API로 임시 이메일 관리자를 만들고 @supabase/ssr 쿠키 형식(`sb-<ref>-auth-token`, base64-, 3180자 조각)으로 세션을 심는다. 헬퍼: `tests/e2e/helpers/admin-session.ts`.
- e2e가 중간에 죽으면 임시 관리자 계정이 운영 DB에 남을 수 있다(2026-10-01, 10-05에 실제 발생). `npm run db:users`로 확인하고 `npm run db:e2e-cleanup`으로 지운다. 셀렉터는 헤더·내비와 이름이 겹치기 쉬우니 `exact: true`나 role 지정으로 쓴다. `Button render={<Link/>}`는 접근성 트리에서 `button`으로 잡힌다.
- 방명록 규칙은 DB가 최종 강제한다(`guestbook_create` RPC: 길이·링크·색상·1분 1개·하루 5개·차단). 서버 액션(`src/app/guestbook/actions.ts`)은 같은 규칙을 먼저 검사해 안내 문구를 주고, 욕설 필터(`src/lib/guestbook/moderation.ts`)만 서버 액션에서 추가로 건다. 오류 코드 → 문구는 `src/lib/guestbook/errors.ts`.
- 방명록 목록은 로그인 여부로 읽는 곳이 다르다: 비로그인은 `guestbook_public` 뷰, 로그인은 `guestbook` 테이블(RLS). `user_id`는 브라우저로 내려보내지 않고 `mine` 여부만 계산한다. 숨김 글은 작성자 본인에게도 보이지 않고 관리자만 본다.
- `next dev`는 Cache-Control을 덮어쓴다. no-store 확인은 `next build && next start` 후 `E2E_PROD=1 npm run test:e2e`로 한다.
- **OG 이미지**: `src/lib/og/card.tsx`가 `next/og`(satori)로 1200×630 카드를 그린다. satori는 flexbox·hex 색·ttf/otf만 지원하므로 Pretendard OTF(Regular·Bold)를 `node_modules`에서 런타임에 읽고, `next.config.ts`의 `outputFileTracingIncludes`로 두 파일만 트레이스한다(경로는 리터럴로 써야 디렉터리 전체 14MB가 딸려오지 않는다). 글·프로젝트 카드는 같은 세그먼트의 `opengraph-image.tsx`가 그리며 **파일 메타데이터가 `generateMetadata`의 images보다 우선**하므로 커버는 카드 안에 넣는다. 커버 fetch에 `cache: "no-store"`를 주면 라우트가 동적으로 바뀌어 ISR을 잃는다. 저장 시 `revalidatePost/Project`가 OG 경로도 만료시킨다.
- **주간 백업**: `/api/cron/daily`가 매일 `posts·projects·site_content·media`를 `backups/content-<ISO주>.json`에 upsert하고 최근 8개만 남긴다. 규칙은 `src/lib/backup/weekly.ts`(단위 테스트), 결과는 `record_cron_run` RPC(0004)로 `private.cron_runs`에 기록되어 대시보드에 보인다. 복원 절차는 `supabase/README.md` §6.
- **번들 점검**: `scripts/check-bundle.mjs`가 `.next/server/app/**/*.nft.json`에서 `admin/` 밖 라우트에 shiki·unified·katex·CodeMirror가 트레이스되지 않았는지 확인한다(`npm run check`에 포함).
