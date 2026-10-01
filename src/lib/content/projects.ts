import { createPublicSupabase } from "@/lib/supabase/public";
import type { ProjectRow } from "@/lib/supabase/types";

export type ProjectSummary = Pick<
  ProjectRow,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "type"
  | "tech"
  | "links"
  | "featured"
  | "work_status"
  | "sort_date"
> & {
  thumbnail: { url: string; width: number | null; height: number | null } | null;
  has_body: boolean;
};
export type ProjectDetail = Omit<ProjectRow, "content_md"> & {
  thumbnail: ProjectSummary["thumbnail"];
};

const SUMMARY =
  "id,slug,title,summary,type,tech,links,featured,work_status,sort_date,thumbnail:media(url,width,height),content_html";
const DETAIL =
  "id,slug,title,summary,content_html,toc,type,tech,links,thumbnail_media_id,featured,work_status,status,sort_date,deleted_at,created_at,updated_at,thumbnail:media(url,width,height)";

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
    if (error) throw error;
    return { ok: true, data: data as T };
  } catch (e) {
    console.error("[projects] query failed:", e);
    return { ok: false, data: null, reason: "error" };
  }
}

export async function getPublishedProjects(limit = 100): Promise<Result<ProjectSummary[]>> {
  const r = await run<(Omit<ProjectSummary, "has_body"> & { content_html: string })[]>((sb) =>
    sb
      .from("projects")
      .select(SUMMARY)
      .order("featured", { ascending: false })
      .order("sort_date", { ascending: false })
      .limit(limit),
  );
  if (!r.ok) return r;
  return {
    ok: true,
    data: r.data.map(({ content_html, ...p }) => ({
      ...p,
      has_body: content_html.trim().length > 0,
    })),
  };
}

export function getProjectBySlug(slug: string) {
  return run<ProjectDetail | null>((sb) =>
    sb.from("projects").select(DETAIL).eq("slug", slug).maybeSingle(),
  );
}
