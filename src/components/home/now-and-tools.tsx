import { SectionHeading } from "@/components/home/section-heading";
import { StackIcon } from "@/components/home/stack-icon";
import type { SiteData } from "@/lib/admin/site-schemas";

/** 내용이 없는 쪽은 그리지 않는다 (design-audit.md §5.6) */
export function NowAndTools({ now, stack }: { now: SiteData["now"]; stack: SiteData["stack"] }) {
  if (now.items.length === 0 && stack.length === 0) return null;
  return (
    <div data-accent="amber" className="grid gap-12 md:grid-cols-2">
      {now.items.length > 0 && (
        <section aria-labelledby="now">
          <SectionHeading id="now" title="요즘 하는 일" />
          <ul className="text-body list-disc space-y-2 pl-5">
            {now.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </section>
      )}
      {stack.length > 0 && (
        <section aria-labelledby="tools">
          <SectionHeading id="tools" title="자주 쓰는 도구" />
          <ul className="text-aux flex flex-wrap gap-x-5 gap-y-3">
            {stack.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <StackIcon slug={s.key} className="size-4" />
                {s.label}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
