import { Container } from "@/components/layout/container";
import { Hero } from "@/components/home/hero";
import { PhotoStrip } from "@/components/home/photo-strip";
import { Bento } from "@/components/home/bento";
import { LatestPosts } from "@/components/home/latest-posts";
import { SiteCards } from "@/components/home/site-cards";
import { GuestbookCta } from "@/components/home/guestbook-cta";
import { getSiteContent } from "@/lib/content/site";
import { getPublishedPosts, getViewCounts } from "@/lib/content/posts";
import { getPublishedProjects } from "@/lib/content/projects";
import { getGuestbookPreview } from "@/lib/content/guestbook";

export const revalidate = 300;

/**
 * 홈 — ISR 5분. 모든 데이터는 쿠키 없는 공개 클라이언트로 읽고, 실패하면 섹션별 fallback을 보여준다 (plan.md §3.1).
 */
export default async function HomePage() {
  const [site, posts, projects, guestbook] = await Promise.all([
    getSiteContent(),
    getPublishedPosts(3),
    getPublishedProjects(4),
    getGuestbookPreview(3),
  ]);
  const latest = posts.ok ? posts.data : [];
  const views = posts.ok
    ? await getViewCounts(latest.map((p) => p.slug))
    : { ok: false as const, map: new Map<string, number>() };
  const avatar = site.data.hero.avatar_media_id
    ? (site.media.get(site.data.hero.avatar_media_id) ?? null)
    : null;

  return (
    <Container className="space-y-20 py-16 sm:py-24">
      <Hero hero={site.data.hero} avatar={avatar} />
      <PhotoStrip photos={site.data.photos} media={site.media} />
      <Bento intro={site.data.intro} now={site.data.now} stack={site.data.stack} />
      <LatestPosts posts={latest} views={views.ok ? views.map : null} ok={posts.ok} />
      <SiteCards
        guestbook={guestbook}
        projects={{
          ok: projects.ok,
          items: projects.ok
            ? projects.data
                .filter((p) => p.featured)
                .concat(projects.data.filter((p) => !p.featured))
            : [],
        }}
      />
      <GuestbookCta />
    </Container>
  );
}
