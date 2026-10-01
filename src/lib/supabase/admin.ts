import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * secret key 클라이언트 — RLS를 우회한다.
 * 허용 경로: /api/views POST, /api/cron/* 만 (ESLint no-restricted-imports로 강제, plan.md §11.1).
 * 사용자 입력을 이 클라이언트로 직접 쓰지 않는다.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
