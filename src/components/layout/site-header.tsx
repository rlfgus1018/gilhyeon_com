import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HeaderNavLink } from "@/components/layout/nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { siteConfig, isNavEnabled } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="bg-background sticky top-0 z-40 border-b">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="inline-flex h-10 items-center font-semibold tracking-tight">
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label="주 메뉴" className="hidden items-center md:flex">
            {siteConfig.nav.filter(isNavEnabled).map((item) => (
              <HeaderNavLink key={item.href} href={item.href}>
                {item.label}
              </HeaderNavLink>
            ))}
          </nav>

          <div className="flex items-center">
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
