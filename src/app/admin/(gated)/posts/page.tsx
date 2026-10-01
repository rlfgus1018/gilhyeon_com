import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/admin/guard";
import { formatDate } from "@/lib/utils";
import { PostRowActions } from "@/components/admin/post-row-actions";
import type { PostRow } from "@/lib/supabase/types";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "published", label: "공개" },
  { key: "draft", label: "초안" },
  { key: "trash", label: "휴지통" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

type Row = Pick<
  PostRow,
  | "id"
  | "slug"
  | "title"
  | "status"
  | "published_at"
  | "updated_at"
  | "deleted_at"
  | "tags"
  | "featured"
>;

export default async function AdminPostsPage({ searchParams }: PageProps<"/admin/posts">) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.status) ? sp.status : "all") as Filter;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const { supabase } = await requireAdminPage();

  let query = supabase
    .from("posts")
    .select("id,slug,title,status,published_at,updated_at,deleted_at,tags,featured")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (filter === "trash") query = query.not("deleted_at", "is", null);
  else {
    query = query.is("deleted_at", null);
    if (filter !== "all") query = query.eq("status", filter);
  }
  if (q) query = query.ilike("title", `%${q}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">글</h1>
          <p className="text-muted-foreground mt-1 text-sm">작성·발행·숨김을 관리합니다.</p>
        </div>
        <Button render={<Link href="/admin/posts/new" />}>
          <PlusIcon aria-hidden /> 새 글
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={{
              pathname: "/admin/posts",
              query: { ...(f.key !== "all" ? { status: f.key } : {}), ...(q ? { q } : {}) },
            }}
            className={`rounded-full px-3 py-1 text-sm ${filter === f.key ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          >
            {f.label}
          </Link>
        ))}
        <form className="ml-auto" action="/admin/posts">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="제목 검색"
            className="border-input bg-background h-8 rounded-lg border px-3 text-sm"
          />
        </form>
      </div>

      {error ? (
        <p role="alert" className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm">
          {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          {filter === "trash" ? "휴지통이 비어 있어요." : "아직 글이 없어요. 첫 글을 써볼까요?"}
        </p>
      ) : (
        <ul className="card-surface divide-y overflow-hidden">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/posts/${p.id}`} className="font-medium hover:underline">
                  {p.title || "(제목 없음)"}
                </Link>
                <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                  /blog/{p.slug}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {p.featured && <Badge variant="outline">피처드</Badge>}
                {p.deleted_at ? (
                  <Badge variant="destructive">휴지통</Badge>
                ) : p.status === "published" ? (
                  <Badge>공개</Badge>
                ) : (
                  <Badge variant="secondary">초안</Badge>
                )}
              </div>
              <p className="text-muted-foreground w-28 text-right text-xs">
                {formatDate(p.published_at ?? p.updated_at)}
              </p>
              <PostRowActions id={p.id} slug={p.slug} status={p.status} trashed={!!p.deleted_at} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
