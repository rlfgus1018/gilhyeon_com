# gilhyeon.com

이길현(Gilhyeon Lee)의 개인 프로필 사이트 — 프로필 + 블로그 + 프로젝트 + 방명록.
설계·마일스톤은 [`plan.md`](./plan.md)를 기준으로 한다.

## 스택 (P0 기준 고정 버전)

| 항목 | 버전 |
|---|---|
| Node.js | 24.x (`.nvmrc`, `package.json#engines`) — 로컬·CI·Vercel 동일 |
| Next.js | 16.3.7 (App Router, Turbopack) |
| React | 19.2.8 |
| Tailwind CSS | v4 (`@tailwindcss/postcss`) |
| shadcn/ui | v4 (Base UI 기반, style `base-nova`) |
| TypeScript | 5.x |
| 패키지 매니저 | npm (lockfile 커밋) |

## 스크립트

```bash
npm run dev          # 개발 서버
npm run check        # lint + typecheck + build (CI와 동일)
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
- [ ] P5 방명록·모더레이션
- [ ] P6 마감·도메인

## 이어하기 (2026-10-05 기준)

### 현재 상태
- P0~P4 완료·검증됨 (2026-10-05). 검증 내용: `npm run check`, 단위 테스트 6건, e2e 5건(글 3 + 사이트·프로젝트 2), DB 환경변수를 비운 `next build` → `next start`에서 공개 페이지 200·fallback 문구, `/admin`은 `/admin/login?auth=unavailable`로 리다이렉트.
- 다음은 **관문 G1**(실제 콘텐츠 입력 — 사용자 작업)과 **P5 방명록**.
- 운영 DB(Supabase)에는 마이그레이션 0001~0003이 적용돼 있고, 관리자 1명(GitHub 로그인 계정)이 `private.admins`에 등록돼 있다. 글·프로젝트·미디어는 아직 없다(e2e가 만든 데이터는 정리됨).
- Vercel 배포는 아직 안 함. Google OAuth 공급자 미설정(GitHub만 동작). 도메인 미연결.

### 로컬에서 다시 시작
```bash
npm install
npm run dev                 # http://localhost:3000, /admin/login 에서 GitHub 로그인
npm run check               # lint + typecheck + build
npm run test:unit           # 마크다운 컴파일러 단위 테스트
npm run test:e2e            # dev 서버가 떠 있어야 함. 임시 이메일 관리자 계정을 만들었다 지움
npm run db:verify           # DB 권한 경계 점검
npm run db:users            # 가입 사용자·관리자 여부
npm run db:e2e-cleanup      # e2e가 중간에 끊겨 남은 임시 관리자(e2e-admin-*@example.com)·e2e- 데이터 삭제
```
`.env.local` 필수 키: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, CRON_SECRET, VIEW_HASH_SECRET, SUPABASE_DB_URL(Session pooler, 마이그레이션·테스트용).

### 다음 할 일 (plan.md §12 순서)
1. **관문 G1**: 사진·소개·프로젝트 실제 콘텐츠를 `/admin/site`, `/admin/projects`에서 입력. Lighthouse 모바일 Perf ≥ 90 / a11y ≥ 95 확인.
2. **P5 방명록**: `/guestbook` 공개 페이지(폼·카드 그리드·커서 페이지네이션·상태 화면), 카드 메뉴 모더레이션, `/admin/guestbook` 콘솔(숨김·삭제·차단), 홈 카드 연결은 이미 `getGuestbookPreview`로 되어 있음. DB 함수(guestbook_create 등)는 0001에 이미 있음. 서버 액션은 `src/app/guestbook/actions.ts`에 작성 예정. tests/db 매트릭스(동시 10건·60초/24h·삭제 후 재작성)는 테스트 프로젝트가 있어야 함.
3. **P6 마감**: OG 이미지(`opengraph-image.tsx`), 주간 백업 크론, 404/에러 디자인 점검, 번들 점검, Vercel import·환경변수·도메인(Domains 화면 권장값)·Search Console.
4. 2차: Toolbox·Changelog·Stats, 링크 미리보기, 한/영, 리액션.

### 알아두면 좋은 것
- 콘텐츠 쓰기는 전부 관리자 JWT + RLS(`is_admin()`)로 간다. secret key는 `/api/views` POST와 `/api/cron`에서만 쓰며 ESLint가 다른 import를 막는다.
- `"use server"` 파일은 async 함수만 export 가능. 상수·스키마는 `src/lib/admin/*`에 둔다.
- 로그인 후 목적지는 `?next=`가 아니라 `auth_next` 쿠키로 전달한다(Supabase Redirect URL 정확 일치 때문).
- 공개 페이지의 데이터 읽기는 `src/lib/supabase/public.ts`(쿠키 없음)만 사용해 ISR 캐시가 세션에 오염되지 않게 한다. 공용 레이아웃은 cookies()를 호출하지 않는다.
- e2e는 Auth Admin API로 임시 이메일 관리자를 만들고 @supabase/ssr 쿠키 형식(`sb-<ref>-auth-token`, base64-, 3180자 조각)으로 세션을 심는다. 헬퍼: `tests/e2e/helpers/admin-session.ts`.
- e2e가 중간에 죽으면 임시 관리자 계정이 운영 DB에 남을 수 있다(2026-10-01, 10-05에 실제 발생). `npm run db:users`로 확인하고 `npm run db:e2e-cleanup`으로 지운다. 셀렉터는 헤더·내비와 이름이 겹치기 쉬우니 `exact: true`나 role 지정으로 쓴다.
