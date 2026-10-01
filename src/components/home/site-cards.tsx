import Link from "next/link";
import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import type { GuestbookPublicEntry } from "@/lib/content/guestbook";
import type { ProjectSummary } from "@/lib/content/projects";

type Props = {
  guestbook: { ok: boolean; entries: GuestbookPublicEntry[]; count: number | null };
  projects: { ok: boolean; items: ProjectSummary[] };
};

export function SiteCards({ guestbook, projects }: Props) {
  return (
    <section aria-label="사이트" className="grid gap-4 md:grid-cols-2">
      <Link
        href="/guestbook"
        data-accent="violet"
        className="card-surface card-surface-hover group relative flex flex-col p-5"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="bg-tone size-2 rounded-full" />
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Guestbook
          </h3>
          {guestbook.ok && guestbook.count !== null && (
            <span className="text-muted-foreground ml-auto text-xs">
              {guestbook.count.toLocaleString("ko-KR")}개
            </span>
          )}
        </div>
        <div className="mt-3 flex-1 space-y-2">
          {!guestbook.ok ? (
            <p className="text-muted-foreground text-sm">방명록을 잠시 불러올 수 없어요.</p>
          ) : guestbook.entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 첫 메시지가 없어요. 첫 번째로 남겨볼까요?
            </p>
          ) : (
            guestbook.entries.map((e) => (
              <div
                key={e.id}
                data-accent={e.color}
                className="bg-tone-soft/50 flex items-start gap-2 rounded-xl px-3 py-2 text-sm"
              >
                {e.avatar_url ? (
                  <Image
                    src={e.avatar_url}
                    alt=""
                    width={20}
                    height={20}
                    className="mt-0.5 size-5 rounded-full"
                  />
                ) : (
                  <span aria-hidden className="bg-tone mt-0.5 size-5 shrink-0 rounded-full" />
                )}
                <p className="line-clamp-2">
                  <span className="font-medium">{e.author_name}</span>{" "}
                  <span className="text-muted-foreground">{e.message}</span>
                </p>
              </div>
            ))
          )}
        </div>
        <ArrowUpRightIcon
          aria-hidden
          className="text-muted-foreground group-hover:text-tone absolute right-5 bottom-5 size-4"
        />
      </Link>

      <Link
        href="/projects"
        data-accent="mint"
        className="card-surface card-surface-hover group relative flex flex-col p-5"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="bg-tone size-2 rounded-full" />
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Projects
          </h3>
        </div>
        <div className="mt-3 flex-1 space-y-2">
          {!projects.ok ? (
            <p className="text-muted-foreground text-sm">프로젝트를 잠시 불러올 수 없어요.</p>
          ) : projects.items.length === 0 ? (
            <p className="text-muted-foreground text-sm">프로젝트를 정리하고 있어요.</p>
          ) : (
            projects.items.slice(0, 2).map((p) => (
              <div key={p.id} className="text-sm">
                <p className="font-medium">{p.title}</p>
                <p className="text-muted-foreground line-clamp-1 text-xs">{p.summary}</p>
              </div>
            ))
          )}
        </div>
        <ArrowUpRightIcon
          aria-hidden
          className="text-muted-foreground group-hover:text-tone absolute right-5 bottom-5 size-4"
        />
      </Link>
    </section>
  );
}
