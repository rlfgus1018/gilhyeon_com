import { createPublicSupabase } from "@/lib/supabase/public";
import { siteSchemas, type SiteData, type SiteKey } from "@/lib/admin/site-schemas";
import { siteConfig } from "@/lib/site-config";
import type { MediaRow } from "@/lib/supabase/types";

/** DB를 읽을 수 없을 때 쓰는 기본값 (plan.md §3.1) */
export const SITE_FALLBACK: SiteData = {
  hero: {
    greeting: siteConfig.fallback.heroGreeting,
    intro: [...siteConfig.fallback.heroIntro],
    avatar_media_id: null,
  },
  intro: { md: "", html: "" },
  timeline: [],
  interests: [],
  now: { items: [] },
  stack: [],
  photos: [],
};

export type SiteContent = { data: SiteData; ok: boolean; media: Map<string, MediaRow> };

/** site_content 전체 + 참조된 미디어. 키별로 스키마 검증 실패 시 해당 키만 기본값. */
export async function getSiteContent(): Promise<SiteContent> {
  const sb = createPublicSupabase();
  const data: SiteData = structuredClone(SITE_FALLBACK);
  const media = new Map<string, MediaRow>();
  if (!sb) return { data, ok: false, media };
  try {
    const { data: rows, error } = await sb.from("site_content").select("key,data");
    if (error) throw error;
    for (const row of (rows ?? []) as { key: SiteKey; data: unknown }[]) {
      const schema = siteSchemas[row.key];
      if (!schema) continue;
      const parsed = schema.safeParse(row.data);
      if (parsed.success) (data as Record<string, unknown>)[row.key] = parsed.data;
    }
    const ids = new Set<string>();
    if (data.hero.avatar_media_id) ids.add(data.hero.avatar_media_id);
    for (const p of data.photos) ids.add(p.media_id);
    if (ids.size) {
      const { data: ms } = await sb
        .from("media")
        .select("*")
        .in("id", [...ids]);
      for (const m of (ms ?? []) as MediaRow[]) media.set(m.id, m);
    }
    return { data, ok: true, media };
  } catch (e) {
    console.error("[site] load failed:", e);
    return { data, ok: false, media };
  }
}
