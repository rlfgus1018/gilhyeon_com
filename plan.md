# gilhyeon.com — 개인 프로필 사이트(블로그폴리오) 구현 계획 v3

> 작성일: 2026-09-30 · v2: 보안·운영 수정 지시 반영 · **v3: 콘텐츠를 DB 기반으로 전환하고 사이트 내 관리자 에디터 추가(사용자 결정 "3번 방향")**
> 이 문서는 단계별 구현의 기준 문서입니다. **승인은 계획 승인이며 구현 시작이 아닙니다.** 구현은 사용자가 "구현 시작"을 별도로 지시할 때 P0부터 진행합니다.
> 2026-09-30 계획 승인 및 구현 시작. 실제 설치 버전은 `README.md`에 기록한다.
> 표기: `가정:` = 공식 문서로 확인하지 못한 추정. `[확인 2026-09-30]` = 공식 문서 확인(§14).

---

## 0. v3에서 달라진 핵심 (먼저 읽기)

| 항목 | v2 | v3 |
|---|---|---|
| 콘텐츠 저장 | 저장소의 MDX 파일, git push로 배포 | **Supabase DB**(`posts`, `projects`, `site_content`, `media`). 사이트 안 `/admin`에서 작성·수정·발행 |
| 본문 형식 | MDX(JSX 컴포넌트) | **Markdown + 확장 디렉티브**(`:::callout`, `::youtube`, 수식, 코드 하이라이트). 임의 JSX는 받지 않음 → 런타임 코드 실행 없음 |
| 컴파일 시점 | 빌드 타임(`@next/mdx`) | **저장 시점** 서버 액션에서 `unified`로 HTML·목차·읽기시간 생성 후 DB 저장. 함수형 remark/rehype 플러그인 사용 가능(Turbopack 문자열 제약 무관) |
| 공개 페이지 렌더 | 완전 정적 | **ISR + 저장 시 on-demand 재검증**(`revalidatePath`) |
| 관리자 기능 | 방명록 숨김/삭제만 | 대시보드, 글·프로젝트·소개·홈 카드 편집, 이미지 업로드, 초안 미리보기, 휴지통, 방명록 모더레이션 콘솔, **사용자 차단** |
| DB 장애 시 | 정적 본문은 항상 표시 | **캐시된 페이지는 계속 표시**되지만 캐시에 없는 페이지는 오류 페이지. 정적 보장이 약해짐(§13.1) |
| 마일스톤 | 정적 먼저 → DB 나중 | **DB·인증·관리자 게이트가 P1**로 앞당겨짐 |

받아들인 트레이드오프(사용자 결정): 작업량 증가(에디터·업로드·권한), 빌드 타임 정적 보장 상실, DB 의존도 상승. 대신 브라우저만으로 모든 콘텐츠를 관리할 수 있다.

---

## 1. 개요

### 1.1 목표
- 이길현(GILHYEON LEE, 인공지능학과 학부생)의 **gilhyeon.com**에 올릴 "프로필 + 블로그 + 방명록" 사이트. 레퍼런스 braydoncoyer.dev의 구성·기능 아이디어만 참고, 비주얼·카피·이미지는 새로 제작.
- 운영비는 **무료 티어 사용량 범위 내**(도메인 제외). 한도 §11.5.
- **콘텐츠는 사이트 `/admin`에서 브라우저로 작성·수정·발행**한다. 저장 즉시 공개 페이지가 갱신된다(재배포 불필요).

### 1.2 범위
| 구분 | 포함 |
|---|---|
| **MVP (P0~P6)** | 홈, About, Blog(Markdown+디렉티브·태그·조회수·목차·코드 하이라이트·RSS), Projects, Guestbook(GitHub/Google 로그인, 작성 제한), **관리자 영역**(글·프로젝트·소개·홈 카드·사진 편집, 이미지 업로드, 초안·미리보기·휴지통, 방명록 모더레이션·차단, 대시보드), 다크모드, 반응형, SEO, 접근성, 도메인 |
| **2차 (P7~)** | Toolbox, Changelog, Stats(각각 관리자 에디터 포함), 링크 미리보기, 한/영 전환, 글 리액션, slug 변경 리다이렉트 이력, 글 버전 기록, 예약 발행 |
| **제외 (결정됨)** | 뉴스레터, Speaking, 미팅 예약, Products/Connections/Links, 방문자 댓글(방명록만) |

### 1.3 사용자 결정 사항
한국어 기본 · 방명록 카드 그리드 · 뉴스레터 제외 · 보유 자료(사진, 프로젝트 목록) · **콘텐츠 DB + 사이트 내 에디터(3번)** · **본문 형식 Markdown + 디렉티브** · **에디터 CodeMirror** · **컬러 팔레트 A**(2026-09-30 구현 시작 시 확정). 표시 이름·커피챗 링크·홈 블로그 개수·도메인 등록기관·실제 문안은 미결정(§13.2).

### 1.4 레퍼런스 실사 차이 (v2와 동일, 요약)
홈 블로그 3개(레퍼런스 4개) · 푸터 3그룹 차용 · 블로그 목록은 태그 칩+조회수+읽기시간 · 방명록은 카드 그리드(레퍼런스 캔버스형) · 리액션·Toolbox·Changelog·Stats는 2차 · 뉴스레터 제외.

---

## 2. 정보 구조 (IA)

### 2.1 라우트와 렌더링·캐시 경계

공용 레이아웃(`layout.tsx`, 헤더, 푸터)은 **cookies()/headers()를 호출하지 않는다**. 로그인 상태는 `/guestbook`과 `/admin` 내부에서만 표시한다.

| 라우트 | 빌드 시 | 요청 시 (DB) | 캐시 | 갱신 | 단계 |
|---|---|---|---|---|---|
| `/` | 없음(빌드 중 DB 실패 시 fallback 셸을 캐시) | `site_content`(히어로·현재·스택·사진), 최신 공개 글 3 + 조회수 일괄, 방명록 공개 미리보기 3 + 공개 개수 — 모두 **쿠키 없는 publishable 클라이언트** | ISR `revalidate = 300` | 5분 경과 / 관리자 저장·방명록 액션의 `revalidatePath('/')` | P4 |
| `/about` | 없음 | `site_content`(intro_html, timeline, interests) | ISR 3600 | 저장 시 재검증 | P4 |
| `/blog` | 없음 | 공개 글 목록·태그 집계 + 조회수 일괄(1쿼리) | ISR 300 | 저장 시 재검증 | P3 |
| `/blog/[slug]` | `generateStaticParams`: DB 성공 시 공개 slug 목록, 실패 시 `[]` | `posts` 1행(`content_html`, `toc`) | ISR 3600, `dynamicParams = true`(첫 요청 시 생성). 미존재·미공개 → `notFound()` | 저장·발행·삭제 시 `revalidatePath('/blog/<slug>')` | P3 |
| `/projects`, `/projects/[slug]` | 동일 방식 | `projects` | ISR 3600 | 저장 시 재검증 | P4 |
| `/guestbook` | — | 세션, 목록(사용자 JWT), 관리자 여부 | `force-dynamic`, `private, no-store` | 매 요청 | P5 |
| `/admin/**` | — | `getUser()` + `is_admin()` 필수. 비로그인 → `/admin/login`, 로그인했지만 비관리자 → 404 | `force-dynamic`, `private, no-store` | 매 요청 | P1~P5 |
| `/admin/preview/post/[id]` 등 | — | 초안 포함 렌더(관리자만) | no-store | — | P2 |
| `/auth/callback`, `/auth/signout` | — | 세션 교환/해제 | no-store | — | P1 |
| `/api/views/[slug]` GET / POST | — | `post_views` 읽기 / `record_view` RPC(secret key) | `s-maxage=60` / no-store | — | P3 |
| `/api/cron/daily` | — | keepalive + 정리 RPC + 주간 백업 | no-store | 1일 1회 | P1, P6 |
| `/rss.xml`, `/sitemap.xml`, `/robots.txt` | — | 공개 글·프로젝트 | ISR 3600 | 저장 시 재검증 | P3 |
| `/blog/[slug]/opengraph-image` | — | `posts` 제목·설명 | ISR 3600 | 저장 시 재검증 | P6 |
| `/toolbox`, `/changelog`, `/stats` | 2차 | — | — | — | P7+ |

