"use server";

import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/guard";
import { projectInputSchema, type ProjectInput } from "@/lib/admin/schemas";
import { compileMarkdown } from "@/lib/markdown/compile";
import { extractImageUrls } from "@/lib/markdown/reading-time";
import { revalidateProject } from "@/lib/content/revalidate";
import type { MediaRow, ProjectRow } from "@/lib/supabase/types";

export type ProjectSaveResult =
  | {
      ok: true;
      id: string;
      slug: string;
      status: ProjectRow["status"];
      updated_at: string;
      warnings: string[];
    }
  | { ok: false; error: string; message: string; fields?: Record<string, string> };

const NIL = "00000000-0000-0000-0000-000000000000";

export async function saveProject(input: ProjectInput): Promise<ProjectSaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok)
    return {
      ok: false,
      error: auth.error,
      message: auth.error === "SESSION_EXPIRED" ? "세션이 만료됐어요." : "권한이 없어요.",
    };
  const { supabase } = auth.ctx;
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] = i.message;
    return { ok: false, error: "VALIDATION", message: "입력값을 확인해 주세요.", fields };
  }
  const v = parsed.data;
  const dup = await supabase
    .from("projects")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", v.id ?? NIL)
    .maybeSingle();
  if (dup.data)
    return {
      ok: false,
      error: "SLUG_TAKEN",
      message: "이미 사용 중인 slug예요.",
      fields: { slug: "이미 사용 중인 slug예요." },
    };

  const images = new Map<string, { width: number; height: number }>();
  const urls = extractImageUrls(v.content_md);
  if (urls.length) {
    const { data } = await supabase.from("media").select("url,width,height").in("url", urls);
    for (const m of (data ?? []) as Pick<MediaRow, "url" | "width" | "height">[])
      if (m.width && m.height) images.set(m.url, { width: m.width, height: m.height });
  }
  const compiled = v.content_md.trim()
    ? await compileMarkdown(v.content_md, { images })
    : { html: "", toc: [], warnings: [] as string[] };
  const links = Object.fromEntries(Object.entries(v.links).filter(([, val]) => val));
  const row = {
    slug: v.slug,
    title: v.title,
    summary: v.summary,
    content_md: v.content_md,
    content_html: compiled.html,
    toc: compiled.toc,
    type: v.type,
    tech: v.tech,
    links,
    thumbnail_media_id: v.thumbnail_media_id,
    featured: v.featured,
    work_status: v.work_status,
    status: v.status,
    sort_date: v.sort_date,
  };

  let previousSlug: string | undefined;
  let res;
  if (v.id) {
    const cur = await supabase
      .from("projects")
      .select("slug,updated_at")
      .eq("id", v.id)
      .maybeSingle();
    if (!cur.data) return { ok: false, error: "NOT_FOUND", message: "프로젝트를 찾을 수 없어요." };
    if (v.expected_updated_at && cur.data.updated_at !== v.expected_updated_at)
      return {
        ok: false,
        error: "CONFLICT",
        message: "다른 곳에서 먼저 수정됐어요. 새로 고침 후 다시 시도해 주세요.",
      };
    previousSlug = cur.data.slug;
    res = await supabase
      .from("projects")
      .update(row)
      .eq("id", v.id)
      .select("id,slug,status,updated_at")
      .single();
  } else {
    res = await supabase.from("projects").insert(row).select("id,slug,status,updated_at").single();
  }
  if (res.error) return { ok: false, error: "DB", message: res.error.message };
  revalidateProject(res.data.slug, previousSlug);
  return {
    ok: true,
    id: res.data.id,
    slug: res.data.slug,
    status: res.data.status,
    updated_at: res.data.updated_at,
    warnings: compiled.warnings,
  };
}

async function patchProject(id: string, p: Partial<ProjectRow>): Promise<ProjectSaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error, message: "권한이 없어요." };
  if (!z.string().uuid().safeParse(id).success)
    return { ok: false, error: "VALIDATION", message: "잘못된 id" };
  const res = await auth.ctx.supabase
    .from("projects")
    .update(p)
    .eq("id", id)
    .select("id,slug,status,updated_at")
    .single();
  if (res.error) return { ok: false, error: "DB", message: res.error.message };
  revalidateProject(res.data.slug);
  return {
    ok: true,
    id: res.data.id,
    slug: res.data.slug,
    status: res.data.status,
    updated_at: res.data.updated_at,
    warnings: [],
  };
}
export async function publishProject(id: string) {
  return patchProject(id, { status: "published" });
}
export async function unpublishProject(id: string) {
  return patchProject(id, { status: "draft" });
}
export async function trashProject(id: string) {
  return patchProject(id, { deleted_at: new Date().toISOString(), status: "draft" });
}
export async function restoreProject(id: string) {
  return patchProject(id, { deleted_at: null });
}

export async function destroyProject(id: string): Promise<ProjectSaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, error: auth.error, message: "권한이 없어요." };
  const res = await auth.ctx.supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id,slug,status,updated_at")
    .maybeSingle();
  if (res.error) return { ok: false, error: "DB", message: res.error.message };
  if (!res.data)
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "휴지통에 있는 프로젝트만 영구 삭제할 수 있어요.",
    };
  revalidateProject(res.data.slug);
  return {
    ok: true,
    id: res.data.id,
    slug: res.data.slug,
    status: res.data.status,
    updated_at: res.data.updated_at,
    warnings: [],
  };
}
