import Link from "next/link";
import { Container } from "@/components/layout/container";
import { siteConfig, isNavEnabled } from "@/lib/site-config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span aria-hidden className="bg-brand inline-block size-2.5 rounded-full" />
            {siteConfig.name}
            <span className="text-muted-foreground text-sm font-normal">{siteConfig.nameEn}</span>
          </Link>
          <p className="text-muted-foreground max-w-xs text-sm">
            {siteConfig.fallback.footerIntro}
          </p>
        </div>

        {siteConfig.footerGroups.map((group) => {
          const links = group.links.filter(isNavEnabled);
          if (links.length === 0) return null;
          return (
            <div key={group.title}>
              <h2 className="text-foreground mb-3 text-sm font-semibold">{group.title}</h2>
              <ul className="space-y-2 text-sm">
                {links.map((link) => {
                  const isHttp = link.href.startsWith("http");
                  return (
                    <li key={link.href}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target={isHttp ? "_blank" : undefined}
                          rel={isHttp ? "noopener noreferrer" : undefined}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </Container>
      <div className="border-t">
        <Container className="text-muted-foreground flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <p>Next.js와 Supabase로 만들었습니다.</p>
        </Container>
      </div>
    </footer>
  );
}
