"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** 브라우저(클라이언트 컴포넌트)용. Storage 업로드 등 사용자 JWT가 필요한 곳에서 사용. */
export function createBrowserSupabase() {
  const env = getSupabasePublicEnv();
  if (!env) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  client ??= createBrowserClient(env.url, env.key);
  return client;
}
