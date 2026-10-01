import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

/**
 * 세션 토큰 갱신 (Supabase SSR 공식 패턴). getClaims()로 서명을 검증하며 갱신된 쿠키와
 * 캐시 헤더를 응답에 반영한다. 보호 라우트 판단은 여기서 하지 않는다(각 페이지/액션이 getUser로 재검증).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabasePublicEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // 세션이 있으면 갱신, 없으면 no-op. 반환값은 사용하지 않는다.
  await supabase.auth.getClaims();
  return response;
}
