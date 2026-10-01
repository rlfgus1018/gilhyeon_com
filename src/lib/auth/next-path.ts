/** 로그인 후 돌아갈 경로는 고정 허용 목록만 인정한다 (오픈 리다이렉트 방지, plan.md §8.1). */
export const ALLOWED_NEXT_PATHS = ["/guestbook", "/admin"] as const;
export type AllowedNextPath = (typeof ALLOWED_NEXT_PATHS)[number];

/**
 * next 값은 redirectTo 쿼리가 아니라 쿠키로 전달한다.
 * Supabase Redirect URL 허용 목록은 정확 일치라서 `?next=`가 붙으면 거부되고 Site URL로 떨어진다.
 */
export const AUTH_NEXT_COOKIE = "auth_next";
export const AUTH_NEXT_MAX_AGE = 600; // 10분

export function resolveNextPath(input: string | null | undefined): AllowedNextPath {
  return (ALLOWED_NEXT_PATHS as readonly string[]).includes(input ?? "")
    ? (input as AllowedNextPath)
    : "/guestbook";
}

export type OAuthProvider = "github" | "google";
export function isOAuthProvider(v: unknown): v is OAuthProvider {
  return v === "github" || v === "google";
}
