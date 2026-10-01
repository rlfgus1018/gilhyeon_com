import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * 쿠키 기반 서버 클라이언트 — 서버 컴포넌트·서버 액션·라우트 핸들러에서 사용자 세션으로 접근.
 * 이 함수를 호출하는 라우트는 동적(dynamic)이 된다. 공용 레이아웃·ISR 페이지에서는 쓰지 않는다.
 */
export async function createServerSupabase() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다. 세션 갱신은 proxy.ts가 담당한다.
        }
      },
    },
  });
}
