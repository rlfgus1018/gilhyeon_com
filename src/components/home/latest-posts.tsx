import { PostCard } from "@/components/blog/post-card";
import { SectionHeading } from "@/components/home/section-heading";
import type { PostSummary } from "@/lib/content/posts";

export function LatestPosts({
  posts,
  views,
  ok,
}: {
  posts: PostSummary[];
  views: Map<string, number> | null;
  ok: boolean;
}) {
  if (ok && posts.length === 0) return null;
  return (
    <section aria-labelledby="latest-posts" data-accent="coral">
      <SectionHeading id="latest-posts" title="최근 글" href="/blog" />
      {!ok ? (
        <p className="text-muted-foreground text-body">글을 잠시 불러올 수 없어요.</p>
      ) : (
        <div className="divide-y">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} views={views ? (views.get(p.slug) ?? 0) : null} />
          ))}
        </div>
      )}
    </section>
  );
}
