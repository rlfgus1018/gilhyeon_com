import { createPublicSupabase } from "@/lib/supabase/public";
import type { PostRow } from "@/lib/supabase/types";

/** 공개 목록용 컬럼 (content_md·content_html 제외) */
export type PostSummary = Pick<
  PostRow,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "tags"
  | "lang"
  | "featured"
  | "published_at"
  | "reading_minutes"
> & {
  cover: { url: string; width: number | null; height: number | null } | null;
};
export type PostDetail = Omit<PostRow, "content_md"> & { cover: PostSummary["cover"] };

const SUMMARY_COLS =
  "id,slug,title,description,tags,lang,featured,published_at,reading_minutes,cover:media(url,width,height)";
const DETAIL_COLS =
  "id,slug,title,description,content_html,toc,reading_minutes,tags,lang,featured,status,published_at,cover_media_id,deleted_at,created_at,updated_at,cover:media(url,width,height)";

type Result<T> =
  { ok: true; data: T } | { ok: false; data: null; reason: "unconfigured" | "error" };

async function run<T>(
  fn: (
    sb: NonNullable<ReturnType<typeof createPublicSupabase>>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<Result<T>> {
  const sb = createPublicSupabase();
  if (!sb) return { ok: false, data: null, reason: "unconfigured" };
  try {
    const { data, error } = await fn(sb);
    if (error) {
      console.error("[content] query failed:", error.message);
      return { ok: false, data: null, reason: "error" };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    console.error("[content] query threw:", e);
    return { ok: false, data: null, reason: "error" };
  }
}

/** 공개 글 목록 (RLS가 published·미삭제·published_at ≤ now 보장) */
export function getPublishedPosts(limit = 200) {
  return run<PostSummary[]>((sb) =>
    sb.from("posts").select(SUMMARY_COLS).order("published_at", { ascending: false }).limit(limit),
  );
}

export function getPostBySlug(slug: string) {
  return run<PostDetail | null>((sb) =>
    sb.from("posts").select(DETAIL_COLS).eq("slug", slug).maybeSingle(),
  );
}

/** 이전/다음 공개 글 */
export async function getAdjacentPosts(publishedAt: string) {
  const [prev, next] = await Promise.all([
    run<Pick<PostRow, "slug" | "title">[]>((sb) =>
      sb
        .from("posts")
        .select("slug,title")
        .lt("published_at", publishedAt)
        .order("published_at", { ascending: false })
        .limit(1),
    ),
    run<Pick<PostRow, "slug" | "title">[]>((sb) =>
      sb
        .from("posts")
        .select("slug,title")
        .gt("published_at", publishedAt)
        .order("published_at", { ascending: true })
        .limit(1),
    ),
  ]);
  return {
    prev: prev.ok ? (prev.data[0] ?? null) : null,
    next: next.ok ? (next.data[0] ?? null) : null,
  };
}

/** 조회수 일괄 조회 — 글 개수만큼 호출하지 않는다 */
export async function getViewCounts(slugs: string[]) {
  const map = new Map<string, number>();
  if (slugs.length === 0) return { ok: true as const, map };
  const r = await run<{ slug: string; count: number }[]>((sb) =>
    sb.from("post_views").select("slug,count").in("slug", slugs),
  );
  if (!r.ok) return { ok: false as const, map };
  for (const row of r.data) map.set(row.slug, Number(row.count));
  return { ok: true as const, map };
}

export function collectTags(posts: PostSummary[]) {
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}
