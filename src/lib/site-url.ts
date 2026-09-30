import { siteConfig } from "@/lib/site-config";

/** 운영 배포 여부 (Vercel Production 환경) */
export function isProduction() {
  return process.env.VERCEL_ENV === "production";
}

/** canonical·OG에 쓰는 운영 origin. 프리뷰/로컬에서도 항상 운영 도메인을 가리킨다. */
export function getCanonicalOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(/\/$/, "");
}

/**
 * 현재 배포 환경의 실제 origin. OAuth redirectTo 등 "지금 이 배포"로 돌아와야 하는 곳에 사용.
 * production → NEXT_PUBLIC_SITE_URL, preview → VERCEL_BRANCH_URL/VERCEL_URL, 그 외 → localhost
 */
export function getSiteOrigin() {
  if (isProduction()) return getCanonicalOrigin();
  const vercelHost = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}
