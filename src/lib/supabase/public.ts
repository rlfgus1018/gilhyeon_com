import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * 쿠키 없는 공개 읽기 클라이언트 (anon 역할, RLS 적용).
 * ISR 페이지·홈 미리보기처럼 캐시되는 응답에서 사용한다. 세션을 절대 들고 다니지 않는다.
 */
export function createPublicSupabase() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
