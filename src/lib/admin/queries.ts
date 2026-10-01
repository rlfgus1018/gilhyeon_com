import type { SupabaseClient } from "@supabase/supabase-js";

/** 기존 글의 태그 전체 (자동완성용) */
export async function loadAllTags(supabase: SupabaseClient) {
  const { data } = await supabase.from("posts").select("tags").is("deleted_at", null).limit(500);
  const set = new Set<string>();
  for (const row of (data ?? []) as { tags: string[] }[])
    for (const t of row.tags ?? []) set.add(t);
  return [...set].sort();
}
