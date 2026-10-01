import type { Metadata } from "next";
import Image from "next/image";
import { MailIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { ArticleBody } from "@/components/blog/article-body";
import { Interests, Timeline } from "@/components/about/about-sections";
import { GitHubIcon } from "@/components/icons";
import { getSiteContent } from "@/lib/content/site";
import { siteConfig } from "@/lib/site-config";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "소개",
  description: siteConfig.description,
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const site = await getSiteContent();
  const { intro, interests, timeline, hero } = site.data;
  const avatar = hero.avatar_media_id ? site.media.get(hero.avatar_media_id) : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    alternateName: siteConfig.nameEn,
    url: siteConfig.url,
    email: `mailto:${siteConfig.email}`,
    sameAs: [siteConfig.github],
  };

  return (
    <Container className="space-y-16 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="grid items-start gap-8 md:grid-cols-[1fr_200px]">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {siteConfig.name}{" "}
            <span className="text-muted-foreground text-xl font-normal">{siteConfig.nameEn}</span>
          </h1>
          {intro.html ? (
            <ArticleBody html={intro.html} />
          ) : (
            <p className="text-muted-foreground">
              {site.ok ? "소개 글을 준비하고 있어요." : "소개를 잠시 불러올 수 없어요."}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <GitHubIcon className="size-4" />
              GitHub
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <MailIcon className="size-4" aria-hidden />
              {siteConfig.email}
            </a>
          </div>
        </div>
        {avatar && (
          <div className="relative mx-auto size-40 md:size-48">
            <div
              aria-hidden
              className="bg-brand-soft absolute inset-0 -rotate-3 rounded-[var(--radius-card)]"
            />
            <Image
              src={avatar.url}
              alt={`${siteConfig.name} 프로필 사진`}
              fill
              sizes="192px"
              className="relative rounded-[var(--radius-card)] object-cover"
            />
          </div>
        )}
      </header>
      <Interests items={interests} />
      <Timeline items={timeline} />
    </Container>
  );
}
