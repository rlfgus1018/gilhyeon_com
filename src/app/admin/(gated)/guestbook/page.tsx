import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdminPage } from "@/lib/admin/guard";
import { GuestbookRowActions, UnblockButton } from "@/components/admin/guestbook-row-actions";
import { cursorFilter, decodeCursor, encodeCursor } from "@/lib/guestbook/cursor";
import { ADMIN_PAGE_SIZE } from "@/lib/guestbook/moderation";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "public", label: "공개" },
  { key: "hidden", label: "숨김" },
  { key: "blocked", label: "차단 사용자" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

type Row = {
  id: string;
  user_id: string;
  author_name: string;
  avatar_url: string | null;
  message: string;
  color: string;
  is_hidden: boolean;
  created_at: string;
};
type Blocked = { user_id: string; reason: string | null; created_at: string };

const timeFmt = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

function hrefFor(filter: Filter, q: string, cursor?: string | null) {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("status", filter);
  if (q) p.set("q", q);
  if (cursor) p.set("cursor", cursor);
  const s = p.toString();
  return s ? `/admin/guestbook?${s}` : "/admin/guestbook";
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="border-coral bg-coral-soft rounded-xl border px-4 py-3 text-sm">
      {children}
    </p>
  );
}

/** 방명록 모더레이션 콘솔 (plan.md §8.5) */
export default async function AdminGuestbookPage({ searchParams }: PageProps<"/admin/guestbook">) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.key === sp.status) ? sp.status : "all") as Filter;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 40) : "";
  const cursor = decodeCursor(typeof sp.cursor === "string" ? sp.cursor : null);
  const { supabase, user } = await requireAdminPage();

  const blockedRes = await supabase.rpc("admin_list_blocked");
  const blocked = ((blockedRes.data ?? []) as Blocked[]).sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );
  const blockedIds = new Set(blocked.map((b) => b.user_id));

  const head = (
    <>
      <header>
        <h1 className="text-2xl font-bold">방명록</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          글을 숨기거나 삭제하고, 문제 사용자를 차단합니다. 변경은 홈과 방명록에 바로 반영돼요.
        </p>
      </header>
      <nav aria-label="방명록 필터" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={hrefFor(f.key, f.key === "blocked" ? "" : q)}
            aria-current={filter === f.key ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm ${filter === f.key ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"}`}
          >
            {f.label}
            {f.key === "blocked" && blocked.length > 0 && ` ${blocked.length}`}
          </Link>
        ))}
      </nav>
    </>
  );

  if (filter === "blocked") {
    // 차단 사용자의 표시 이름은 그 사용자의 가장 최근 글에서 가져온다
    const names = new Map<string, string>();
    if (blocked.length) {
      const { data } = await supabase
        .from("guestbook")
        .select("user_id,author_name,created_at")
        .in("user_id", [...blockedIds])
        .order("created_at", { ascending: false });
      for (const r of (data ?? []) as Pick<Row, "user_id" | "author_name">[])
        if (!names.has(r.user_id)) names.set(r.user_id, r.author_name);
    }
    return (
      <div className="space-y-6">
        {head}
        {blockedRes.error ? (
          <Alert>차단 목록을 불러오지 못했어요: {blockedRes.error.message}</Alert>
        ) : blocked.length === 0 ? (
          <p className="text-muted-foreground card-surface p-8 text-center text-sm">
            차단한 사용자가 없어요.
          </p>
        ) : (
          <ul className="card-surface divide-y overflow-hidden">
            {blocked.map((b) => {
              const name = names.get(b.user_id) ?? "(글 없음)";
              return (
                <li key={b.user_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {timeFmt.format(new Date(b.created_at))} 차단
                      {b.reason ? ` · ${b.reason}` : ""}
                    </p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                      {b.user_id}
                    </p>
                  </div>
                  <UnblockButton userId={b.user_id} label={name} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  let query = supabase
    .from("guestbook")
    .select("id,user_id,author_name,avatar_url,message,color,is_hidden,created_at");
  if (filter === "public") query = query.eq("is_hidden", false);
  if (filter === "hidden") query = query.eq("is_hidden", true);
  if (q) query = query.ilike("author_name", `%${q.replace(/[\\%_]/g, "\\$&")}%`);
  if (cursor) query = query.or(cursorFilter(cursor));
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(ADMIN_PAGE_SIZE + 1);
  const all = (data ?? []) as Row[];
  const rows = all.slice(0, ADMIN_PAGE_SIZE);
  const last = rows[rows.length - 1];
  const next =
    all.length > ADMIN_PAGE_SIZE && last
      ? encodeCursor({ created_at: last.created_at, id: last.id })
      : null;

  return (
    <div className="space-y-6">
      {head}
      <form action="/admin/guestbook" className="flex max-w-sm gap-2" role="search">
        {filter !== "all" && <input type="hidden" name="status" value={filter} />}
        <label htmlFor="guestbook-q" className="sr-only">
          작성자 이름 검색
        </label>
        <Input
          id="guestbook-q"
          name="q"
          defaultValue={q}
          maxLength={40}
          placeholder="작성자 이름 검색"
        />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {error ? (
        <Alert>{error.message}</Alert>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground card-surface p-8 text-center text-sm">
          {q || cursor ? "조건에 맞는 글이 없어요." : "아직 방명록 글이 없어요."}
        </p>
      ) : (
        <ul className="card-surface divide-y overflow-hidden">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
              {r.avatar_url ? (
                <Image
                  src={r.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="mt-0.5 size-8 rounded-full"
                />
              ) : (
                <span
                  aria-hidden
                  data-accent={r.color}
                  className="bg-tone mt-0.5 size-8 rounded-full"
                />
              )}
              <div className="min-w-0 flex-1 basis-64">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="font-medium">{r.author_name}</span>
                  <span className="text-muted-foreground text-xs">
                    {timeFmt.format(new Date(r.created_at))}
                  </span>
                  {r.is_hidden ? <Badge variant="secondary">숨김</Badge> : <Badge>공개</Badge>}
                  {blockedIds.has(r.user_id) && <Badge variant="destructive">차단됨</Badge>}
                  {r.user_id === user.id && <Badge variant="outline">내 글</Badge>}
                </p>
                <p className="mt-1 text-sm break-words whitespace-pre-wrap">{r.message}</p>
              </div>
              <GuestbookRowActions
                id={r.id}
                userId={r.user_id}
                authorName={r.author_name}
                hidden={r.is_hidden}
                blocked={blockedIds.has(r.user_id)}
                isSelf={r.user_id === user.id}
              />
            </li>
          ))}
        </ul>
      )}

      {(cursor || next) && (
        <div className="flex items-center justify-between text-sm">
          {cursor ? (
            <Link href={hrefFor(filter, q)} className="hover:underline">
              ← 처음으로
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={hrefFor(filter, q, next)} className="font-medium hover:underline">
              다음 {ADMIN_PAGE_SIZE}개 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
