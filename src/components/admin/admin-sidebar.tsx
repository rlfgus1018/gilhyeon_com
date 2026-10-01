"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  FolderKanbanIcon,
  ImageIcon,
  LayoutDashboardIcon,
  MessageSquareIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isActivePath } from "@/components/layout/nav-link";

const ITEMS = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboardIcon, exact: true, ready: true },
  { href: "/admin/posts", label: "글", icon: FileTextIcon, ready: true },
  { href: "/admin/projects", label: "프로젝트", icon: FolderKanbanIcon, ready: true },
  { href: "/admin/site", label: "사이트", icon: SettingsIcon, ready: true },
  { href: "/admin/media", label: "미디어", icon: ImageIcon, ready: true },
  { href: "/admin/guestbook", label: "방명록", icon: MessageSquareIcon, ready: false },
  { href: "/admin/trash", label: "휴지통", icon: Trash2Icon, ready: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="관리자 메뉴" className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label, icon: Icon, exact, ready }) => {
        const active = isActivePath(pathname, href, exact);
        return (
          <Link
            key={href}
            href={ready ? href : "#"}
            aria-current={active ? "page" : undefined}
            aria-disabled={!ready || undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
              !ready && "pointer-events-none opacity-50",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
            {!ready && <span className="ml-auto text-[10px] font-normal">준비 중</span>}
          </Link>
        );
      })}
    </nav>
  );
}
