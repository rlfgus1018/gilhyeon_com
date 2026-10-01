import { createPublicSupabase } from "@/lib/supabase/public";

export type GuestbookPublicEntry = {
  id: string;
  author_name: string;
  avatar_url: string | null;
  message: string;
  color: string;
  created_at: string;
};

/** 홈 미리보기: 공개 뷰(guestbook_public)만, 쿠키 없음 → 캐시 가능. 실패 시 ok=false (0으로 표시하지 않음) */
export async function getGuestbookPreview(limit = 3) {
  const sb = createPublicSupabase();
  if (!sb)
    return {
      ok: false as const,
      entries: [] as GuestbookPublicEntry[],
      count: null as number | null,
    };
  try {
    const [list, cnt] = await Promise.all([
      sb
        .from("guestbook_public")
        .select("id,author_name,avatar_url,message,color,created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      sb.from("guestbook_public").select("id", { count: "exact", head: true }),
    ]);
    if (list.error || cnt.error) throw list.error ?? cnt.error;
    return {
      ok: true as const,
      entries: (list.data ?? []) as GuestbookPublicEntry[],
      count: cnt.count ?? 0,
    };
  } catch (e) {
    console.error("[guestbook] preview failed:", e);
    return { ok: false as const, entries: [] as GuestbookPublicEntry[], count: null };
  }
}
