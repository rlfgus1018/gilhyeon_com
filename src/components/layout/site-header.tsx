import Link from "next/link";
import { MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { NavLink } from "@/components/layout/nav-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GitHubIcon } from "@/components/icons";
import { siteConfig, isNavEnabled } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="bg-brand inline-block size-2.5 rounded-full" />
          {siteConfig.name}
        </Link>

        <nav
          aria-label="주 메뉴"
          className="bg-card/80 absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border p-1 md:flex"
        >
          {siteConfig.nav.filter(isNavEnabled).map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="GitHub 프로필"
            render={<a href={siteConfig.github} target="_blank" rel="noopener noreferrer" />}
          >
            <GitHubIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="이메일 보내기"
            render={<a href={`mailto:${siteConfig.email}`} />}
          >
            <MailIcon aria-hidden />
          </Button>
          <ThemeToggle />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
