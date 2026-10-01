import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { PostEditor } from "@/components/admin/post-editor";
import { loadAllTags } from "@/lib/admin/queries";
import type { MediaRow, PostRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "글 편집" };

export default async function EditPostPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = data as PostRow;
  const [allTags, cover] = await Promise.all([
    loadAllTags(supabase),
    post.cover_media_id
      ? supabase.from("media").select("*").eq("id", post.cover_media_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return (
    <PostEditor
      initial={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        description: post.description,
        content_md: post.content_md,
        tags: post.tags,
        lang: post.lang,
        featured: post.featured,
        status: post.status,
        published_at: post.published_at,
        cover_media_id: post.cover_media_id,
        updated_at: post.updated_at,
      }}
      initialHtml={post.content_html}
      trashed={!!post.deleted_at}
      allTags={allTags}
      cover={(cover.data as MediaRow | null) ?? null}
    />
  );
}
