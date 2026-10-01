import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
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
  return (
    <section aria-labelledby="latest-posts">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="latest-posts" className="text-2xl font-bold">
          최근 글
        </h2>
        <Link
          href="/blog"
          className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
        >
          전체 보기 <ArrowRightIcon className="size-3.5" aria-hidden />
        </Link>
      </div>
      {!ok ? (
        <p className="text-muted-foreground card-surface p-6 text-sm">
          글을 잠시 불러올 수 없어요.
        </p>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground card-surface p-6 text-sm">첫 글을 준비하고 있어요.</p>
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
