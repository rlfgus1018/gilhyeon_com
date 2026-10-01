import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/admin/guard";
import { ProjectRowActions } from "@/components/admin/project-row-actions";
import type { ProjectRow } from "@/lib/supabase/types";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "published", label: "공개" },
  { key: "draft", label: "초안" },
  { key: "trash", label: "휴지통" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];
type Row = Pick<
  ProjectRow,
  | "id"
  | "slug"
  | "title"
  | "status"
  | "type"
  | "work_status"
  | "sort_date"
  | "deleted_at"
  | "featured"
  | "content_html"
>;
const TYPE = { ai: "AI/ML", web: "Web", other: "기타" } as const;
const WORK = { done: "완료", wip: "진행 중", archived: "보관" } as const;

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.status) ? sp.status : "all") as Filter;
  const { supabase } = await requireAdminPage();
  let q = supabase
    .from("projects")
    .select("id,slug,title,status,type,work_status,sort_date,deleted_at,featured,content_html")
    .order("sort_date", { ascending: false })
    .limit(200);
  if (filter === "trash") q = q.not("deleted_at", "is", null);
  else {
    q = q.is("deleted_at", null);
    if (filter !== "all") q = q.eq("status", filter);
  }
  const { data, error } = await q;
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">프로젝트</h1>
          <p className="text-muted-foreground mt-1 text-sm">카드와 상세 페이지를 관리합니다.</p>
        </div>
        <Button render={<Link href="/admin/projects/new" />}>
          <PlusIcon aria-hidden /> 새 프로젝트
        </Button>
      </header>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/admin/projects" : `/admin/projects?status=${f.key}`}
            className={`rounded-full px-3 py-1 text-sm ${filter === f.key ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      {error ? (
        <p role="alert" className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm">
          {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          {filter === "trash" ? "휴지통이 비어 있어요." : "아직 프로젝트가 없어요."}
        </p>
      ) : (
        <ul className="card-surface divide-y overflow-hidden">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">
                  {p.title || "(제목 없음)"}
                </Link>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {TYPE[p.type]} · {WORK[p.work_status]} · {p.sort_date}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {p.featured && <Badge variant="outline">대표</Badge>}
                {p.deleted_at ? (
                  <Badge variant="destructive">휴지통</Badge>
                ) : p.status === "published" ? (
                  <Badge>공개</Badge>
                ) : (
                  <Badge variant="secondary">초안</Badge>
                )}
              </div>
              <ProjectRowActions
                id={p.id}
                slug={p.slug}
                status={p.status}
                trashed={!!p.deleted_at}
                hasBody={p.content_html.trim().length > 0}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
