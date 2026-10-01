/** Supabase 공개 환경변수. 없으면 null — 빌드·정적 렌더는 DB 없이도 성공해야 한다 (plan.md §11.1). */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}
