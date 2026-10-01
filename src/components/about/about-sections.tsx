import * as Lucide from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SiteData } from "@/lib/admin/site-schemas";

function iconFor(name: string) {
  const pascal =
    name
      .split(/[-_ ]+/)
      .filter(Boolean)
      .map((s) => s[0].toUpperCase() + s.slice(1))
      .join("") + "Icon";
  const C = (Lucide as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    pascal
  ];
  return C ?? null;
}

const ACCENTS = ["brand", "coral", "amber", "mint", "sky", "violet"];

export function Interests({ items }: { items: SiteData["interests"] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="interests">
      <h2 id="interests" className="mb-4 text-2xl font-bold">
        관심 분야
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon ? iconFor(it.icon) : null;
          return (
            <li
              key={it.label}
              data-accent={ACCENTS[i % ACCENTS.length]}
              className="card-surface flex items-center gap-3 p-4"
            >
              <span className="bg-tone-soft text-tone flex size-9 shrink-0 items-center justify-center rounded-xl">
                {Icon ? (
                  <Icon className="size-4" />
                ) : (
                  <span aria-hidden className="bg-tone size-2 rounded-full" />
                )}
              </span>
              <span className="font-medium">{it.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Timeline({ items }: { items: SiteData["timeline"] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="timeline">
      <h2 id="timeline" className="mb-6 text-2xl font-bold">
        타임라인
      </h2>
      <ol className="relative space-y-8 border-l pl-6">
        {items.map((it, i) => (
          <li
            key={`${it.period}-${i}`}
            data-accent={ACCENTS[i % ACCENTS.length]}
            className="relative"
          >
            <span
              aria-hidden
              className="bg-tone ring-background absolute top-1.5 -left-[31px] size-3 rounded-full ring-4"
            />
            <p className="text-muted-foreground text-sm">{it.period}</p>
            <h3 className="mt-0.5 font-semibold">{it.title}</h3>
            {it.description && (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{it.description}</p>
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
