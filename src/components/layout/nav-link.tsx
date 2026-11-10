"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Link> & { href: string; exact?: boolean };

export function isActivePath(pathname: string, href: string, exact = false) {
  if (href === "/") return pathname === "/";
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** 공개 사이트 헤더용 텍스트 링크. 활성 표시는 밑줄 하나로 끝낸다. */
export function HeaderNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-10 items-center px-2.5 text-sm font-medium underline-offset-8 transition-colors duration-150",
        active
          ? "text-foreground decoration-brand underline decoration-2"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function NavLink({ href, exact, className, children, ...props }: Props) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {active && <span aria-hidden className="bg-brand size-1.5 rounded-full" />}
      {children}
    </Link>
  );
}
