import "server-only";
import type { createServerSupabase } from "@/lib/supabase/server";
import { cursorFilter, encodeCursor, type GuestbookCursor } from "@/lib/guestbook/cursor";
import { PAGE_SIZE } from "@/lib/guestbook/moderation";

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;

/** 브라우저로 내려가는 카드 데이터. user_id는 내려보내지 않고 mine 여부만 계산한다. */
export type GuestbookEntryView = {
  id: string;
  author_name: string;
  avatar_url: string | null;
  message: string;
  color: string;
  created_at: string;
  is_hidden: boolean;
  mine: boolean;
};

type Row = Omit<GuestbookEntryView, "mine" | "is_hidden"> & {
  user_id?: string;
  is_hidden?: boolean;
};

export type GuestbookPage =
  | { ok: true; entries: GuestbookEntryView[]; nextCursor: string | null }
  | { ok: false; entries: []; nextCursor: null };

/**
 * 방명록 한 페이지.
 * - 비로그인: 공개 뷰(guestbook_public) — 숨김 제외, 표시 컬럼만
 * - 로그인: guestbook 테이블(RLS: 공개 글, 관리자는 숨김 포함)
 */
export async function listGuestbook(
  supabase: ServerSupabase,
  opts: { userId: string | null; cursor?: GuestbookCursor | null; limit?: number },
): Promise<GuestbookPage> {
  const limit = opts.limit ?? PAGE_SIZE;
  let q = opts.userId
    ? supabase
        .from("guestbook")
        .select("id,user_id,author_name,avatar_url,message,color,is_hidden,created_at")
    : supabase
        .from("guestbook_public")
        .select("id,author_name,avatar_url,message,color,created_at");
  if (opts.cursor) q = q.or(cursorFilter(opts.cursor));
  const { data, error } = await q
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (error) {
    console.error("[guestbook] list failed:", error.message);
    return { ok: false, entries: [], nextCursor: null };
  }
  const rows = (data ?? []) as Row[];
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return {
    ok: true,
    entries: page.map((r) => ({
      id: r.id,
      author_name: r.author_name,
      avatar_url: r.avatar_url,
      message: r.message,
      color: r.color,
      created_at: r.created_at,
      is_hidden: r.is_hidden ?? false,
      mine: Boolean(opts.userId && r.user_id === opts.userId),
    })),
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ created_at: last.created_at, id: last.id })
        : null,
  };
}

/** 보이는 글 수. 실패하면 null (0으로 표시하지 않는다) */
export async function countGuestbook(supabase: ServerSupabase): Promise<number | null> {
  const { count, error } = await supabase
    .from("guestbook_public")
    .select("id", { count: "exact", head: true });
  return error ? null : (count ?? 0);
}
