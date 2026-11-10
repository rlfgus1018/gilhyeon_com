import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { AuthBanner } from "@/components/admin/auth-banner";
import { SignInButtons } from "@/components/admin/sign-in-buttons";
import { GuestbookBoard } from "@/components/guestbook/guestbook-board";
import { createServerSupabase } from "@/lib/supabase/server";
import { countGuestbook, listGuestbook } from "@/lib/guestbook/list";

// 세션에 따라 달라지는 페이지 — 캐시하지 않는다 (plan.md §2.1: private, no-store)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "방명록",
  description: "이길현에게 남기는 인사와 의견. GitHub나 Google로 로그인하면 쓸 수 있어요.",
  alternates: { canonical: "/guestbook" },
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className="border-coral bg-coral-soft text-aux rounded-[var(--radius-card)] border px-4 py-3"
    >
      {children}
    </p>
  );
}

function pickString(meta: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export default async function GuestbookPage({ searchParams }: PageProps<"/guestbook">) {
  const { auth } = await searchParams;
  const authCode = typeof auth === "string" ? auth : undefined;
  const supabase = await createServerSupabase();

  const header = (
    <PageHeader
      accent="violet"
      title="방명록"
      lead="인사든 글에 대한 의견이든 편하게 남겨주세요."
    />
  );

  if (!supabase) {
    return (
      <Container className="space-y-8 py-12 sm:py-16">
        {header}
        <Notice>방명록을 잠시 사용할 수 없어요. 잠시 후 다시 찾아와 주세요.</Notice>
      </Container>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [page, count, adminCheck] = await Promise.all([
    listGuestbook(supabase, { userId: user?.id ?? null }),
    countGuestbook(supabase),
    user ? supabase.rpc("is_admin") : Promise.resolve({ data: false, error: null }),
  ]);
  const isAdmin = !adminCheck.error && adminCheck.data === true;

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    pickString(meta, ["full_name", "name", "user_name", "preferred_username"]) ?? "방문자";
  const avatar = pickString(meta, ["avatar_url", "picture"]);
  const avatarOk =
    avatar &&
    /^https:\/\/(avatars\.githubusercontent\.com|lh[0-9]\.googleusercontent\.com)\//.test(avatar);

  return (
    <Container className="space-y-8 py-12 sm:py-16">
      {header}
      <AuthBanner code={authCode} />

      {user ? (
        <div className="card-surface text-aux flex flex-wrap items-center gap-3 px-4 py-3">
          {avatarOk ? (
            <Image src={avatar} alt="" width={28} height={28} className="size-7 rounded-full" />
          ) : (
            <span aria-hidden className="bg-brand size-7 rounded-full" />
          )}
          <p className="min-w-0 flex-1 truncate">
            <span className="font-medium">{displayName}</span>
            <span className="text-muted-foreground"> 님으로 로그인했어요</span>
          </p>
          {isAdmin && (
            <Link href="/admin/guestbook" className="text-brand-ink font-medium hover:underline">
              관리 콘솔
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <input type="hidden" name="next" value="/guestbook" />
            <button type="submit" className="text-muted-foreground hover:underline">
              로그아웃
            </button>
          </form>
        </div>
      ) : (
        <section aria-labelledby="guestbook-signin-heading" className="card-surface space-y-4 p-5">
          <div>
            <h2 id="guestbook-signin-heading" className="text-item font-semibold">
              로그인하고 한 줄 남기기
            </h2>
            <p className="text-muted-foreground text-aux mt-1">
              이름과 프로필 사진만 표시돼요. 이메일은 공개되지 않아요.
            </p>
          </div>
          <SignInButtons next="/guestbook" />
        </section>
      )}

      {page.ok ? (
        <GuestbookBoard
          key={user?.id ?? "anon"}
          initialEntries={page.entries}
          initialCursor={page.nextCursor}
          initialCount={count}
          canWrite={Boolean(user)}
          isAdmin={isAdmin}
        />
      ) : (
        <Notice>방명록을 잠시 불러올 수 없어요. 잠시 후 다시 시도해 주세요.</Notice>
      )}
    </Container>
  );
}
