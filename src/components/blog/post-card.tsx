import Link from "next/link";
import Image from "next/image";
import { EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { PostSummary } from "@/lib/content/posts";

type Props = { post: PostSummary; views?: number | null; featured?: boolean };

/** 목록 항목. views가 null이면 DB 장애 → "—" 표시(0으로 표시하지 않음) */
export function PostCard({ post, views, featured = false }: Props) {
  const meta = (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at ?? "")}</time>
      <span aria-hidden>·</span>
      <span>{post.reading_minutes}분</span>
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1" title="참고용 열람 횟수">
        <EyeIcon className="size-3" aria-hidden />
        {views === null || views === undefined ? "—" : views.toLocaleString("ko-KR")}
      </span>
    </p>
  );

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        data-accent="brand"
        className="card-surface card-surface-hover group flex flex-col overflow-hidden"
      >
        {post.cover?.url ? (
          <div className="bg-muted relative aspect-[1200/630]">
            <Image
              src={post.cover.url}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="bg-brand-soft relative aspect-[1200/630]">
            <div className="bg-coral-soft absolute right-6 bottom-6 size-14 rounded-2xl" />
            <div className="bg-mint-soft absolute top-6 left-6 size-10 rounded-full" />
          </div>
        )}
        <div className="space-y-2 p-5">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
          <h3 className="text-lg font-semibold group-hover:underline">{post.title}</h3>
          <p className="text-muted-foreground line-clamp-2 text-sm">{post.description}</p>
          {meta}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group hover:bg-accent/40 -mx-3 flex flex-col gap-1.5 rounded-2xl px-3 py-4 transition-colors"
    >
      <h3 className="font-semibold group-hover:underline">{post.title}</h3>
      {post.description && (
        <p className="text-muted-foreground line-clamp-2 text-sm">{post.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {meta}
        <span className="flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[11px]">
              {t}
            </Badge>
          ))}
        </span>
      </div>
    </Link>
  );
}
