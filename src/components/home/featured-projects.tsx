import Link from "next/link";
import Image from "next/image";
import { SectionHeading } from "@/components/home/section-heading";
import type { ProjectSummary } from "@/lib/content/projects";

export function FeaturedProjects({ items, ok }: { items: ProjectSummary[]; ok: boolean }) {
  if (ok && items.length === 0) return null;
  return (
    <section aria-labelledby="featured-projects" data-accent="mint">
      <SectionHeading id="featured-projects" title="프로젝트" href="/projects" />
      {!ok ? (
        <p className="text-muted-foreground text-body">프로젝트를 잠시 불러올 수 없어요.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.id}
              href={p.has_body ? `/projects/${p.slug}` : "/projects"}
              className="card-surface card-surface-hover flex flex-col overflow-hidden"
            >
              {p.thumbnail?.url ? (
                <div className="bg-muted relative aspect-[2/1]">
                  <Image
                    src={p.thumbnail.url}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-tone text-on-tone flex aspect-[3/1] items-end p-5">
                  <h3 className="text-item font-bold">{p.title}</h3>
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                {p.thumbnail?.url && <h3 className="text-item font-semibold">{p.title}</h3>}
                <p className="text-muted-foreground text-body line-clamp-2">{p.summary}</p>
                {p.tech.length > 0 && (
                  <p className="text-muted-foreground text-aux">{p.tech.join(", ")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
