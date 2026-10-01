import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin/guard";
import { ProjectEditor } from "@/components/admin/project-editor";
import type { MediaRow, ProjectRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "프로젝트 편집" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as ProjectRow;
  const thumb = p.thumbnail_media_id
    ? await supabase.from("media").select("*").eq("id", p.thumbnail_media_id).maybeSingle()
    : { data: null };
  return (
    <ProjectEditor
      initial={{
        id: p.id,
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        content_md: p.content_md,
        type: p.type,
        tech: p.tech,
        links: { github: p.links.github ?? "", demo: p.links.demo ?? "", post: p.links.post ?? "" },
        thumbnail_media_id: p.thumbnail_media_id,
        featured: p.featured,
        work_status: p.work_status,
        status: p.status,
        sort_date: p.sort_date,
        updated_at: p.updated_at,
      }}
      initialHtml={p.content_html}
      trashed={!!p.deleted_at}
      thumbnail={(thumb.data as MediaRow | null) ?? null}
    />
  );
}