- **on-demand 재검증 규칙**: 콘텐츠 저장 서버 액션이 영향 경로를 `revalidatePath`로 즉시 만료. 글 저장 → `/`, `/blog`, `/blog/<slug>`, `/rss.xml`, `/sitemap.xml`, OG. 프로젝트 저장 → `/`, `/projects`, `/projects/<slug>`, `/sitemap.xml`. 사이트 콘텐츠 저장 → `/`, `/about`. 방명록 숨김/삭제/작성 → `/`, `/guestbook`. 경로 목록은 `lib/content/revalidate.ts` 한 곳에서 관리.
- **DB 장애 시**: ISR 재생성 중 오류가 나면 Next는 **마지막 성공 캐시를 계속 제공**한다(가정: Vercel ISR 기본 동작, P3d에서 실제 확인). 캐시가 없는 페이지(첫 요청·재배포 직후)는 `error.tsx`("잠시 후 다시 시도")를 보인다. 홈·목록의 동적 카드는 `try/catch`로 부분 fallback. **조회수·방명록 개수를 0으로 표시하지 않는다.**
- Supabase 대시보드에서 직접 데이터를 바꾼 경우 재검증이 일어나지 않으므로 ISR 주기(5분/1시간) 후 반영. 즉시 반영은 `/admin`의 "캐시 새로고침" 버튼(모든 공개 경로 `revalidatePath`).

### 2.2 상단 내비게이션 / 2.3 푸터
v2와 동일: `홈 · 소개 · 블로그 · 프로젝트 · 방명록` + GitHub·이메일·테마 토글. 푸터 3그룹(둘러보기 / 더 보기 / 연락). `/admin` 링크는 내비·푸터에 **노출하지 않는다**(URL 직접 접근, 방명록 로그인 후 관리자에게만 "관리" 링크 표시).

### 2.4 관리자 영역 `/admin`
| 경로 | 화면 |
|---|---|
| `/admin` | 대시보드: 공개/초안 글 수, 총 조회수, 조회수 상위 5, 최근 방명록 5(숨김 포함), 숨김·차단 수, "캐시 새로고침", 마지막 크론 실행 시각 |
| `/admin/login` | 비로그인 시 GitHub/Google 버튼(로그인 후 `/admin`으로) |
| `/admin/posts` | 글 목록(상태 필터 전체/공개/초안/휴지통, 제목 검색, 정렬), 새 글, 행별 발행/초안 전환·미리보기·휴지통 |
| `/admin/posts/new`, `/admin/posts/[id]` | **에디터**(§8A) |
| `/admin/projects`, `/admin/projects/[id]` | 프로젝트 목록·에디터(요약·기술·링크·썸네일·본문 Markdown 선택) |
| `/admin/site` | 탭: 히어로 문구 / 소개(intro Markdown) / 타임라인(행 추가·순서) / 관심 분야 / 현재(Now) 카드 / 스택 아이콘 / 사진 스트립(업로드·순서·alt 필수) |
| `/admin/media` | 업로드된 이미지 목록, 사용 여부, 삭제 |
| `/admin/guestbook` | 모더레이션 콘솔(§8.5): 필터(전체/공개/숨김/차단 사용자), 숨기기·복원·삭제, **사용자 차단/해제**, 사용자별 글 일괄 숨김 |
| `/admin/trash` | 휴지통(글·프로젝트): 복원·영구 삭제 |

---

## 3. 페이지별 설계 (공개)

### 3.1 홈 `/`
| # | 섹션 | 데이터 | 편집 위치 | 장애 시 |
|---|---|---|---|---|
| 1 | 히어로 | `site_content.hero`(인사말·소개 2문장·프로필 이미지) | `/admin/site` 히어로 | 코드 기본값(`site-config.ts`) |
| 2 | 사진 스트립 | `site_content.photos[]`(media id, alt, rotate) | `/admin/site` 사진 | 숨김 |
| 3 | 벤토 | `AboutCard`(intro 요약), `NowCard`(`site_content.now`), `StackCard`(`site_content.stack`), `ConnectCard`(코드 상수) | `/admin/site` | 코드 기본값 |
| 4 | 최신 글 3 | `posts` 공개 + `post_views` | `/admin/posts` | 섹션 "잠시 불러올 수 없어요" |
| 5 | My Site | `GuestbookCard`(공개 3 + 개수), `ProjectsCard`(featured) | — | 카드 fallback |
| 6 | CTA 밴드 | 코드 상수 | — | 영향 없음 |

### 3.2 About `/about`
`intro_html`(Markdown 컴파일 결과) → `Interests` → `Timeline` → `ContactStrip`. 전부 `site_content`.

### 3.3 Blog
- 목록: `FeaturedPosts`(featured 최대 2) → `TagFilter`(칩, `?tag=`, 클라이언트) → `PostList`(제목·설명·날짜·읽기시간·조회수).
- 상세: `PostHeader` → 2컬럼(`<article>`에 저장된 `content_html` 삽입 / `TableOfContents`(저장된 `toc`)) → `PostFooter`(이전/다음 공개 글). 클라이언트 아일랜드: `CodeBlockEnhancer`(복사 버튼 주입), `TableOfContents`, `LiteYouTube`(디렉티브 플레이스홀더 하이드레이션), `ViewCounter`.
- 관리자에게 "편집" 플로팅 버튼: 클라이언트 컴포넌트가 로그인 시 저장된 `sessionStorage` 힌트로만 표시(정적 캐시 오염 방지). 진짜 권한은 `/admin`에서 재검증.

### 3.4 Projects
카드(썸네일/플레이스홀더, 제목, 요약, 기술 칩, GitHub·Demo·글 링크), 유형 필터. `content_html`이 있는 프로젝트만 상세 페이지.

### 3.5 Guestbook — v2와 동일(§8).

---

## 4. 디자인 시스템 (v2와 동일, 팔레트 미확정)
플랫·컬러풀, 1px 보더 카드, 라운드 24px, 후보 팔레트 A/B/C(OKLCH 토큰), Pretendard + JetBrains Mono, 벤토 12/6/1, `next-themes`, `motion` LazyMotion, reduced-motion 준수. **관리자 화면**은 같은 토큰을 쓰되 밀도 높은 "도구" 레이아웃(사이드바 + 콘텐츠). shadcn에서 Input/Textarea/Select/Switch/Tabs/Table/Dialog 추가.

