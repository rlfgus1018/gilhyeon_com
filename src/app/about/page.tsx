import type { Metadata } from "next";
import Image from "next/image";
import { MailIcon } from "lucide-react";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/home/section-heading";
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
    <Container className="space-y-16 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="space-y-8">
        <PageHeader
          accent="amber"
          title={
            <>
              {siteConfig.name}{" "}
              <span className="text-muted-foreground text-item font-normal">
                {siteConfig.nameEn}
              </span>
            </>
          }
        />
        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] md:gap-12">
          <div>
            {intro.html ? (
              <ArticleBody html={intro.html} />
            ) : (
              !site.ok && (
                <p className="text-muted-foreground text-body">소개를 잠시 불러올 수 없어요.</p>
              )
            )}
          </div>
          {avatar && (
            <div
              data-accent="amber"
              className="bg-tone flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] md:aspect-square"
            >
              <div className="relative aspect-[4/5] h-4/5 overflow-hidden rounded-lg">
                <Image
                  src={avatar.url}
                  alt={`${siteConfig.name} 프로필 사진`}
                  fill
                  sizes="172px"
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <Interests items={interests} />
      <Timeline items={timeline} />
      <section aria-labelledby="contact" data-accent="amber">
        <SectionHeading id="contact" title="연락" />
        <div className="text-body flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <GitHubIcon className="size-4" />
            GitHub
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <MailIcon className="size-4" aria-hidden />
            {siteConfig.email}
          </a>
        </div>
      </section>
    </Container>
  );
}
