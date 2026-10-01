"use server";

import { z } from "zod";
import { requireAdminAction } from "@/lib/admin/guard";
import { postInputSchema, previewSchema, type PostInput } from "@/lib/admin/schemas";
import { compileMarkdown } from "@/lib/markdown/compile";
import { extractImageUrls } from "@/lib/markdown/reading-time";
import { revalidatePost } from "@/lib/content/revalidate";
import type { MediaRow, PostRow } from "@/lib/supabase/types";

export type ActionError = {
  ok: false;
  error:
    | "SESSION_EXPIRED"
    | "FORBIDDEN"
    | "UNAVAILABLE"
    | "VALIDATION"
    | "SLUG_TAKEN"
    | "CONFLICT"
    | "NOT_FOUND"
    | "DB";
  message: string;
  fields?: Record<string, string>;
};
export type SaveResult =
  | {
      ok: true;
      id: string;
      slug: string;
      status: PostRow["status"];
      updated_at: string;
      warnings: string[];
    }
  | ActionError;

const PREFIX = {
  SESSION_EXPIRED: "세션이 만료됐어요. 다시 로그인해 주세요.",
  FORBIDDEN: "권한이 없어요.",
  UNAVAILABLE: "데이터베이스에 연결할 수 없어요.",
} as const;

function guardError(e: keyof typeof PREFIX): ActionError {
  return { ok: false, error: e, message: PREFIX[e] };
}

async function imageDims(
  supabase: NonNullable<
    Awaited<ReturnType<typeof import("@/lib/supabase/server").createServerSupabase>>
  >,
  md: string,
) {
  const urls = extractImageUrls(md);
  const map = new Map<string, { width: number; height: number }>();
  if (urls.length === 0) return map;
  const { data } = await supabase.from("media").select("url,width,height").in("url", urls);
  for (const m of (data ?? []) as Pick<MediaRow, "url" | "width" | "height">[]) {
    if (m.width && m.height) map.set(m.url, { width: m.width, height: m.height });
  }
  return map;
}

/** 미리보기 컴파일 (저장하지 않음) */
export async function previewMarkdown(input: { content_md: string }) {
  const auth = await requireAdminAction();
  if (!auth.ok) return guardError(auth.error);
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "VALIDATION" as const, message: "본문이 너무 길어요." };
  const images = await imageDims(auth.ctx.supabase, parsed.data.content_md);
  const r = await compileMarkdown(parsed.data.content_md, { images });
  return {
    ok: true as const,
    html: r.html,
    toc: r.toc,
    hasMath: r.hasMath,
    warnings: r.warnings,
    readingMinutes: r.readingMinutes,
  };
}

/** 생성/수정 공통. 컴파일 → 저장 → 재검증. 실패 시 아무것도 저장하지 않는다. */
export async function savePost(input: PostInput): Promise<SaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return guardError(auth.error);
  const { supabase } = auth.ctx;

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fields[String(issue.path[0] ?? "form")] = issue.message;
    return { ok: false, error: "VALIDATION", message: "입력값을 확인해 주세요.", fields };
  }
  const v = parsed.data;

  // slug 중복 (자기 자신 제외)
  const dup = await supabase
    .from("posts")
    .select("id")
    .eq("slug", v.slug)
    .neq("id", v.id ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();
  if (dup.data)
    return {
      ok: false,
      error: "SLUG_TAKEN",
      message: "이미 사용 중인 slug예요.",
      fields: { slug: "이미 사용 중인 slug예요." },
    };

  const images = await imageDims(supabase, v.content_md);
  const compiled = await compileMarkdown(v.content_md, { images });

  const publishedAt =
    v.status === "published" ? (v.published_at ?? new Date().toISOString()) : v.published_at;
  const row = {
    slug: v.slug,
    title: v.title,
    description: v.description,
    content_md: v.content_md,
    content_html: compiled.html,
    toc: compiled.toc,
    reading_minutes: compiled.readingMinutes,
    tags: v.tags,
    lang: v.lang,
    featured: v.featured,
    status: v.status,
    published_at: publishedAt,
    cover_media_id: v.cover_media_id,
  };

  let saved: Pick<PostRow, "id" | "slug" | "status" | "updated_at"> | null = null;
  let previousSlug: string | undefined;

  if (v.id) {
    const current = await supabase
      .from("posts")
      .select("slug,updated_at,status")
      .eq("id", v.id)
      .maybeSingle();
    if (!current.data) return { ok: false, error: "NOT_FOUND", message: "글을 찾을 수 없어요." };
    if (v.expected_updated_at && current.data.updated_at !== v.expected_updated_at) {
      return {
        ok: false,
        error: "CONFLICT",
        message: "다른 곳에서 먼저 수정됐어요. 새로 고침 후 다시 시도해 주세요.",
      };
    }
    previousSlug = current.data.slug;
    const res = await supabase
      .from("posts")
      .update(row)
      .eq("id", v.id)
      .select("id,slug,status,updated_at")
      .single();
    if (res.error) return { ok: false, error: "DB", message: res.error.message };
    saved = res.data;
  } else {
    const res = await supabase
      .from("posts")
      .insert(row)
      .select("id,slug,status,updated_at")
      .single();
    if (res.error) return { ok: false, error: "DB", message: res.error.message };
    saved = res.data;
  }

  revalidatePost(saved.slug, previousSlug);
  return {
    ok: true,
    id: saved.id,
    slug: saved.slug,
    status: saved.status,
    updated_at: saved.updated_at,
    warnings: compiled.warnings,
  };
}

const idSchema = z.string().uuid();

async function updateById(id: string, patch: Partial<PostRow>): Promise<SaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return guardError(auth.error);
  if (!idSchema.safeParse(id).success)
    return { ok: false, error: "VALIDATION", message: "잘못된 id" };
  const res = await auth.ctx.supabase
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select("id,slug,status,updated_at")
    .single();
  if (res.error)
    return {
      ok: false,
      error: res.error.code === "PGRST116" ? "NOT_FOUND" : "DB",
      message: res.error.message,
    };
  revalidatePost(res.data.slug);
  return {
    ok: true,
    id: res.data.id,
    slug: res.data.slug,
    status: res.data.status,
    updated_at: res.data.updated_at,
    warnings: [],
  };
}

export async function publishPost(id: string) {
  return updateById(id, {
    status: "published",
    published_at: new Date().toISOString(),
  } as Partial<PostRow>);
}
export async function unpublishPost(id: string) {
  return updateById(id, { status: "draft" });
}
export async function trashPost(id: string) {
  return updateById(id, { deleted_at: new Date().toISOString(), status: "draft" });
}
export async function restorePost(id: string) {
  return updateById(id, { deleted_at: null });
}

/** 휴지통에서 영구 삭제 */
export async function destroyPost(id: string): Promise<SaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return guardError(auth.error);
  if (!idSchema.safeParse(id).success)
    return { ok: false, error: "VALIDATION", message: "잘못된 id" };
  const res = await auth.ctx.supabase
    .from("posts")
    .delete()
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select("id,slug,status,updated_at")
    .maybeSingle();
  if (res.error) return { ok: false, error: "DB", message: res.error.message };
  if (!res.data)
    return { ok: false, error: "NOT_FOUND", message: "휴지통에 있는 글만 영구 삭제할 수 있어요." };
  revalidatePost(res.data.slug);
  return {
    ok: true,
    id: res.data.id,
    slug: res.data.slug,
    status: res.data.status,
    updated_at: res.data.updated_at,
    warnings: [],
  };
}