---

## 5. 기술 스택

| 영역 | 선택 | 대안 | 이유 |
|---|---|---|---|
| 프레임워크 | **Next.js 16 (App Router) + TypeScript**, P0에서 정확 버전 lockfile 고정 [확인: 16.3.x, `proxy.ts`, `next lint` 제거, async params] | Astro | 동적 관리자 영역·ISR·서버 액션 필요 |
| Node | **24.x** 로컬·CI·Vercel 통일 [확인] | — | — |
| 스타일 | Tailwind v4 + shadcn/ui | — | — |
| **본문 컴파일(런타임)** | **`unified` 파이프라인**: `remark-parse` → `remark-gfm` → `remark-math` → `remark-directive` + 자체 디렉티브 핸들러(callout/youtube/figure) → `remark-rehype` → `rehype-slug` → `rehype-autolink-headings` → `rehype-katex` → `rehype-pretty-code`(shiki, 언어 제한 번들) → 자체 `rehype-image-dims`(media 테이블 조회) → `@stefanprobst/rehype-extract-toc` → `rehype-sanitize`(허용 목록 확장: class·data-*·KaTeX 태그) → `rehype-stringify` | `@mdx-js/mdx` `compile`+`run` 런타임 MDX | MDX는 저장된 문자열을 JS로 평가(`new Function`)해야 하고 임의 JSX가 XSS·권한 상승 경로가 됨. Markdown+디렉티브는 HTML만 생성하므로 sanitize 가능. `@next/mdx`는 빌드 타임 전용이라 DB 콘텐츠에 사용 불가 |
| raw HTML | **비허용**(`rehype-raw` 미사용) | — | 필요 컴포넌트는 디렉티브로 |
| 코드 하이라이트 | `shiki` `createHighlighterCore` + 언어 12개(python, ts, js, tsx, bash, json, yaml, sql, markdown, html, css, text), 테마 2개 CSS 변수 | 전체 번들 | 서버 함수 콜드스타트·번들 크기 제한. 하이라이터는 모듈 싱글턴 |
| 에디터 | **CodeMirror 6**(`@codemirror/lang-markdown`, `@uiw/react-codemirror`) + 서버 액션 미리보기(디바운스 800ms) + 툴바 | Tiptap(WYSIWYG), 순수 textarea | Markdown 소스가 진실이라 텍스트 에디터가 맞음. WYSIWYG↔Markdown 왕복 손실 회피 |
| 이미지 | **Supabase Storage** 버킷 `media`(공개 읽기), 업로드는 브라우저 → Storage(사용자 JWT, RLS `is_admin()`), 서버 액션이 `image-size`로 크기 기록 → `media` 테이블 | Vercel Blob(유료), 레포 커밋 | 무료 1GB [확인], RLS로 관리자만 쓰기 |
| **DB/인증** | Supabase(Postgres + Auth + RLS), `@supabase/ssr`, publishable/secret 키 [확인] | Neon + Auth.js | v2 §5.1 동일 결론 + Storage·RLS로 관리자 쓰기 경계 |
| 폼/변경 | Server Actions + `zod` + `useActionState` | — | — |
| 기타 | `next-themes`, `motion`, `lucide-react`, `simple-icons`, Vercel Web Analytics, npm, ESLint flat + Prettier, Playwright + axe, `tests/db` | — | — |

**npm scripts**
```json
{ "dev": "next dev", "build": "next build", "start": "next start",
  "lint": "eslint .", "typecheck": "tsc --noEmit",
  "check": "npm run lint && npm run typecheck && npm run build",
  "test:unit": "node --test tests/unit/*.test.mjs",
  "test:e2e": "playwright test", "test:db": "node --test tests/db/*.test.mjs",
  "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/lib/supabase/types.ts" }
```

---

## 6. 디렉터리 구조

```
gilhyeon_com/
├─ plan.md  README.md  .env.example  .nvmrc(24)  .gitattributes
├─ next.config.ts   # images.remotePatterns: <ref>.supabase.co/storage/v1/object/public/**, 아바타 호스트
├─ eslint.config.mjs  vercel.json(crons)  playwright.config.ts
├─ supabase/
│  ├─ migrations/0001_init.sql          # §7 전체
│  ├─ migrations/0002_storage.sql       # 버킷·storage.objects 정책
│  ├─ seed/site_content.seed.sql        # 홈·소개 기본값(플레이스홀더 문구)
│  └─ README.md                          # 적용·백업·복구·관리자 등록
├─ scripts/import-markdown.mjs           # 로컬 .md 일괄 → posts 초안 (선택)
├─ tests/unit/(markdown-compile)  tests/e2e/  tests/db/(rls, content-rls, guestbook-write, views)  tests/manual/(oauth, storage-policy).md
├─ src/
│  ├─ proxy.ts        # matcher: ['/guestbook/:path*','/auth/:path*','/admin/:path*']
│  ├─ app/
│  │  ├─ layout.tsx  page.tsx  error.tsx  not-found.tsx  globals.css
│  │  ├─ about/  blog/  blog/[slug]/(page, opengraph-image)  projects/  projects/[slug]/
│  │  ├─ guestbook/(page, actions.ts)
│  │  ├─ admin/
│  │  │  ├─ layout.tsx                 # 관리자 게이트(getUser + is_admin) + 사이드바
│  │  │  ├─ page.tsx  login/page.tsx
│  │  │  ├─ posts/(page, new/page, [id]/page, actions.ts)
│  │  │  ├─ projects/(...)  site/(page, actions.ts)  media/(...)  guestbook/(page, actions.ts)  trash/
│  │  │  └─ preview/post/[id]/page.tsx  preview/project/[id]/page.tsx
│  │  ├─ auth/callback/route.ts  auth/signout/route.ts
│  │  ├─ rss.xml/route.ts  sitemap.ts  robots.ts  opengraph-image.tsx
│  │  └─ api/views/[slug]/route.ts  api/cron/daily/route.ts
│  ├─ components/ ui/ layout/ home/ blog/(CodeBlockEnhancer·TableOfContents·LiteYouTube·ViewCounter는 client) projects/ guestbook/ about/
│  │  └─ admin/ (Sidebar, MarkdownEditor(client), PreviewPane, MetaForm, TagInput, ImageUploader(client), MediaPicker, TimelineEditor, PhotoStripEditor, ConfirmInline, DataTable)
│  ├─ lib/
│  │  ├─ markdown/ compile.ts(서버 전용)  directives.ts  rehype-image-dims.ts  sanitize-schema.ts  highlighter.ts
│  │  ├─ content/ posts.ts  projects.ts  site.ts  (읽기 쿼리, 쿠키 없는 클라이언트, 명시 컬럼)  revalidate.ts
│  │  ├─ admin/ guard.ts(requireAdmin)  slug.ts  schemas.ts(zod)  media.ts
│  │  ├─ supabase/ browser.ts  server.ts  public.ts  admin.ts(secret, /api/views·cron만)  proxy.ts  types.ts
│  │  ├─ guestbook/ moderation.ts  errors.ts  cursor.ts
│  │  ├─ views/ visitor-hash.ts
│  │  ├─ site-config.ts(이름·링크·내비·fallback 문구)  site-url.ts  utils.ts
│  └─ styles/tokens.css
└─ .github/workflows/ci.yml
```

