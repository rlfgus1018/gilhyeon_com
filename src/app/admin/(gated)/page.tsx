import { requireAdminPage } from "@/lib/admin/guard";
import { RefreshCachesButton } from "@/components/admin/refresh-caches-button";

type Status = {
  posts_published: number;
  posts_draft: number;
  posts_trashed: number;
  projects_published: number;
  projects_draft: number;
  views_total: number;
  guestbook_public: number;
  guestbook_hidden: number;
  blocked_users: number;
  last_cron: { job: string; ok: boolean; ran_at: string } | null;
};

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.rpc("admin_status");
  const status = (error ? null : data) as Status | null;

  const cards = status
    ? [
        {
          label: "공개 글",
          value: status.posts_published,
          sub: `초안 ${status.posts_draft} · 휴지통 ${status.posts_trashed}`,
          accent: "brand",
        },
        {
          label: "프로젝트",
          value: status.projects_published,
          sub: `초안 ${status.projects_draft}`,
          accent: "mint",
        },
        { label: "총 조회수", value: status.views_total, sub: "참고용 열람 횟수", accent: "sky" },
        {
          label: "방명록",
          value: status.guestbook_public,
          sub: `숨김 ${status.guestbook_hidden} · 차단 ${status.blocked_users}`,
          accent: "coral",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-1 text-sm">사이트 현황을 한눈에 봅니다.</p>
        </div>
        <RefreshCachesButton />
      </header>

      {error ? (
        <p role="alert" className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm">
          현황을 불러오지 못했어요: {error.message}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} data-accent={c.accent} className="card-surface p-5">
              <div className="flex items-center gap-2">
                <span aria-hidden className="bg-tone size-2 rounded-full" />
                <p className="text-muted-foreground text-xs font-medium">{c.label}</p>
              </div>
              <p className="mt-2 text-3xl font-bold tabular-nums">
                {Number(c.value).toLocaleString("ko-KR")}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      <section className="card-surface p-5 text-sm">
        <h2 className="font-semibold">마지막 크론 실행</h2>
        {status?.last_cron ? (
          <p className="text-muted-foreground mt-1">
            {status.last_cron.job} · {status.last_cron.ok ? "성공" : "실패"} ·{" "}
            {new Date(status.last_cron.ran_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1">아직 실행 기록이 없어요.</p>
        )}
      </section>
    </div>
  );
}
