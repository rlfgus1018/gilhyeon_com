import Link from "next/link";
import { Container } from "@/components/layout/container";
import { siteConfig } from "@/lib/site-config";

const linkClass = "hover:text-foreground inline-flex min-h-6 items-center transition-colors";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-muted-foreground text-min mt-auto border-t">
      <Container className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {siteConfig.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <nav aria-label="외부 링크" className="flex items-center gap-5">
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              GitHub
            </a>
            <a href={`mailto:${siteConfig.email}`} className={linkClass}>
              이메일
            </a>
            <a href="/rss.xml" className={linkClass}>
              RSS
            </a>
          </nav>
          <nav aria-label="법적 고지" className="flex items-center gap-5">
            {siteConfig.legalLinks.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </footer>
  );
}
