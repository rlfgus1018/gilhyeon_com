import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { ArticleBody } from "@/components/blog/article-body";
import { Badge } from "@/components/ui/badge";
import type { ProjectRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "프로젝트 미리보기" };

export default async function PreviewProjectPage({
  params,
}: PageProps<"/admin/preview/project/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as ProjectRow;
  return (
    <article className="mx-auto max-w-3xl">
      <div className="bg-amber-soft border-amber mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-2 text-sm">
        <span>미리보기 · {p.status === "published" ? "공개" : "초안"}</span>
        <Link href={`/admin/projects/${p.id}`} className="underline">
          편집으로
        </Link>
      </div>
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {p.tech.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{p.title || "(제목 없음)"}</h1>
        <p className="text-muted-foreground">{p.summary}</p>
      </header>
      {p.content_html ? (
        <ArticleBody html={p.content_html} />
      ) : (
        <p className="text-muted-foreground text-sm">본문이 없어 카드만 공개돼요.</p>
      )}
    </article>
  );
}
