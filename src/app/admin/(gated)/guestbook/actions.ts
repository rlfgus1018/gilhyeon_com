"use server";

import { requireAdminAction } from "@/lib/admin/guard";
import { revalidateGuestbook } from "@/lib/content/revalidate";
import { isUuid } from "@/lib/guestbook/cursor";
import { fail, toGuestbookErrorCode, type GuestbookFailure } from "@/lib/guestbook/errors";

/**
 * 사용자 차단/해제 (plan.md §8.5). 권한은 requireAdminAction + RPC 내부 is_admin()으로 이중 확인한다.
 * 글 숨김·삭제는 공개 방명록과 같은 액션(src/app/guestbook/actions.ts)을 쓴다.
 */
type Result = { ok: true } | GuestbookFailure;

export async function blockGuestbookUser(input: {
  userId: string;
  reason: string;
  hideAll: boolean;
}): Promise<Result> {
  const auth = await requireAdminAction();
  if (!auth.ok) return fail(auth.error);
  if (
    !isUuid(input?.userId) ||
    typeof input.reason !== "string" ||
    typeof input.hideAll !== "boolean"
  )
    return fail("INVALID_INPUT");
  if (input.userId === auth.ctx.user.id) return fail("CANNOT_BLOCK_SELF");

  const { error } = await auth.ctx.supabase.rpc("admin_block_user", {
    p_user: input.userId,
    p_reason: input.reason.trim().slice(0, 200),
    p_hide_all: input.hideAll,
  });
  if (error) return fail(toGuestbookErrorCode(error));
  revalidateGuestbook();
  return { ok: true };
}

export async function unblockGuestbookUser(userId: string): Promise<Result> {
  const auth = await requireAdminAction();
  if (!auth.ok) return fail(auth.error);
  if (!isUuid(userId)) return fail("INVALID_INPUT");

  const { error } = await auth.ctx.supabase.rpc("admin_unblock_user", { p_user: userId });
  if (error) return fail(toGuestbookErrorCode(error));
  revalidateGuestbook();
  return { ok: true };
}
