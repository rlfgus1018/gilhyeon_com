import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleIslands } from "@/components/blog/article-islands";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ViewCounter } from "@/components/blog/view-counter";
import { getAdjacentPosts, getPostBySlug, getPublishedPosts } from "@/lib/content/posts";
import { siteConfig } from "@/lib/site-config";
import { formatDate } from "@/lib/utils";

export const revalidate = 3600;
export const dynamicParams = true;

/** 빌드 시 DB가 없으면 빈 배열 → 모두 첫 요청에 생성 */
export async function generateStaticParams() {
  const r = await getPublishedPosts(500);
  return r.ok ? r.data.map((p) => ({ slug: p.slug })) : [];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await getPostBySlug(slug);
  if (!r.ok || !r.data) return { title: "글을 찾을 수 없어요" };
  const p = r.data;
  return {
    title: p.title,
    description: p.description || undefined,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.description || undefined,
      publishedTime: p.published_at ?? undefined,
      modifiedTime: p.updated_at,
      tags: p.tags,
      authors: [siteConfig.name],
      ...(p.cover?.url
        ? {
            images: [
              {
                url: p.cover.url,
                width: p.cover.width ?? undefined,
                height: p.cover.height ?? undefined,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const r = await getPostBySlug(slug);
  if (!r.ok && r.reason === "error") throw new Error("DB_UNAVAILABLE");
  if (!r.ok || !r.data) notFound();
  const post = r.data;
  const { prev, next } = post.published_at
    ? await getAdjacentPosts(post.published_at)
    : { prev: null, next: null };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    inLanguage: post.lang,
    keywords: post.tags.join(", "),
  };

  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <article lang={post.lang} id="article" className="min-w-0">
          <header className="mb-10 space-y-4">
            <Link
              href="/blog"
              className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden /> 블로그
            </Link>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`}>
                  <Badge variant="secondary">{t}</Badge>
                </Link>
              ))}
            </div>
            <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
            {post.description && (
              <p className="text-muted-foreground text-lg">{post.description}</p>
            )}
            <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-sm">
              <time dateTime={post.published_at ?? undefined}>
                {formatDate(post.published_at ?? post.created_at)}
              </time>
              <span aria-hidden>·</span>
              <span>{post.reading_minutes}분 읽기</span>
              <span aria-hidden>·</span>
              <ViewCounter slug={post.slug} />
            </p>
          </header>

          <ArticleBody html={post.content_html} />
          <ArticleIslands rootId="article" />

          <nav aria-label="이전·다음 글" className="mt-14 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link href={`/blog/${prev.slug}`} className="card-surface card-surface-hover p-4">
                <span className="text-muted-foreground text-xs">이전 글</span>
                <p className="mt-1 font-medium">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                href={`/blog/${next.slug}`}
                className="card-surface card-surface-hover p-4 text-right"
              >
                <span className="text-muted-foreground text-xs">다음 글</span>
                <p className="mt-1 inline-flex items-center gap-1 font-medium">
                  {next.title} <ArrowRightIcon className="size-3.5" aria-hidden />
                </p>
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={post.toc} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