---

## 7. 데이터 모델 — `supabase/migrations/0001_init.sql`

### 7.1 원칙 (v2 유지 + 콘텐츠 추가)
- 공개 API 노출 스키마는 `public`만. 이력·제한·관리자·차단 목록은 `private`. 함수 기본 EXECUTE 제거 후 필요한 역할에만 부여 [확인].
- **관리자 = `private.admins(user_id uuid)` 단일 기준.** `public.is_admin()`(security definer, `search_path=''`)이 RLS·서버 게이트·Storage 정책에 공통 사용.
- **콘텐츠 테이블 쓰기 = 관리자 JWT + RLS `is_admin()`.** 서비스 롤을 콘텐츠 경로에 쓰지 않는다. 컴파일된 HTML은 서버 액션이 생성해 함께 저장한다(관리자가 Data API로 직접 쓰면 HTML이 갱신되지 않으나 관리자 본인만 가능하므로 허용, README에 "대시보드에서 본문 편집 금지" 안내).
- 방명록·조회수는 v2 설계 그대로(§7.6~7.7) + **차단 사용자 검사** 추가.

### 7.2 공통·관리자
```sql
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public  revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

create table private.admins (user_id uuid primary key references auth.users(id) on delete cascade, note text, created_at timestamptz not null default now());
create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.admins a where a.user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
```

### 7.3 콘텐츠 테이블
```sql
create table public.media (
  id          uuid primary key default gen_random_uuid(),
  path        text not null unique,             -- 'uploads/2026/09/<uuid>.png'
  url         text not null,
  width       int, height int, bytes int, mime text,
  alt_default text,
  created_at  timestamptz not null default now()
);

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title           text not null check (char_length(title) between 1 and 120),
  description     text not null default '' check (char_length(description) <= 200),
  content_md      text not null default '',
  content_html    text not null default '',     -- 서버 액션이 컴파일·sanitize한 결과
  toc             jsonb not null default '[]',
  reading_minutes int  not null default 1,
  tags            text[] not null default '{}' check (cardinality(tags) <= 5),
  lang            text not null default 'ko' check (lang in ('ko','en')),
  featured        boolean not null default false,
  status          text not null default 'draft' check (status in ('draft','published')),
  published_at    timestamptz,
  cover_media_id  uuid references public.media(id) on delete set null,
  deleted_at      timestamptz,                  -- 휴지통(soft delete)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index posts_public on public.posts (published_at desc) where status = 'published' and deleted_at is null;
create index posts_tags on public.posts using gin (tags);
create trigger posts_updated before update on public.posts for each row execute function public.set_updated_at();

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title         text not null, summary text not null default '',
  content_md    text not null default '', content_html text not null default '', toc jsonb not null default '[]',
  type          text not null default 'ai' check (type in ('ai','web','other')),
  tech          text[] not null default '{}',
  links         jsonb not null default '{}',    -- {github, demo, post}
  thumbnail_media_id uuid references public.media(id) on delete set null,
  featured      boolean not null default false,
  work_status   text not null default 'done' check (work_status in ('done','wip','archived')),
  status        text not null default 'draft' check (status in ('draft','published')),
  sort_date     date not null default current_date,
  deleted_at    timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();

create table public.site_content (
  key        text primary key check (key in ('hero','intro','timeline','interests','now','stack','photos')),
  data       jsonb not null,                    -- 키별 스키마는 zod(lib/admin/schemas.ts)로 서버 검증
  updated_at timestamptz not null default now()
);
create trigger site_content_updated before update on public.site_content for each row execute function public.set_updated_at();
```
`site_content.data`: `hero {greeting, intro[2], avatar_media_id}` · `intro {md, html}` · `timeline [{period, title, description, tags[]}]` · `interests [{label, icon}]` · `now {items[]}` · `stack [{key, label}]` · `photos [{media_id, alt, rotate}]`.

### 7.4 콘텐츠 권한
```sql
alter table public.media        enable row level security;
alter table public.posts        enable row level security;
alter table public.projects     enable row level security;
alter table public.site_content enable row level security;
revoke all on table public.media, public.posts, public.projects, public.site_content from public, anon, authenticated;
grant select on table public.media, public.posts, public.projects, public.site_content to anon, authenticated;
grant insert, update, delete on table public.posts, public.projects, public.media to authenticated;
grant insert, update         on table public.site_content to authenticated;

-- 읽기: anon 정책과 authenticated 정책을 분리(anon은 is_admin 실행 권한이 없음)
create policy "posts_read_anon" on public.posts for select to anon
  using (status = 'published' and deleted_at is null and published_at <= now());
create policy "posts_read_auth" on public.posts for select to authenticated
  using ((status = 'published' and deleted_at is null and published_at <= now()) or public.is_admin());
create policy "projects_read_anon" on public.projects for select to anon
  using (status = 'published' and deleted_at is null);
create policy "projects_read_auth" on public.projects for select to authenticated
  using ((status = 'published' and deleted_at is null) or public.is_admin());
create policy "site_read"  on public.site_content for select to anon, authenticated using (true);
create policy "media_read" on public.media        for select to anon, authenticated using (true);

-- 쓰기: 관리자만
create policy "posts_insert"    on public.posts    for insert to authenticated with check (public.is_admin());
create policy "posts_update"    on public.posts    for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "posts_delete"    on public.posts    for delete to authenticated using (public.is_admin());
-- projects, media 동일 3정책; site_content는 insert/update 2정책
```
- 익명 공개 응답에 `content_md`가 포함되지 않도록 공개 읽기 쿼리는 **명시 컬럼 선택**(`content_md`는 관리자 화면에서만). 가정: 컬럼 단위 GRANT는 `select=*`를 깨뜨려 운영 실수를 늘리므로 쿼리 규약 + e2e(응답에 `content_md` 부재)로 관리.

### 7.5 Storage — `0002_storage.sql` [확인: storage.objects RLS]
```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif','image/avif'])
on conflict (id) do nothing;   -- 가정: 컬럼명·public 버킷 GET은 정책 없이 허용(P2d에서 확인)
insert into storage.buckets (id, name, public) values ('backups', 'backups', false) on conflict (id) do nothing;

create policy "media_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin() and (storage.foldername(name))[1] = 'uploads');
create policy "media_admin_update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media_admin_list"   on storage.objects for select to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "backups_admin_read" on storage.objects for select to authenticated using (bucket_id = 'backups' and public.is_admin());
-- backups 쓰기는 크론(secret key, RLS 우회)만
```

