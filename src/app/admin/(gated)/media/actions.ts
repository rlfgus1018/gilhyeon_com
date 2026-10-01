"use server";

import { z } from "zod";
import { imageSize } from "image-size";
import { requireAdminAction } from "@/lib/admin/guard";
import type { MediaRow } from "@/lib/supabase/types";

import { MEDIA_BUCKET } from "@/lib/admin/media";

const pathSchema = z
  .string()
  .regex(/^uploads\/\d{4}\/\d{2}\/[a-f0-9-]{36}\.(png|jpe?g|webp|gif|avif)$/);

export type RegisterResult = { ok: true; media: MediaRow } | { ok: false; message: string };

/**
 * 브라우저가 Storage에 직접 올린 뒤(사용자 JWT, RLS is_admin) 호출. 공개 URL을 fetch해 크기를 계산하고 media 행을 만든다.
 * 삽입은 관리자 JWT로 수행되어 RLS가 다시 검증한다.
 */
export async function registerMedia(input: {
  path: string;
  alt?: string;
}): Promise<RegisterResult> {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false, message: "권한이 없거나 세션이 만료됐어요." };
  const path = pathSchema.safeParse(input.path);
  if (!path.success) return { ok: false, message: "허용되지 않는 경로예요." };

  const { supabase } = auth.ctx;
  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path.data);
  const url = pub.publicUrl;

  let width: number | null = null;
  let height: number | null = null;
  let bytes: number | null = null;
  let mime: string | null = null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, message: `업로드한 파일을 읽을 수 없어요 (${res.status}).` };
    const buf = Buffer.from(await res.arrayBuffer());
    bytes = buf.byteLength;
    mime = res.headers.get("content-type");
    const dims = imageSize(buf);
    width = dims.width ?? null;
    height = dims.height ?? null;
  } catch {
    // 크기를 못 읽어도 등록은 한다 (본문에서는 크기 없이 렌더, 경고 표시)
  }

  const ins = await supabase
    .from("media")
    .insert({
      path: path.data,
      url,
      width,
      height,
      bytes,
      mime,
      alt_default: input.alt?.trim() || null,
    })
    .select("*")
    .single();
  if (ins.error) return { ok: false, message: ins.error.message };
  return { ok: true, media: ins.data as MediaRow };
}

export async function listMedia(limit = 60, before?: string) {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false as const, message: "권한이 없어요." };
  let q = auth.ctx.supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, items: (data ?? []) as MediaRow[] };
}

/** 참조(본문·커버·사진 스트립) 검사 후 삭제. force=true면 참조가 있어도 삭제. */
export async function deleteMedia(id: string, force = false) {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false as const, message: "권한이 없어요." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const, message: "잘못된 id" };
  const { supabase } = auth.ctx;
  const { data: m } = await supabase.from("media").select("id,path,url").eq("id", id).maybeSingle();
  if (!m) return { ok: false as const, message: "미디어를 찾을 수 없어요." };

  if (!force) {
    const [posts, projects, covers, thumbs] = await Promise.all([
      supabase.from("posts").select("id,title").like("content_md", `%${m.url}%`).limit(5),
      supabase.from("projects").select("id,title").like("content_md", `%${m.url}%`).limit(5),
      supabase.from("posts").select("id,title").eq("cover_media_id", id).limit(5),
      supabase.from("projects").select("id,title").eq("thumbnail_media_id", id).limit(5),
    ]);
    const refs = [
      ...(posts.data ?? []),
      ...(projects.data ?? []),
      ...(covers.data ?? []),
      ...(thumbs.data ?? []),
    ];
    if (refs.length)
      return {
        ok: false as const,
        message: `사용 중이에요: ${refs.map((r) => r.title).join(", ")}`,
        refs,
      };
  }

  const storage = await supabase.storage.from(MEDIA_BUCKET).remove([m.path]);
  if (storage.error) return { ok: false as const, message: storage.error.message };
  const del = await supabase.from("media").delete().eq("id", id);
  if (del.error) return { ok: false as const, message: del.error.message };
  return { ok: true as const };
}
