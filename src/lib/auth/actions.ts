"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";
import {
  AUTH_NEXT_COOKIE,
  AUTH_NEXT_MAX_AGE,
  isOAuthProvider,
  resolveNextPath,
} from "@/lib/auth/next-path";

/**
 * OAuth 로그인 시작. redirectTo는 환경별 절대 origin + /auth/callback (쿼리 없음, 허용 목록과 정확 일치).
 * 돌아갈 경로(next)는 10분짜리 httpOnly 쿠키로 전달한다.
 */
export async function signInWith(formData: FormData) {
  const provider = formData.get("provider");
  const next = resolveNextPath(formData.get("next")?.toString());
  if (!isOAuthProvider(provider)) redirect(`${next}?auth=failed`);

  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${next}?auth=unavailable`);

  const origin = getSiteOrigin();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect(`${next}?auth=failed`);

  (await cookies()).set(AUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/auth",
    maxAge: AUTH_NEXT_MAX_AGE,
  });
  redirect(data.url);
}