### 7.6 방명록 (v2 §7.3 유지 + 차단)
`public.guestbook`, `public.guestbook_public` 뷰, `private.guestbook_writes`, RLS(select 공개 or 관리자 / delete 소유자 or 관리자), `guestbook_create` RPC(인증·길이·링크·색상·60초/24h advisory lock·identity_data 스냅샷·`now()`), `guestbook_set_hidden` RPC — **v2 SQL 그대로**. 추가:
```sql
create table private.blocked_users (user_id uuid primary key, reason text, blocked_by uuid, created_at timestamptz not null default now());
-- guestbook_create 인증 검사 직후 삽입:
--   if exists (select 1 from private.blocked_users b where b.user_id = v_uid) then raise exception 'USER_BLOCKED'; end if;

create function public.admin_block_user(p_user uuid, p_reason text, p_hide_all boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_user = (select auth.uid()) then raise exception 'CANNOT_BLOCK_SELF'; end if;
  insert into private.blocked_users (user_id, reason, blocked_by) values (p_user, left(p_reason, 200), (select auth.uid()))
    on conflict (user_id) do update set reason = excluded.reason;
  if p_hide_all then update public.guestbook set is_hidden = true where user_id = p_user; end if;
end $$;
create function public.admin_unblock_user(p_user uuid) returns void language plpgsql security definer set search_path = '' as $$
begin if not public.is_admin() then raise exception 'FORBIDDEN'; end if; delete from private.blocked_users b where b.user_id = p_user; end $$;
create function public.admin_list_blocked() returns table (user_id uuid, reason text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select b.user_id, b.reason, b.created_at from private.blocked_users b where public.is_admin();
$$;
revoke execute on function public.admin_block_user(uuid,text,boolean), public.admin_unblock_user(uuid), public.admin_list_blocked() from public, anon;
grant  execute on function public.admin_block_user(uuid,text,boolean), public.admin_unblock_user(uuid), public.admin_list_blocked() to authenticated;
```

### 7.7 조회수 (v2 §7.4 유지 + 공개 글 존재 검사)
`record_view` 형식 검사 직후 `if not exists (select 1 from public.posts p where p.slug = p_slug and p.status = 'published' and p.deleted_at is null) then raise exception 'UNKNOWN_SLUG'; end if;` 추가 — DB가 단일 진실 소스. `private.view_hits`(일 1회), `private.rate_limits`(분당 30), `maintenance_daily()` 그대로. `record_view`·`maintenance_daily`는 service_role 전용.

### 7.8 접근 경로 요약

| 경로 | 호출자 | DB 역할 | 권한 검증 | 변경 가능 |
|---|---|---|---|---|
| 공개 콘텐츠 읽기 | ISR 페이지(쿠키 없음) | anon | RLS: published·미삭제·published_at ≤ now | — |
| 초안·휴지통 읽기 | `/admin`, 미리보기 | authenticated | RLS `is_admin()` | — |
| 글·프로젝트·사이트 콘텐츠 쓰기 | `/admin` 서버 액션 | authenticated(관리자 JWT) | 서버 `requireAdmin()`(getUser + is_admin) → zod → 컴파일 → RLS `is_admin()` | 해당 행 전체 |
| 이미지 업로드 | 브라우저 → Storage | authenticated | storage.objects 정책 `is_admin()` + 버킷 MIME·5MB | `media/uploads/**` |
| 미디어 메타 기록 | 서버 액션 | authenticated | RLS `is_admin()` | `media` 행 |
| 방명록 작성/삭제/숨김 | v2와 동일 | authenticated | RPC/RLS (+차단 검사) | — |
| 사용자 차단/해제 | `/admin/guestbook` 액션 | authenticated | RPC 내부 `is_admin()` | `private.blocked_users`, 일괄 `is_hidden` |
| 조회수 증가 | `/api/views` POST | service_role(secret) | API 형식 검증 → RPC: 공개 글 존재·분당 30·일 1회 | `post_views.count` |
| 크론 | Vercel Cron | service_role | `CRON_SECRET` Bearer [확인] | 정리 삭제, `backups/` 쓰기 |
| 관리자 추가 | SQL 에디터 | postgres | private 스키마 | `private.admins` |

secret key는 **조회수 POST와 크론 두 곳만**. 콘텐츠·미디어·방명록·차단은 모두 사용자 JWT.

---

## 8. 방명록·인증 상세 (v2 유지, 변경점만)

### 8.1 인증 흐름 변경점
- v2 §8.1 그대로: allow list(정확한 운영·로컬 경로 + 본인 슬러그 프리뷰 패턴), 환경별 절대 origin, 두 콜백 URL 구분, `proxy.ts`(`getClaims`), 액션은 `getUser()`, 취소/누락/실패 분기.
- **로그인 후 목적지**: `next`를 **고정 허용 목록 `{'/guestbook', '/admin'}`** 중 하나만 인정(그 외·외부 URL·`//`·프로토콜 상대 → `/guestbook`).
- `/admin/layout.tsx` 게이트: `getUser()` 실패 → `/admin/login`. 성공했지만 `is_admin()` false → **404**. 모든 `/admin` 서버 액션은 `requireAdmin()`을 첫 줄에서 다시 호출.

### 8.2~8.4 작성·제한·필터 — v2 그대로 (+ `USER_BLOCKED` → "이 계정은 방명록을 이용할 수 없어요").

### 8.5 모더레이션 콘솔 `/admin/guestbook`
| 기능 | 동작 |
|---|---|
| 목록 | 테이블(작성자·아바타·메시지·시각·상태), 필터 전체/공개/숨김, 사용자 검색, 20개 커서 |
| 숨기기/복원 | `guestbook_set_hidden`, `revalidatePath('/')`·`/guestbook` |
| 삭제 | RLS DELETE(관리자), 인라인 확인 |
| 사용자 차단 | `admin_block_user(user_id, reason, hide_all)` → 이후 작성 `USER_BLOCKED`. 옵션 "이 사용자의 글 모두 숨기기" |
| 차단 해제·목록 | `admin_unblock_user`, `admin_list_blocked` |
| 방명록 페이지 내 | v2와 같이 카드 메뉴 숨기기/보이기/삭제 + "관리 콘솔" 링크 |

### 8.6 화면 상태 — v2 표 유지. 8.7 조회수 API — v2 유지, slug 존재 검사는 DB(§7.7).

---

## 8A. 관리자 에디터 설계

### 8A.1 글 에디터 `/admin/posts/[id]`
- 2패널: 좌 **CodeMirror Markdown**(툴바: 굵게·기울임·링크·이미지 삽입(MediaPicker/업로드)·코드 블록(언어)·`:::callout`·`::youtube`·수식) / 우 **미리보기**(서버 액션 `previewMarkdown(md)`, 디바운스 800ms, 공개 페이지와 같은 스타일). 모바일은 탭 전환.
- 메타: 제목, **slug**(영문 필수; 비어 있으면 `post-YYYYMMDD-xxxx` 제안, **발행 후 잠금**), 설명(≤200), 태그(최대 5, 자동완성), 언어, featured, 커버, 발행일(`published_at`, 기본 발행 시각·과거 조정 가능·미래는 2차 "예약"이라 경고), 상태.
- 버튼: `초안 저장` / `발행` / `초안으로 되돌리기` / `휴지통` / `미리보기 새 탭`.
- 안전장치: 30초 자동 초안 저장(서버), `localStorage` 임시 복사, 이탈 경고, `updated_at` 낙관적 충돌 검사.
- 저장 파이프라인(`savePost`): `requireAdmin()` → zod → slug 중복 친절 메시지 → `compileMarkdown(md)` → `{html, toc, reading_minutes}` → UPDATE/INSERT(관리자 JWT, RLS) → `revalidatePath` 목록 → 반환. 실패 시 저장하지 않음.
- Markdown 파일 가져오기: `.md` 업로드 → frontmatter는 메타, 본문은 에디터로.

