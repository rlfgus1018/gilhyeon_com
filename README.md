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
- [ ] P4 홈·About·프로젝트 + 에디터
- [ ] P5 방명록·모더레이션
- [ ] P6 마감·도메인
