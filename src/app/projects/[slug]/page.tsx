import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { ArticleBody } from "@/components/blog/article-body";
import { ArticleIslands } from "@/components/blog/article-islands";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { GitHubIcon } from "@/components/icons";
import { getProjectBySlug, getPublishedProjects } from "@/lib/content/projects";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const r = await getPublishedProjects(200);
  return r.ok ? r.data.filter((p) => p.has_body).map((p) => ({ slug: p.slug })) : [];
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await getProjectBySlug(slug);
  if (!r.ok || !r.data || !r.data.content_html.trim())
    return { title: "프로젝트를 찾을 수 없어요" };
  return {
    title: r.data.title,
    description: r.data.summary || undefined,
    alternates: { canonical: `/projects/${slug}` },
    // 이미지는 같은 세그먼트의 opengraph-image.tsx(파일 메타데이터가 우선)가 썸네일을 넣어 그린다
    openGraph: {
      type: "article",
      title: r.data.title,
      description: r.data.summary || undefined,
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const r = await getProjectBySlug(slug);
  if (!r.ok && r.reason === "error") throw new Error("DB_UNAVAILABLE");
  if (!r.ok || !r.data || !r.data.content_html.trim()) notFound();
  const p = r.data;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.links.github ? "SoftwareSourceCode" : "CreativeWork",
    name: p.title,
    description: p.summary,
    url: `${siteConfig.url}/projects/${p.slug}`,
    dateModified: p.updated_at,
    author: { "@type": "Person", name: siteConfig.name, url: siteConfig.url },
    keywords: p.tech.join(", "),
    ...(p.links.github ? { codeRepository: p.links.github } : {}),
    ...(p.thumbnail?.url ? { image: p.thumbnail.url } : {}),
  };
  return (
    <Container className="py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <article id="article" className="min-w-0">
          <header className="mb-10 space-y-4">
            <Link
              href="/projects"
              className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
            >
              <ArrowLeftIcon className="size-3.5" aria-hidden /> 프로젝트
            </Link>
            <h1 className="text-3xl font-bold sm:text-4xl">{p.title}</h1>
            {p.summary && <p className="text-muted-foreground text-lg">{p.summary}</p>}
            <div className="flex flex-wrap gap-1.5">
              {p.tech.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {p.links.github && (
                <a
                  href={p.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <GitHubIcon className="size-3.5" />
                  GitHub
                </a>
              )}
              {p.links.demo && (
                <a
                  href={p.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLinkIcon className="size-3.5" aria-hidden />
                  Demo
                </a>
              )}
              {p.links.post && (
                <Link href={p.links.post} className="hover:underline">
                  관련 글
                </Link>
              )}
            </div>
          </header>
          <ArticleBody html={p.content_html} />
          <ArticleIslands rootId="article" />
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents items={p.toc} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