### 8A.2 지원 문법 (`lib/markdown`)
| 문법 | 결과 |
|---|---|
| GFM(표·체크박스·취소선·각주) | 표준 HTML |
| ` ```python title="train.py" {3-5} ` | shiki 하이라이트, 파일명, 라인 강조, 복사 버튼(클라이언트 주입) |
| `$...$`, `$$...$$` | KaTeX HTML(수식 있는 글만 CSS 로드) |
| `:::callout{type="info" title="참고"} … :::` | Callout(info/warn/tip) |
| `::youtube{id="..."}` | 클릭 시 iframe 로드 플레이스홀더 |
| `![alt](media-url)` | `media`에서 width/height 조회 → `<img width height loading="lazy">`. 외부 URL은 크기 없이 허용 + 경고 |
| `:::figure{caption="..."} ![..](..) :::` | figure/figcaption |
| raw HTML, `<script>`, 이벤트 속성 | **제거**(sanitize) |

### 8A.3 사이트 콘텐츠 에디터 `/admin/site`
탭별 폼(zod): 히어로(문구, 아바타), 소개(Markdown 에디터), 타임라인(행 추가·삭제·순서), 관심 분야, 현재, 스택(아이콘 키 검색), 사진 스트립(업로드·순서·alt 필수·회전). 저장 → `site_content` upsert → `/`·`/about` 재검증.

### 8A.4 미디어 `/admin/media`
드래그·다중 업로드(5MB, 이미지) → 브라우저에서 Storage 직접 업로드(`uploads/YYYY/MM/<uuid>.<ext>`) → 서버 액션 `registerMedia(path)`가 객체를 fetch해 `image-size`로 크기 계산 후 `media` 행 생성. 목록·검색·사용 여부(본문/커버/사진 참조)·삭제(참조 있으면 경고).

### 8A.5 대시보드 `/admin`
글·프로젝트 수(공개/초안), 총 조회수·상위 5, 최근 방명록 5(숨김 포함), 차단 수, 마지막 크론 실행(`private.cron_runs` → `admin_status()` RPC), "캐시 새로고침".

---

## 9. 콘텐츠 워크플로 (v3)
1. `/admin/posts/new` → 작성 → `초안 저장` → 미리보기 → `발행`.
2. 발행 즉시 `/`, `/blog`, `/blog/<slug>`, RSS, sitemap, OG 재검증. 재배포 불필요.
3. 수정 → 저장 → 재검증. 휴지통 → 공개 404 + 목록 제외 + 재검증. 영구 삭제는 휴지통에서.
4. 코드 배포(`git push`)는 디자인·기능 변경 시에만.
5. 초기 이관 없음(기존 글 없음). 원하면 `scripts/import-markdown.mjs`로 일괄 초안 등록.

v2의 "slug 유일성·날짜 정규화·draft 단일 진입점"은 DB 제약(unique·check)과 RLS로 대체. 목차와 헤딩 ID는 **같은 컴파일 실행**에서 생성·저장되므로 항상 일치.

---

## 10. SEO · 성능 · 접근성
- SEO: 루트 canonical 없음, 페이지별 canonical, 프리뷰 `noindex`, `generateMetadata` DB 조회(ISR), OG `next/og`(async params [확인]), sitemap/RSS는 공개 글만, JSON-LD, `lang`.
- 성능(Lighthouse 모바일 Perf ≥ 90): 공개 페이지는 ISR 캐시 히트. 본문 HTML은 저장 시 생성. shiki·KaTeX·unified는 **관리자 저장 경로에서만 로드**(`lib/markdown`은 `admin/**/actions.ts`에서만 import, ESLint `no-restricted-imports` 강제). 이미지 `next/image` + Storage remotePatterns + 저장된 크기. CodeMirror는 `/admin` 번들에만.
- 접근성: v2 체크리스트 + 관리자 폼 라벨·오류 `aria-describedby`, 툴바 키보드 접근, 테이블 헤더 스코프, 드래그 순서에 키보드 대안.

---

## 11. 배포 · 운영

### 11.1 환경변수
| 변수 | 노출 | 사용처 |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 클라이언트 | canonical·OG·운영 origin |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 클라이언트 | 모든 클라이언트(RLS) — 콘텐츠 읽기·관리자 쓰기·Storage 업로드 |
| `SUPABASE_SECRET_KEY` | 서버 전용(Sensitive) | `/api/views` POST, `/api/cron/daily`만 |
| `CRON_SECRET`, `VIEW_HASH_SECRET` | 서버 전용 | 크론 검증, 방문자 해시 솔트 |
| `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL` | 자동 | 환경별 origin·noindex |
DB 변수가 없으면 빌드는 성공해야 하며(빌드 중 DB 호출은 try/catch), 공개 페이지는 fallback 셸을 캐시한다.

### 11.2 절차
P0 GitHub·Vercel 첫 배포(DB 없음) → P1 Supabase 프로젝트(서울)·`0001`·`0002`·seed·`private` 미노출 확인·키 등록·GitHub/Google OAuth·Redirect URLs·**첫 로그인 후 본인 UUID를 `private.admins`에 등록**(README) → P6 도메인(현재 사용 여부 확인 → Domains 화면 권장값 [확인] → www 리다이렉트 → SSL) → Search Console.

### 11.3 keepalive·장애·복구 (v2 유지)
Hobby 크론 1일 1회·±59분·best effort [확인] → 보조 수단. 일시정지 시 캐시된 공개 페이지는 유지, `/admin`·`/guestbook`·캐시 미보유 페이지는 안내/오류. 수동 해제 후 "캐시 새로고침".

### 11.4 백업·복원 (중요도 상승)
콘텐츠가 DB에만 있으므로 **주 1회 자동 백업**: `/api/cron/daily`가 월요일 실행 시 `posts`·`projects`·`site_content`·`media` 메타를 JSON으로 직렬화해 비공개 버킷 `backups/`에 저장(최근 8개 보관, 멱등: 같은 주 파일명 덮어쓰기). 이미지 원본은 Storage 자체가 저장소. 복원: SQL 에디터에서 JSON → `insert`(README 절차), 2차에 `/admin` 가져오기 UI. 방명록은 월 1회 CSV.

### 11.5 무료 티어 한도
Supabase DB 500MB · Storage 1GB · egress 5GB/월 · MAU 50k · 활성 프로젝트 2 · 자동 백업 없음 [확인]. 이미지 ≤ 5MB/장(WebP 권장). Vercel Hobby 비상업·크론 1일 1회. Web Analytics Hobby 이벤트 한도(가정).

---

## 12. 마일스톤과 완료 기준

선행: **P0 → P1(DB·인증·관리자 게이트) → P2(파이프라인·에디터) → P3(공개 블로그·조회수) → P4(홈·About·프로젝트) → [G1 공개 가능] → P5(방명록·모더레이션) → P6(마감·도메인)**. 검증 항목은 향후 완료 기준(아직 실행되지 않음).

### P0 기반 ★★
`create-next-app@latest`(정확 버전·lockfile), `.nvmrc`/`engines`, ESLint flat·Prettier·scripts, 토큰(임시 A)·폰트·`next-themes`·shadcn, `SiteHeader/MobileNav/SiteFooter`, `site-config.ts`(fallback 문구)·`site-url.ts`, 루트 metadata·`not-found`·`error`, GitHub·Vercel **DB 없이 첫 배포**.
**DoD**: 프리뷰에서 셸·다크모드·시트 동작, `npm run check` 통과, 레이아웃 cookies 미사용, 프리뷰 noindex.

### P1 Supabase·인증·관리자 게이트 ★★★
- 1a 스키마: `0001_init.sql`(§7), `0002_storage.sql`, seed, `private` 미노출, `db:types`, 클라이언트 4종, `admin.ts` import 제한 lint.
- 1b 인증: `proxy.ts`(matcher 3개), `/auth/callback`(허용 목록 `next`), `/auth/signout`, `signInWith`, GitHub/Google 설정, Redirect URLs, identity_data 키 확인.
- 1c 게이트: `/admin/layout.tsx`, `/admin/login`, `requireAdmin()`, 빈 대시보드, 본인 UUID 등록.
- 1d 하네스: 테스트용 Supabase 프로젝트, `tests/db`(anon·일반·관리자 JWT 3종), 크론 라우트.
**DoD**: 관리자 `/admin` 진입, 일반 사용자 404, 비로그인 로그인 페이지. `tests/db`: 일반 사용자 `posts` INSERT 거부·초안 SELECT 0행, anon `private.*` 불가, 크론 헤더 없으면 401.

### P2 마크다운 파이프라인·글 에디터 ★★★
- 2a `lib/markdown/compile.ts`(§8A.2 전 문법, sanitize, shiki 코어, image-dims) + `tests/unit` 픽스처(중복 제목 헤딩·한글·인라인 코드 헤딩·raw HTML/script 제거·디렉티브).
- 2b 글 CRUD 서버 액션(`savePost/publish/unpublish/trash/restore/destroy/previewMarkdown`), zod, slug, 재검증 목록.
- 2c 에디터 UI(CodeMirror, 미리보기, 메타, 자동 저장, 이탈 경고, 충돌 검사), 글 목록, 휴지통, 미리보기 페이지.
- 2d 미디어: Storage 업로드, `registerMedia`, MediaPicker, `/admin/media`, 버킷 옵션 가정 확인.
**DoD**: 브라우저만으로 작성→이미지→미리보기→발행→수정→휴지통→복원. 컴파일 결과에 raw HTML/script 없음. 일반 사용자 JWT로 Storage 업로드·`media` INSERT 거부. 목차 링크가 헤딩 id와 일치.

### P3 공개 블로그·조회수 ★★
- 3a `/blog`, `/blog/[slug]`(ISR·dynamicParams·notFound), `TagFilter`, `FeaturedPosts`, 클라이언트 아일랜드 4종, 이전/다음.
- 3b `rss.xml`, `sitemap.ts`, `robots.ts`, OG(글).
- 3c 조회수: `/api/views`, `visitor-hash.ts`, `ViewCounter`, 목록 일괄 조회.
- 3d 재검증·장애 확인: 발행/수정/휴지통 후 즉시 갱신, DB 변수 제거 상태에서 캐시된 글 지속 서빙(가정 검증).
**DoD**: 초안 URL 404, 발행 직후 반영, 조회수 매트릭스, 공개 응답에 `content_md` 없음.

### P4 홈·About·프로젝트 + 에디터 ★★
4a `/admin/site` 탭 전부 + 저장·재검증. 4b `/admin/projects` CRUD. 4c 공개 `/`, `/about`, `/projects`, `/projects/[slug]`(ISR, fallback). 4d 사진 스트립 실사진 업로드.
**DoD**: 홈·About·프로젝트 전부 `/admin`에서 편집·즉시 반영, DB 변수 없이 빌드 + 홈 fallback 셸, Lighthouse Perf ≥ 90 / a11y ≥ 95.

### 관문 G1: 공개 가능
홈·About·블로그·프로젝트 공개, 관리자가 모든 콘텐츠를 사이트에서 관리, 매트릭스 "직접 DB 접근(콘텐츠)"·"캐시"·"콘텐츠" 통과. 도메인 연결 가능.

### P5 방명록·모더레이션 ★★★
5a 공개 방명록(v2 §8) + `USER_BLOCKED`. 5b 카드 메뉴 + `/admin/guestbook` 콘솔(차단). 5c 홈 `GuestbookCard`. 5d `tests/db`: v2 매트릭스 + 차단 사용자 거부 + 비관리자 `admin_block_user` FORBIDDEN. 실제 GitHub·Google 로그인은 수동 체크리스트(`tests/manual/oauth.md`).
**DoD**: 매트릭스 통과, 사이트에서 숨김·삭제·차단, 숨김 글이 홈·공개 응답에 없음.

### P6 마감·도메인 ★★
canonical, OG(프로젝트·기본), JSON-LD, 번들 점검(공개 서버 번들에 shiki/unified/CodeMirror 부재), 404/에러 디자인, 주간 백업 크론, README, 도메인·DNS·HTTPS·Search Console·Analytics.
**DoD**: `https://gilhyeon.com` 정상, OG 카드, Lighthouse, CI 녹색, 백업 파일 생성 확인.

