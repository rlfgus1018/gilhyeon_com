import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/home/section-heading";
import type { SiteData } from "@/lib/admin/site-schemas";

export function Interests({ items }: { items: SiteData["interests"] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="interests" data-accent="amber">
      <SectionHeading id="interests" title="관심 분야" />
      <ul className="text-body grid gap-x-8 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.label} className="border-b py-2.5 font-medium">
            {it.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Timeline({ items }: { items: SiteData["timeline"] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="timeline" data-accent="amber">
      <SectionHeading id="timeline" title="타임라인" />
      <ol className="relative space-y-8 border-l pl-6">
        {items.map((it, i) => (
          <li key={`${it.period}-${i}`} className="relative">
            <span
              aria-hidden
              className="bg-tone ring-background absolute top-1.5 -left-[31px] size-3 rounded-full ring-4"
            />
            <p className="text-muted-foreground text-aux">{it.period}</p>
            <h3 className="text-item mt-0.5 font-semibold">{it.title}</h3>
            {it.description && (
              <p className="text-muted-foreground text-body mt-1 leading-relaxed">
                {it.description}
              </p>
            )}
            {it.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {it.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
