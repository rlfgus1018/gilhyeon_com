import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SignInButtons } from "@/components/admin/sign-in-buttons";
import { AuthBanner } from "@/components/admin/auth-banner";
import { getAdminContext } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "관리자 로그인",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { auth } = await searchParams;
  const ctx = await getAdminContext();

  if (ctx.configured && ctx.user) {
    if (ctx.isAdmin) redirect("/admin");
    return (
      <Container className="max-w-md py-24">
        <h1 className="text-2xl font-bold">관리자 권한이 없어요</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          이 계정은 관리자로 등록되어 있지 않습니다.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <input type="hidden" name="next" value="/admin" />
          <button type="submit" className="text-sm underline">
            다른 계정으로 로그인
          </button>
        </form>
      </Container>
    );
  }

  const code = typeof auth === "string" ? auth : ctx.configured ? undefined : "unavailable";
  return (
    <Container className="max-w-md space-y-6 py-24">
      <div>
        <p className="text-brand text-xs font-semibold tracking-wide uppercase">Admin</p>
        <h1 className="mt-1 text-2xl font-bold">관리자 로그인</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          등록된 관리자 계정으로만 들어갈 수 있어요.
        </p>
      </div>
      <AuthBanner code={code} />
      {ctx.configured && <SignInButtons next="/admin" />}
    </Container>
  );
}