### P7~ (2차)
Toolbox·Changelog·Stats(+에디터) → 링크 미리보기 → 한/영 전환 → 리액션 → slug 리다이렉트 이력 → 글 버전 기록 → 예약 발행 → 백업 가져오기 UI → 미디어 전체 내려받기.

### 검증 기준 매트릭스 (향후 완료 기준)
| 영역 | 완료 기준 | Phase |
|---|---|---|
| 직접 DB 접근(콘텐츠) | 일반 사용자 JWT로 `posts/projects/site_content/media` INSERT·UPDATE·DELETE 거부, 초안·휴지통 SELECT 0행, Storage 업로드 거부. anon은 공개 행만 | P1, P2 |
| 직접 DB 접근(방명록) | v2 항목 전부 + 차단 사용자 RPC 거부 | P5 |
| 권한 | 비관리자 `guestbook_set_hidden`·`admin_block_user` FORBIDDEN, 자기 차단 불가, `/admin` 비관리자 404 | P1, P5 |
| 작성 제한 | 동시 10건 → 1 성공, 삭제 후 재작성 거부, 59초 거부/60초 허용, 5/6번째, 임의 created_at 불가 | P5 |
| 조회수 | 임의/초안 slug 404·행 미생성, RPC 직접 호출 차단, 동시 20회 → 1 증가, 분당 31회째 미집계 | P3 |
| 캐시 | 숨김 글·초안이 홈·공개 응답·RSS·sitemap에 없음, `/guestbook`·`/admin` no-store, 공개 ISR 헤더, 저장 후 즉시 재검증 | P3~P5 |
| 콘텐츠 | slug 중복 저장 오류 메시지, sanitize(raw HTML·script 제거), 목차 id 일치, 공개 응답에 `content_md` 없음 | P2, P3 |
| 장애 | DB 변수 없이 빌드 성공, 캐시된 공개 페이지 지속 서빙(가정 검증), 동적 카드 fallback, `/guestbook`·`/admin` 안내 | P3, P4 |
| 인증 | 허용 목록 외 `next` 거부, 취소/실패/만료 처리, 실제 GitHub·Google 로그인(운영·프리뷰·로컬) | P1, P5 |
| 배포 | `npm run check` + e2e 통과, Node 24 일치, lockfile, 공개 번들에 에디터·컴파일러 부재 | P0~P6 |

---

## 13. 리스크와 열린 질문

