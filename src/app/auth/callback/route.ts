import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { resolveNextPath } from "@/lib/auth/next-path";

export const dynamic = "force-dynamic";

function redirectTo(request: NextRequest, path: string, auth?: string) {
  const url = new URL(path, request.nextUrl.origin);
  if (auth) url.searchParams.set("auth", auth);
  const res = NextResponse.redirect(url);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

/** Supabase → 사이트 콜백. 취소/누락/교환 실패를 각각 구분해 안내한다 (plan.md §8.1). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = resolveNextPath(params.get("next"));
  const code = params.get("code");

  if (params.get("error")) {
    const desc = params.get("error_description") ?? "";
    const cancelled = /denied|cancel/i.test(desc) || params.get("error") === "access_denied";
    return redirectTo(request, next, cancelled ? "cancelled" : "failed");
  }
  if (!code) return redirectTo(request, next, "failed");

  const supabase = await createServerSupabase();
  if (!supabase) return redirectTo(request, next, "unavailable");

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectTo(request, next, "failed");
  return redirectTo(request, next);
}
