import type { Metadata } from "next";
import Link from "next/link";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdminPage } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "관리자", robots: { index: false, follow: false } };

/** /admin/** 게이트. /admin/login 은 이 라우트 그룹 밖에 있어 게이트를 거치지 않는다. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdminPage();
  const meta = user.user_metadata as Record<string, unknown>;
  const displayName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user.email ||
    "관리자";

  return (
    <Container className="grid gap-8 py-10 md:grid-cols-[200px_1fr]">
      <aside className="space-y-6">
        <div className="space-y-1">
          <p className="text-brand text-xs font-semibold tracking-wide uppercase">Admin</p>
          <p className="truncate text-sm font-medium" title={displayName}>
            {displayName}
          </p>
        </div>
        <AdminSidebar />
        <form action="/auth/signout" method="post">
          <input type="hidden" name="next" value="/admin" />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start"
          >
            <LogOutIcon aria-hidden />
            로그아웃
          </Button>
        </form>
        <Link href="/" className="text-muted-foreground block text-xs hover:underline">
          ← 사이트로
        </Link>
      </aside>
      <section className="min-w-0">{children}</section>
    </Container>
  );
}
