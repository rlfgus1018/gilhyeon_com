import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

export type AdminContext = {
  user: User;
  isAdmin: boolean;
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
};

/**
 * 서버에서 사용자를 검증(getUser: Auth 서버 조회, 세션 종료 감지)하고 is_admin RPC로 권한을 확인한다.
 * - configured=false: Supabase 미설정
 * - user=null: 비로그인
 */
export async function getAdminContext(): Promise<
  { configured: false } | { configured: true; user: null } | ({ configured: true } & AdminContext)
> {
  const supabase = await createServerSupabase();
  if (!supabase) return { configured: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, user: null };
  const { data, error } = await supabase.rpc("is_admin");
  const isAdmin = !error && data === true;
  return { configured: true, user, isAdmin, supabase };
}

/** 레이아웃·페이지용: 비로그인 → 로그인 페이지, 비관리자 → 404 (존재 노출 방지) */
export async function requireAdminPage(): Promise<AdminContext> {
  const ctx = await getAdminContext();
  if (!ctx.configured) redirect("/admin/login?auth=unavailable");
  if (!ctx.user) redirect("/admin/login");
  if (!ctx.isAdmin) notFound();
  return ctx;
}

/** 서버 액션용: 예외 대신 결과 객체. 모든 /admin 액션은 첫 줄에서 호출한다. */
export async function requireAdminAction(): Promise<
  | { ok: true; ctx: AdminContext }
  | { ok: false; error: "SESSION_EXPIRED" | "FORBIDDEN" | "UNAVAILABLE" }
> {
  const ctx = await getAdminContext();
  if (!ctx.configured) return { ok: false, error: "UNAVAILABLE" };
  if (!ctx.user) return { ok: false, error: "SESSION_EXPIRED" };
  if (!ctx.isAdmin) return { ok: false, error: "FORBIDDEN" };
  return { ok: true, ctx };
}
