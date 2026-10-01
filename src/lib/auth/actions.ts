"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSiteOrigin } from "@/lib/site-url";
import { isOAuthProvider, resolveNextPath } from "@/lib/auth/next-path";

/**
 * OAuth 로그인 시작. redirectTo는 환경별 절대 origin + /auth/callback (plan.md §8.1).
 * 공급자→Supabase 콜백(https://<ref>.supabase.co/auth/v1/callback)과는 다른 URL이다.
 */
export async function signInWith(formData: FormData) {
  const provider = formData.get("provider");
  const next = resolveNextPath(formData.get("next")?.toString());
  if (!isOAuthProvider(provider)) redirect(`${next}?auth=failed`);

  const supabase = await createServerSupabase();
  if (!supabase) redirect(`${next}?auth=unavailable`);

  const callback = new URL("/auth/callback", getSiteOrigin());
  callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString() },
  });
  if (error || !data.url) redirect(`${next}?auth=failed`);
  redirect(data.url);
}
