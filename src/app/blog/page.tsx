import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { BlogIndex } from "@/components/blog/blog-index";
import { collectTags, getPublishedPosts, getViewCounts } from "@/lib/content/posts";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "블로그",
  description: "배우고 만든 것을 기록합니다.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const result = await getPublishedPosts();
  const posts = result.ok ? result.data : [];
  const counts = result.ok
    ? await getViewCounts(posts.map((p) => p.slug))
    : { ok: false as const, map: new Map<string, number>() };
  const views = counts.ok ? Object.fromEntries(counts.map) : null;

  return (
    <Container className="space-y-10 py-12 sm:py-16">
      <PageHeader accent="coral" title="블로그" lead="배우고 만든 것을 기록합니다." />
      {!result.ok ? (
        <p className="text-muted-foreground text-body">
          글 목록을 잠시 불러올 수 없어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : (
        <BlogIndex posts={posts} tags={collectTags(posts)} views={views} />
      )}
    </Container>
  );
}
