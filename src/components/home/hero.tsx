import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "@/components/icons";
import { siteConfig } from "@/lib/site-config";
import type { SiteData } from "@/lib/admin/site-schemas";
import type { MediaRow } from "@/lib/supabase/types";

type Props = { hero: SiteData["hero"]; avatar: MediaRow | null; hasProjects: boolean };

/** 사이트에서 유일하게 큰 요소. 색면은 소개를 뜻하는 amber (design-audit.md §5.1) */
export function Hero({ hero, avatar, hasProjects }: Props) {
  return (
    <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-12">
      <div className="space-y-6">
        <h1 className="text-display leading-[1.15] font-bold">{hero.greeting}</h1>
        <p className="text-muted-foreground text-item max-w-xl leading-relaxed">
          {hero.intro.join(" ")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" render={<Link href={hasProjects ? "/projects" : "/about"} />}>
            {hasProjects ? "프로젝트 보기" : "소개 보기"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            render={<a href={siteConfig.github} target="_blank" rel="noopener noreferrer" />}
          >
            <GitHubIcon className="size-4" />
            GitHub
          </Button>
        </div>
      </div>
      <div
        data-accent="amber"
        className="bg-tone order-first flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] md:order-none md:aspect-square"
      >
        {avatar ? (
          <div className="relative aspect-[4/5] h-4/5 overflow-hidden rounded-lg">
            <Image
              src={avatar.url}
              alt={`${siteConfig.name} 프로필 사진`}
              fill
              priority
              sizes="(min-width: 768px) 225px, 172px"
              className="object-cover"
            />
          </div>
        ) : (
          <span aria-hidden className="text-on-tone text-[8rem] leading-none font-bold">
            길
          </span>
        )}
      </div>
    </section>
  );
}
