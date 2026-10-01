import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { ArticleBody } from "@/components/blog/article-body";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PostRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "미리보기" };

/** 초안 포함 미리보기 (관리자만). 공개 글 상세와 같은 본문 스타일을 쓴다. */
export default async function PreviewPostPage({ params }: PageProps<"/admin/preview/post/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as PostRow;
  return (
    <article className="mx-auto max-w-3xl">
      <div className="bg-amber-soft border-amber mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-2 text-sm">
        <span>미리보기 · {post.status === "published" ? "공개 글" : "초안"}</span>
        <Link href={`/admin/posts/${post.id}`} className="underline">
          편집으로
        </Link>
      </div>
      <header className="mb-8 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title || "(제목 없음)"}</h1>
        <p className="text-muted-foreground">{post.description}</p>
        <p className="text-muted-foreground text-sm">
          {formatDate(post.published_at ?? post.updated_at)} · {post.reading_minutes}분
        </p>
      </header>
      <ArticleBody html={post.content_html} />
    </article>
  );
}
