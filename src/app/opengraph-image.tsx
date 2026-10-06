import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";
import { siteConfig } from "@/lib/site-config";

/** 기본 OG 카드 — 홈·소개·목록 등 개별 이미지가 없는 모든 경로에 적용된다. 빌드 시 1회 생성. */
export const alt = `${siteConfig.name} · ${siteConfig.nameEn}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgCard({
    kicker: siteConfig.nameEn,
    title: siteConfig.fallback.heroGreeting.replace(/\s*👋\s*$/, ""),
    description: siteConfig.description,
  });
}
