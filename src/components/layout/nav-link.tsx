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
