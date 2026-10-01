import Link from "next/link";
import { ArrowUpRightIcon, MailIcon, SparklesIcon } from "lucide-react";
import { GitHubIcon } from "@/components/icons";
import { StackIcon } from "@/components/home/stack-icon";
import { siteConfig } from "@/lib/site-config";
import type { SiteData } from "@/lib/admin/site-schemas";

function Card({
  accent,
  title,
  href,
  children,
  className = "",
}: {
  accent: string;
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2">
        <span aria-hidden className="bg-tone size-2 rounded-full" />
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {title}
        </h3>
      </div>
      <div className="mt-3 flex-1">{children}</div>
      {href && (
        <ArrowUpRightIcon
          aria-hidden
          className="text-muted-foreground group-hover:text-tone absolute right-5 bottom-5 size-4 transition-colors"
        />
      )}
    </>
  );
  const cls = `card-surface card-surface-hover group relative flex flex-col p-5 ${className}`;
  return href ? (
    <Link href={href} data-accent={accent} className={cls}>
      {body}
    </Link>
  ) : (
    <div data-accent={accent} className={cls}>
      {body}
    </div>
  );
}

export function Bento({
  intro,
  now,
  stack,
}: {
  intro: SiteData["intro"];
  now: SiteData["now"];
  stack: SiteData["stack"];
}) {
  const introText = intro.md
    .replace(/[#>*_`\[\]()!]/g, "")
    .split(/\n+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(" ");
  return (
    <section aria-label="소개 카드" className="grid gap-4 md:grid-cols-6">
      <Card accent="brand" title="About" href="/about" className="md:col-span-3">
        <p className="line-clamp-4 text-sm leading-relaxed">
          {introText || "소개 글을 준비하고 있어요."}
        </p>
      </Card>
      <Card accent="amber" title="Now" className="md:col-span-3">
        {now.items.length ? (
          <ul className="space-y-1.5 text-sm">
            {now.items.map((it) => (
              <li key={it} className="flex gap-2">
                <SparklesIcon className="text-tone mt-1 size-3.5 shrink-0" aria-hidden />
                {it}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">요즘 하는 일을 곧 적을게요.</p>
        )}
      </Card>
      <Card accent="mint" title="Toolbox" className="md:col-span-4">
        {stack.length ? (
          <ul className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <li
                key={s.key}
                className="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
              >
                <StackIcon slug={s.key} className="size-3.5" />
                {s.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">자주 쓰는 도구를 정리 중이에요.</p>
        )}
      </Card>
      <Card accent="sky" title="Connect" className="md:col-span-2">
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <GitHubIcon className="size-4" />@{siteConfig.githubHandle}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${siteConfig.email}`}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <MailIcon className="size-4" aria-hidden />
              이메일
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">커피챗은 이메일로 편하게 연락 주세요.</p>
      </Card>
    </section>
  );
}
