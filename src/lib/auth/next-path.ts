/** 로그인 후 돌아갈 경로는 고정 허용 목록만 인정한다 (오픈 리다이렉트 방지, plan.md §8.1). */
export const ALLOWED_NEXT_PATHS = ["/guestbook", "/admin"] as const;
export type AllowedNextPath = (typeof ALLOWED_NEXT_PATHS)[number];

export function resolveNextPath(input: string | null | undefined): AllowedNextPath {
  return (ALLOWED_NEXT_PATHS as readonly string[]).includes(input ?? "")
    ? (input as AllowedNextPath)
    : "/guestbook";
}

export type OAuthProvider = "github" | "google";
export function isOAuthProvider(v: unknown): v is OAuthProvider {
  return v === "github" || v === "google";
}
