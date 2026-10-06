import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/content/posts";
import { getPublishedProjects } from "@/lib/content/projects";
import { getCanonicalOrigin } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getCanonicalOrigin();
  const [postsRes, projectsRes] = await Promise.all([
    getPublishedPosts(1000),
    getPublishedProjects(500),
  ]);
  const posts = postsRes.ok ? postsRes.data : [];
  const projects = projectsRes.ok ? projectsRes.data.filter((p) => p.has_body) : [];
  const statics: MetadataRoute.Sitemap = [
    "/",
    "/about",
    "/blog",
    "/projects",
    "/guestbook",
    "/privacy",
    "/terms",
  ].map((p) => {
    const legal = p === "/privacy" || p === "/terms";
    return {
      url: `${origin}${p}`,
      changeFrequency: p === "/" || p === "/blog" ? "daily" : legal ? "yearly" : "weekly",
      priority: p === "/" ? 1 : legal ? 0.3 : 0.7,
    };
  });
  return [
    ...statics,
    ...posts.map((p) => ({
      url: `${origin}/blog/${p.slug}`,
      lastModified: p.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...projects.map((p) => ({
      url: `${origin}/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