### 13.1 리스크 (v3 추가·변경 위주)
| 리스크 | 영향 | 대응 |
|---|---|---|
| **DB 의존도**: 일시정지·장애 시 캐시 미보유 페이지 오류 | 가용성 | 긴 ISR + on-demand 재검증, keepalive, 주간 백업, `error.tsx`. 정적 보장은 v2보다 약함(사용자 수용) |
| 작업량 증가 | 일정 | P2·P4 하위 분할, WYSIWYG 배제, shadcn 폼 재사용 |
| ISR 재생성 실패 시 stale 유지 여부 | 장애 동작 | 가정 → P3d 검증, 다르면 자체 캐시 레이어 검토 |
| sanitize 누락 | 자기 XSS | 허용 목록 테스트 픽스처, raw HTML 비허용 |
| shiki·KaTeX 서버 번들 | 콜드스타트 | 코어 번들·언어 제한, 관리자 액션 경로에만 import(lint) |
| Storage 정책·버킷 옵션 가정 | 업로드 실패 | P2d 확인 |
| 한글 제목 slug | UX | 수동 slug + 기본값 제안, 발행 후 잠금 |
| 관리자 계정 탈취 | 전체 콘텐츠 변경 | 2FA 권장, 매 액션 `getUser()`, 휴지통·주간 백업 |
| `next` 파라미터 | 오픈 리다이렉트 | 허용 목록 2개 |
| v2 리스크(identity_data, Google 검증, NAT 조회수, 링크 오탐, Windows, Next 16 API) | — | v2 대응 유지 |

### 13.2 열린 질문 (사용자 결정)
1. 컬러 후보 A/B/C. 2. 표시 이름. 3. 커피챗 링크 형태. 4. 홈 블로그 3개 유지. 5. 도메인 등록기관·현재 사용 여부.
6. **본문 형식**: Markdown + 디렉티브(채택)로 충분한지, 임의 JSX(MDX 런타임 평가)가 꼭 필요한지. 후자는 비추천.
7. 에디터: CodeMirror 텍스트 에디터(채택) vs WYSIWYG(Tiptap).

### 13.3 사용자가 제공해야 하는 항목
사진(초상권 확인), 소개·타임라인·관심 분야·현재 카드 문안(에디터에서 직접 입력 가능), 프로젝트 목록, GitHub OAuth App·Google Cloud·Supabase·Vercel 계정, 도메인 등록기관 접근, P1c 후 본인 UUID. 비밀값은 대시보드에만 입력.

---

## 14. 공식 문서 확인 기록

v2 표(2026-09-30, 17건) 유효: Supabase RLS·함수 권한·SSR 클라이언트·SSR 고급·Redirect URLs·Google·API 키·요금, Next.js 16 업그레이드·MDX 가이드, next-mdx-remote 아카이브, rehype-extract-toc, Velite, Vercel 도메인·크론 한도·크론 관리·Node 버전. v3 추가:

| 주제 | URL | 확인 내용 |
|---|---|---|
| Supabase Storage 접근 제어 | https://supabase.com/docs/guides/storage/security/access-control | 정책 없으면 업로드 불가, `storage.objects`에 `for insert to authenticated with check (bucket_id = … and (storage.foldername(name))[1] = …)`, 공개 읽기 정책 예시. 파일 크기·MIME·public 설정은 이 페이지에 없음 |

### 미확인 가정 (v3)
- `storage.buckets`의 `file_size_limit`/`allowed_mime_types` 컬럼명과 public 버킷 GET이 정책 없이 허용되는지.
- ISR 재생성 실패 시 마지막 성공 캐시 유지(Vercel).
- `rehype-extract-toc`·`rehype-pretty-code`·`rehype-sanitize`·`remark-directive` 최신 버전 조합 호환.
- `image-size`의 WebP/AVIF 판독(불가 시 `sharp`).
- v2 가정 유지(identity_data 키, Supabase 미사용 기준, Google 심사, Analytics 한도).

---

## 15. 변경 요약 (v2 → v3)

| # | 요청/문제 | v3 설계 | 영향 섹션 |
|---|---|---|---|
| 1 | 사이트 안에서 콘텐츠를 쉽게 수정 | `/admin`: 글·프로젝트·소개·홈 카드·사진 편집, 이미지 업로드, 초안·미리보기·휴지통, 대시보드 | §0, 2.4, 3, 8A, 12 |
| 2 | 콘텐츠 저장 위치 | 저장소 MDX → Supabase `posts/projects/site_content/media`, RLS `is_admin()` 쓰기, unique/check 제약 | §7.3~7.5, 9 |
| 3 | 본문 컴파일 | 빌드 타임 `@next/mdx` → 저장 시 `unified` 런타임 컴파일 + sanitize, Markdown + 디렉티브(JSX 없음) | §5, 8A.2 |
| 4 | 공개 페이지 렌더 | 완전 정적 → ISR + on-demand 재검증, DB 장애 시 캐시 유지(가정) | §2.1, 13.1 |
| 5 | 방명록 관리 강화 | 모더레이션 콘솔, `private.blocked_users` + 차단 RPC, 작성 시 차단 검사 | §7.6, 8.5 |
| 6 | 조회수 slug 검증 | 파일 목록 → DB `posts` 공개 여부를 RPC에서 검사 | §7.7 |
| 7 | 로그인 목적지 | `/guestbook` 고정 → 허용 목록 `{/guestbook, /admin}` | §8.1 |
| 8 | 백업 | 월 1회 수동 → 주 1회 자동 JSON(비공개 버킷) + 방명록 월 1회 | §11.4 |
| 9 | 마일스톤 | 정적 우선 → DB·인증·게이트(P1) → 에디터(P2) → 공개(P3~4) → G1 → 방명록(P5) | §12 |
| 10 | 이미지 | `public/images` + 매니페스트 → Storage + `media` 크기 기록 | §7.3, 7.5, 8A.4 |

---

## 승인 전 확인할 사항
1. **본문 형식**: Markdown + 디렉티브(코드·수식·콜아웃·YouTube·그림) 채택, 임의 JSX(MDX) 제외 — 동의 여부.
2. 에디터는 CodeMirror 기반 Markdown 텍스트 에디터 + 실시간 미리보기. WYSIWYG 선호 시 알려주기.
3. DB 장애 시 캐시 미보유 페이지가 오류가 될 수 있는 트레이드오프 수용 여부(§0, §13.1).
4. 이미지 저장소로 Supabase Storage(무료 1GB, 5MB/장) 사용 동의.
5. §13.2 열린 질문 1~5.
6. **승인 = 계획 확정.** 구현은 "구현 시작" 지시 후 P0부터. 승인 직후 동작은 이 문서를 레포 루트 `plan.md`로 동기화하는 것만.

### 지시서 §5 항목 자체 점검
1 개요 §1 ✅ · 2 IA §2 ✅ · 3 페이지 설계 §3·§2.4 ✅ · 4 디자인 §4 ✅ · 5 스택 §5 ✅ · 6 디렉터리 §6 ✅ · 7 데이터 모델·RLS §7 ✅ · 8 방명록 §8 ✅(+관리자 에디터 §8A) · 9 워크플로 §9 ✅ · 10 SEO·성능·접근성 §10 ✅ · 11 배포 §11 ✅ · 12 마일스톤 §12 ✅ · 13 리스크 §13 ✅ · 문서 확인 §14 ✅ · 변경 요약 §15 ✅
