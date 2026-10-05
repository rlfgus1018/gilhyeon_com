"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidateGuestbook } from "@/lib/content/revalidate";
import { decodeCursor, isUuid } from "@/lib/guestbook/cursor";
import { fail, toGuestbookErrorCode, type GuestbookFailure } from "@/lib/guestbook/errors";
import { listGuestbook, type GuestbookEntryView } from "@/lib/guestbook/list";
import { checkMessage, normalizeMessage } from "@/lib/guestbook/moderation";

/**
 * 방명록 서버 액션. 모든 쓰기는 사용자 JWT로 가고 규칙은 DB(RPC·RLS)가 최종 강제한다 (plan.md §7.6, §8).
 * 각 액션은 getUser()로 세션을 다시 검증한다(직접 POST 대비).
 */
async function getSession() {
  const supabase = await createServerSupabase();
  if (!supabase) return { supabase: null, user: null };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createGuestbookEntry(input: {
  message: string;
  color: string;
}): Promise<{ ok: true; entry: GuestbookEntryView } | GuestbookFailure> {
  if (typeof input?.message !== "string" || typeof input?.color !== "string")
    return fail("INVALID_INPUT");
  const { supabase, user } = await getSession();
  if (!supabase) return fail("UNAVAILABLE");
  if (!user) return fail("SESSION_EXPIRED");

  const message = normalizeMessage(input.message);
  const issue = checkMessage(message, input.color);
  if (issue) return fail(issue);

  const { data, error } = await supabase.rpc("guestbook_create", {
    p_message: message,
    p_color: input.color,
  });
  if (error) return fail(toGuestbookErrorCode(error));
  const row = (Array.isArray(data) ? data[0] : data) as
    Omit<GuestbookEntryView, "mine" | "is_hidden"> | undefined;
  if (!row) return fail("UNKNOWN");

  revalidateGuestbook();
  return { ok: true, entry: { ...row, is_hidden: false, mine: true } };
}

/** 삭제: RLS가 소유자 또는 관리자만 허용. 0행이면 권한 없음/이미 삭제로 본다. */
export async function deleteGuestbookEntry(id: string): Promise<{ ok: true } | GuestbookFailure> {
  if (!isUuid(id)) return fail("INVALID_INPUT");
  const { supabase, user } = await getSession();
  if (!supabase) return fail("UNAVAILABLE");
  if (!user) return fail("SESSION_EXPIRED");

  const { data, error } = await supabase.from("guestbook").delete().eq("id", id).select("id");
  if (error) return fail(toGuestbookErrorCode(error));
  if (!data?.length) return fail("NOT_FOUND");
  revalidateGuestbook();
  return { ok: true };
}

/** 숨김/복원: RPC 내부에서 is_admin() 검사 (비관리자는 FORBIDDEN) */
export async function setGuestbookHidden(
  id: string,
  hidden: boolean,
): Promise<{ ok: true } | GuestbookFailure> {
  if (!isUuid(id) || typeof hidden !== "boolean") return fail("INVALID_INPUT");
  const { supabase, user } = await getSession();
  if (!supabase) return fail("UNAVAILABLE");
  if (!user) return fail("SESSION_EXPIRED");

  const { error } = await supabase.rpc("guestbook_set_hidden", { p_id: id, p_hidden: hidden });
  if (error) return fail(toGuestbookErrorCode(error));
  revalidateGuestbook();
  return { ok: true };
}

/** "더 보기": 커서 다음 페이지 */
export async function loadGuestbookPage(
  cursor: string,
): Promise<
  { ok: true; entries: GuestbookEntryView[]; nextCursor: string | null } | GuestbookFailure
> {
  const decoded = decodeCursor(cursor);
  if (!decoded) return fail("INVALID_INPUT");
  const { supabase, user } = await getSession();
  if (!supabase) return fail("UNAVAILABLE");
  const page = await listGuestbook(supabase, { userId: user?.id ?? null, cursor: decoded });
  if (!page.ok) return fail("UNAVAILABLE");
  return page;
}
