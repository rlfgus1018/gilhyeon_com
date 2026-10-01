"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { siteSchemas, type SiteKey } from "@/lib/admin/site-schemas";
import { compileMarkdown } from "@/lib/markdown/compile";
import { revalidateEverything, revalidateSiteContent } from "@/lib/content/revalidate";

export type SiteSaveResult =
  | { ok: true; updated_at: string }
  | { ok: false; message: string; fields?: Record<string, string> };

/** 키별 zod 검증 → (intro는 Markdown 컴파일) → upsert(관리자 JWT, RLS) → 홈·소개 재검증 */
export async function saveSiteContent(key: SiteKey, data: unknown): Promise<SiteSaveResult> {
  const auth = await requireAdminAction();
  if (!auth.ok)
    return {
      ok: false,
      message:
        auth.error === "SESSION_EXPIRED"
          ? "세션이 만료됐어요. 다시 로그인해 주세요."
          : "권한이 없어요.",
    };
  const schema = siteSchemas[key];
  if (!schema) return { ok: false, message: "알 수 없는 항목" };
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".") || "form"] = i.message;
    return { ok: false, message: "입력값을 확인해 주세요.", fields };
  }
  let value: unknown = parsed.data;
  if (key === "intro") {
    const intro = parsed.data as { md: string };
    const compiled = await compileMarkdown(intro.md);
    value = { md: intro.md, html: compiled.html };
  }
  const res = await auth.ctx.supabase
    .from("site_content")
    .upsert({ key, data: value }, { onConflict: "key" })
    .select("updated_at")
    .single();
  if (res.error) return { ok: false, message: res.error.message };
  revalidateSiteContent();
  return { ok: true, updated_at: res.data.updated_at };
}

/** 대시보드 "캐시 새로고침" */
export async function refreshAllCaches() {
  const auth = await requireAdminAction();
  if (!auth.ok) return { ok: false as const, message: "권한이 없어요." };
  revalidateEverything();
  return { ok: true as const };
}
