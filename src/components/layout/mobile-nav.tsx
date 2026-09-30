"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig, isNavEnabled } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { isActivePath } from "@/components/layout/nav-link";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="메뉴 열기" className="md:hidden" />}
      >
        <MenuIcon aria-hidden />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(85vw,360px)]">
        <SheetHeader>
          <SheetTitle>{siteConfig.name}</SheetTitle>
          <SheetDescription className="sr-only">사이트 메뉴</SheetDescription>
        </SheetHeader>
        <nav aria-label="모바일 메뉴" className="flex flex-col gap-1 px-4">
          {siteConfig.nav.filter(isNavEnabled).map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-3 text-base font-medium transition-colors",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", active ? "bg-brand" : "bg-border")}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
