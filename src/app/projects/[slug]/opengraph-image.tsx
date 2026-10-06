import { fetchImageAsDataUrl, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";
import { getProjectBySlug } from "@/lib/content/projects";

/** 프로젝트 OG 카드 — ISR 1시간, 프로젝트 저장 시 revalidateProject()가 함께 만료시킨다. */
export const revalidate = 3600;
export const alt = "프로젝트 미리보기";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getProjectBySlug(slug);
  if (!r.ok || !r.data) {
    return renderOgCard({ kicker: "프로젝트", title: "프로젝트를 찾을 수 없어요" });
  }
  const p = r.data;
  const imageSrc = p.thumbnail?.url ? await fetchImageAsDataUrl(p.thumbnail.url) : null;
  return renderOgCard({
    kicker: "프로젝트",
    title: p.title,
    description: p.summary,
    meta: p.tech.slice(0, 3),
    imageSrc,
  });
}
