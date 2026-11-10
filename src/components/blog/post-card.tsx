import Link from "next/link";
import Image from "next/image";
import { EyeIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, MIN_VISIBLE_VIEWS } from "@/lib/utils";
import type { PostSummary } from "@/lib/content/posts";

type Props = { post: PostSummary; views?: number | null; featured?: boolean };

/** 목록 항목. 조회수는 값이 있고 기준 이상일 때만 보여준다(null은 DB 장애) */
export function PostCard({ post, views, featured = false }: Props) {
  const meta = (
    <p className="text-muted-foreground text-aux flex shrink-0 flex-wrap items-center gap-x-3">
      <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at ?? "")}</time>
      {typeof views === "number" && views >= MIN_VISIBLE_VIEWS && (
        <span className="inline-flex items-center gap-1" title="참고용 열람 횟수">
          <EyeIcon className="size-3" aria-hidden />
          {views.toLocaleString("ko-KR")}
        </span>
      )}
    </p>
  );

  if (featured) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        data-accent="coral"
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
          <div className="bg-tone text-on-tone flex aspect-[3/1] items-end p-5">
            <h3 className="text-item font-bold group-hover:underline">{post.title}</h3>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2 p-5">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {post.cover?.url && (
            <h3 className="text-item font-semibold group-hover:underline">{post.title}</h3>
          )}
          {post.description && (
            <p className="text-muted-foreground text-body line-clamp-2">{post.description}</p>
          )}
          {meta}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group flex flex-col gap-1.5 py-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <h3 className="text-item font-semibold group-hover:underline">{post.title}</h3>
        {meta}
      </div>
      {post.description && (
        <p className="text-muted-foreground text-body line-clamp-2">{post.description}</p>
      )}
      {post.tags.length > 0 && (
        <span className="flex flex-wrap gap-1">
          {post.tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </span>
      )}
    </Link>
  );
}
