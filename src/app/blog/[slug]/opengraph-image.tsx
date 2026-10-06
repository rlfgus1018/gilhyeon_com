import { fetchImageAsDataUrl, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og/card";
import { getPostBySlug } from "@/lib/content/posts";
import { formatDate } from "@/lib/utils";

/** 글 OG 카드 — ISR 1시간, 글 저장 시 revalidatePost()가 함께 만료시킨다. */
export const revalidate = 3600;
export const alt = "글 미리보기";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await getPostBySlug(slug);
  if (!r.ok || !r.data) {
    return renderOgCard({ kicker: "블로그", title: "글을 찾을 수 없어요" });
  }
  const p = r.data;
  const imageSrc = p.cover?.url ? await fetchImageAsDataUrl(p.cover.url) : null;
  const meta = [
    ...(p.published_at ? [formatDate(p.published_at)] : []),
    `${p.reading_minutes}분 읽기`,
  ];
  return renderOgCard({
    kicker: p.tags.length ? p.tags.slice(0, 3).join(" · ") : "블로그",
    title: p.title,
    description: p.description,
    meta,
    imageSrc,
  });
}
