"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PostCard } from "@/components/blog/post-card";
import type { PostSummary } from "@/lib/content/posts";
import { cn } from "@/lib/utils";

type Props = {
  posts: PostSummary[];
  tags: { tag: string; count: number }[];
  views: Record<string, number> | null;
};

/** 태그 필터는 URL(?tag=)과 동기화되는 클라이언트 필터 — 페이지는 ISR로 남는다. */
export function BlogIndex(props: Props) {
  return (
    <Suspense fallback={<BlogList {...props} tag={null} />}>
      <BlogIndexInner {...props} />
    </Suspense>
  );
}

function BlogIndexInner(props: Props) {
  const tag = useSearchParams().get("tag");
  return <BlogList {...props} tag={tag} />;
}

function BlogList({ posts, tags, views, tag }: Props & { tag: string | null }) {
  const pathname = usePathname();
  const filtered = useMemo(
    () => (tag ? posts.filter((p) => p.tags.includes(tag)) : posts),
    [posts, tag],
  );
  const featured = tag ? [] : posts.filter((p) => p.featured).slice(0, 2);
  const rest = tag ? filtered : filtered.filter((p) => !featured.includes(p));
  const v = (slug: string) => (views ? (views[slug] ?? 0) : null);

  return (
    <div className="space-y-10">
      {featured.length > 0 && (
        <section aria-label="추천 글" className="grid gap-4 md:grid-cols-2">
          {featured.map((p) => (
            <PostCard key={p.id} post={p} views={v(p.slug)} featured />
          ))}
        </section>
      )}

      {tags.length > 0 && (
        <nav aria-label="태그 필터" className="flex flex-wrap gap-1.5">
          <Link
            href={pathname}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              !tag ? "bg-foreground text-background border-foreground" : "hover:bg-accent",
            )}
            aria-current={!tag ? "true" : undefined}
          >
            전체 <span className="opacity-60">{posts.length}</span>
          </Link>
          {tags.map(({ tag: t, count }) => (
            <Link
              key={t}
              href={`${pathname}?tag=${encodeURIComponent(t)}`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                tag === t ? "bg-foreground text-background border-foreground" : "hover:bg-accent",
              )}
              aria-current={tag === t ? "true" : undefined}
            >
              {t} <span className="opacity-60">{count}</span>
            </Link>
          ))}
        </nav>
      )}

      {rest.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {tag ? `"${tag}" 태그의 글이 없어요.` : "아직 글이 없어요."}
        </p>
      ) : (
        <section aria-label="글 목록" className="divide-y">
          {rest.map((p) => (
            <PostCard key={p.id} post={p} views={v(p.slug)} />
          ))}
        </section>
      )}
    </div>
  );
}
