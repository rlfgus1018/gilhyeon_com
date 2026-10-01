import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/content/posts";
import { getCanonicalOrigin } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getCanonicalOrigin();
  const r = await getPublishedPosts(1000);
  const posts = r.ok ? r.data : [];
  const statics: MetadataRoute.Sitemap = ["/", "/about", "/blog", "/projects", "/guestbook"].map(
    (p) => ({
      url: `${origin}${p}`,
      changeFrequency: p === "/" || p === "/blog" ? "daily" : "weekly",
      priority: p === "/" ? 1 : 0.7,
    }),
  );
  return [
    ...statics,
    ...posts.map((p) => ({
      url: `${origin}/blog/${p.slug}`,
      lastModified: p.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
