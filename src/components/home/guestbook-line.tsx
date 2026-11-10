import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import type { GuestbookPublicEntry } from "@/lib/content/guestbook";

type Props = { ok: boolean; entries: GuestbookPublicEntry[]; count: number | null };

function summary({ ok, entries, count }: Props) {
  if (!ok) return "방명록에 한마디 남길 수 있어요.";
  if (entries.length === 0) return "방명록의 첫 메시지를 남겨주세요.";
  if (count === null) return "방명록에 남겨진 메시지가 있어요.";
  return `방명록에 ${count.toLocaleString("ko-KR")}개의 메시지가 있어요.`;
}

/** 홈의 마지막 줄: 방명록 안내와 연락 방법 */
export function GuestbookLine(props: Props) {
  const latest = props.ok ? props.entries[0] : undefined;
  return (
    <section
      aria-label="방명록과 연락"
      data-accent="violet"
      className="border-tone space-y-3 border-t-4 pt-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <p className="text-body min-w-0">
          {summary(props)}
          {latest && (
            <span className="text-muted-foreground ml-2 break-words">최근: “{latest.message}”</span>
          )}
        </p>
        <Link
          href="/guestbook"
          className="text-tone-ink text-body shrink-0 font-medium underline-offset-4 hover:underline"
        >
          남기러 가기
        </Link>
      </div>
      <p className="text-muted-foreground text-aux">
        커피챗은{" "}
        <a
          href={`mailto:${siteConfig.email}`}
          className="text-foreground underline underline-offset-2"
        >
          이메일
        </a>
        로 편하게 연락 주세요.
      </p>
    </section>
  );
}
